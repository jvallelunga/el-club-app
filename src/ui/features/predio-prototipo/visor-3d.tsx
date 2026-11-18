"use client";

/**
 * PROTOTIPO (#26): predio 3D de solo lectura con three.js.
 * Piso de pasto estilizado (sin foto satelital) y modelos armados con primitivas.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { type Elemento, type Punto, etiqueta, girar, numeros, tamano, tipoDe, ubicado } from "./datos";

const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });

/** Metros (este, norte) → escena (x, z). */
const v3 = ([e, n]: Punto, y = 0) => new THREE.Vector3(e, y, -n);

function caja(w: number, h: number, d: number, color: string) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function lineasCancha(g: THREE.Group, largo: number, ancho: number, color = "#ffffff") {
  const l = (w: number, d: number, x: number, z: number) => {
    const b = caja(w, 0.05, d, color);
    b.position.set(x, 0.06, z);
    g.add(b);
  };
  l(ancho, 0.25, 0, -largo / 2);
  l(ancho, 0.25, 0, largo / 2);
  l(0.25, largo, -ancho / 2, 0);
  l(0.25, largo, ancho / 2, 0);
  l(ancho, 0.2, 0, 0);
}

function modelo(el: Elemento): THREE.Group {
  const g = new THREE.Group();
  const def = tipoDe(el.tipo);
  const md = el.medidas;
  const { largo, ancho } = tamano(el);

  const piso = (color: string) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.1, largo), mat(color));
    p.receiveShadow = true;
    p.position.y = 0.02;
    g.add(p);
  };

  switch (el.tipo) {
    case "cancha_rugby": {
      piso("#4f9e4a");
      lineasCancha(g, md.largo, md.ancho);
      for (const z of [-md.largo / 2, md.largo / 2]) {
        for (const x of [-2.8, 2.8]) {
          const palo = caja(0.2, 11, 0.2, "#ffffff");
          palo.position.set(x, 5.5, z);
          g.add(palo);
        }
        const trav = caja(5.6, 0.2, 0.2, "#ffffff");
        trav.position.set(0, 3, z);
        g.add(trav);
      }
      break;
    }
    case "cancha_futbol":
      piso("#4f9e4a");
      lineasCancha(g, md.largo, md.ancho);
      break;
    case "cancha_hockey": {
      piso("#2f6fb0");
      lineasCancha(g, md.largo, md.ancho);
      break;
    }
    case "cancha_tenis": {
      piso("#c9683a");
      lineasCancha(g, md.largo * 0.65, md.ancho * 0.6);
      const red = caja(md.ancho * 0.65, 1, 0.05, "#222222");
      red.position.y = 0.5;
      g.add(red);
      break;
    }
    case "pileta": {
      const borde = caja(ancho + 3, 0.3, largo + 3, "#e8e2d4");
      borde.position.y = 0.15;
      g.add(borde);
      const agua = new THREE.Mesh(
        new THREE.BoxGeometry(ancho, 0.1, largo),
        mat("#36a9e1", { roughness: 0.2, metalness: 0.1 }),
      );
      agua.position.y = 0.31;
      g.add(agua);
      break;
    }
    case "house":
    case "vestuario":
    case "quincho":
    case "otra": {
      const alto = md.alto ?? 3;
      const cuerpo = caja(ancho, alto, largo, def.color);
      cuerpo.position.y = alto / 2;
      g.add(cuerpo);
      const techo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, ancho * 0.72, 2, 4, 1),
        mat("#8b4a3c"),
      );
      techo.scale.set(1, 1, largo / ancho);
      techo.rotation.y = Math.PI / 4;
      techo.position.y = alto + 1;
      techo.castShadow = true;
      g.add(techo);
      break;
    }
    case "arbol": {
      const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, md.altura * 0.45, 8),
        mat("#6b4a2f"),
      );
      tronco.position.y = (md.altura * 0.45) / 2;
      tronco.castShadow = true;
      g.add(tronco);
      const copa = new THREE.Mesh(new THREE.SphereGeometry(md.copa / 2, 12, 10), mat("#2f6b34"));
      copa.position.y = md.altura * 0.45 + md.copa * 0.3;
      copa.scale.y = 0.8;
      copa.castShadow = true;
      g.add(copa);
      break;
    }
    case "piedra": {
      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(md.diametro / 2), mat("#8a8a8a"));
      p.position.y = md.diametro / 3;
      p.castShadow = true;
      g.add(p);
      break;
    }
    case "bebedero": {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 12), mat("#9cc9e3"));
      b.position.y = 0.5;
      g.add(b);
      break;
    }
    case "gradas":
    case "tribuna": {
      const n = md.escalones ?? 4;
      for (let i = 0; i < n; i++) {
        const esc = caja(0.8, 0.45 * (i + 1), md.largo, "#d6d6d6");
        esc.position.set(-ancho / 2 + 0.4 + i * 0.8, (0.45 * (i + 1)) / 2, 0);
        g.add(esc);
      }
      if (el.tipo === "tribuna") {
        const alto = 0.45 * n + 2.5;
        const techo = caja(ancho + 1, 0.15, md.largo + 1, "#4d5a66");
        techo.position.y = alto;
        g.add(techo);
        for (const z of [-md.largo / 2, 0, md.largo / 2]) {
          const poste = caja(0.15, alto, 0.15, "#4d5a66");
          poste.position.set(ancho / 2, alto / 2, z);
          g.add(poste);
        }
      }
      break;
    }
  }
  return g;
}

function modeloLinea(el: Elemento): THREE.Group {
  const g = new THREE.Group();
  const pts = el.puntos ?? [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = v3(pts[i]);
    const b = v3(pts[i + 1]);
    const largo = a.distanceTo(b);
    const medio = a.clone().add(b).multiplyScalar(0.5);
    const ang = Math.atan2(b.x - a.x, b.z - a.z);
    if (el.tipo === "camino") {
      const tramo = new THREE.Mesh(
        new THREE.BoxGeometry(el.medidas.ancho ?? 4, 0.08, largo + (el.medidas.ancho ?? 4)),
        mat("#cdb88f"),
      );
      tramo.position.copy(medio).setY(0.04);
      tramo.rotation.y = ang;
      tramo.receiveShadow = true;
      g.add(tramo);
    } else {
      const alto = el.medidas.alto ?? 1.5;
      const riel = caja(0.08, 0.08, largo, "#f2f2f2");
      riel.position.copy(medio).setY(alto);
      riel.rotation.y = ang;
      g.add(riel);
      const nPostes = Math.max(2, Math.round(largo / 3));
      for (let k = 0; k <= nPostes; k++) {
        const p = a.clone().lerp(b, k / nPostes);
        const poste = caja(0.12, alto, 0.12, "#f2f2f2");
        poste.position.copy(p).setY(alto / 2);
        g.add(poste);
      }
    }
  }
  return g;
}

export function Visor3D({
  elementos,
  area,
  seleccion,
  onElegir,
  className = "",
}: {
  elementos: Elemento[];
  area: Punto[];
  seleccion?: string | null;
  onElegir?: (id: string | null) => void;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const elegir = useRef(onElegir);
  useLayoutEffect(() => {
    elegir.current = onElegir;
  });
  const camaraGuardada = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const cont = contenedor.current;
    if (!cont) return;
    const ancho = cont.clientWidth;
    const alto = cont.clientHeight;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color("#cfe6f5");
    escena.fog = new THREE.Fog("#cfe6f5", 350, 900);

    const camara = new THREE.PerspectiveCamera(45, ancho / alto, 1, 3000);
    const render = new THREE.WebGLRenderer({ antialias: true });
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render.setSize(ancho, alto);
    render.shadowMap.enabled = true;
    cont.appendChild(render.domElement);

    const etiquetas = new CSS2DRenderer();
    etiquetas.setSize(ancho, alto);
    etiquetas.domElement.style.position = "absolute";
    etiquetas.domElement.style.inset = "0";
    etiquetas.domElement.style.pointerEvents = "none";
    cont.appendChild(etiquetas.domElement);

    escena.add(new THREE.HemisphereLight("#ffffff", "#5d7a3a", 1.1));
    const sol = new THREE.DirectionalLight("#fff6e0", 1.6);
    sol.position.set(-150, 220, 120);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    Object.assign(sol.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, far: 800 });
    escena.add(sol);

    // Piso: afuera más oscuro, el área del predio en pasto claro.
    const afuera = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat("#6f8f52"));
    afuera.rotation.x = -Math.PI / 2;
    afuera.position.y = -0.05;
    afuera.receiveShadow = true;
    escena.add(afuera);
    const forma = new THREE.Shape(area.map(([e, n]) => new THREE.Vector2(e, n)));
    const predio = new THREE.Mesh(new THREE.ShapeGeometry(forma), mat("#9fcf6e"));
    predio.rotation.x = -Math.PI / 2;
    predio.receiveShadow = true;
    escena.add(predio);

    const nums = numeros(elementos);
    const clickeables: THREE.Object3D[] = [];
    for (const el of elementos) {
      if (!ubicado(el)) continue;
      let g: THREE.Group;
      if (el.puntos) {
        g = modeloLinea(el);
      } else {
        g = modelo(el);
        g.position.copy(v3([el.x ?? 0, el.y ?? 0]));
        g.rotation.y = -((el.rot ?? 0) * Math.PI) / 180;
      }
      g.traverse((o) => (o.userData.id = el.id));
      if (el.id === seleccion) {
        const caja3 = new THREE.BoxHelper(g, "#ffd23f");
        escena.add(caja3);
      }
      escena.add(g);
      clickeables.push(g);

      const n = nums.get(el.id);
      if (n) {
        const div = document.createElement("button");
        div.type = "button";
        div.textContent = String(n);
        div.title = etiqueta(el);
        div.style.cssText = `pointer-events:auto;cursor:pointer;width:28px;height:28px;border-radius:999px;border:2px solid #fff;background:${el.id === seleccion ? "#ffd23f" : "#111"};color:${el.id === seleccion ? "#111" : "#fff"};font:700 13px system-ui;box-shadow:0 2px 6px #0005`;
        div.onclick = (ev) => {
          ev.stopPropagation();
          elegir.current?.(el.id);
        };
        const obj = new CSS2DObject(div);
        const caja = new THREE.Box3().setFromObject(g);
        const c = caja.getCenter(new THREE.Vector3());
        obj.position.set(c.x, caja.max.y + 4, c.z);
        escena.add(obj);
      }
    }

    // Cámara: encuadre del área, o la última posición si se reconstruye la escena.
    const controles = new OrbitControls(camara, render.domElement);
    controles.enableDamping = true;
    controles.maxPolarAngle = Math.PI / 2.15;
    controles.minDistance = 30;
    controles.maxDistance = 900;
    if (camaraGuardada.current) {
      camara.position.copy(camaraGuardada.current.pos);
      controles.target.copy(camaraGuardada.current.target);
    } else {
      const caja = new THREE.Box3().setFromPoints(area.map((p) => v3(p)));
      const c = caja.getCenter(new THREE.Vector3());
      const tam = caja.getSize(new THREE.Vector3()).length();
      controles.target.copy(c);
      const [e, n] = girar(0, tam * 0.55, 47 + 200);
      camara.position.set(c.x + e, tam * 0.38, c.z - n);
    }
    controles.update();

    const ray = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    let abajo: [number, number] | null = null;
    const alBajar = (ev: PointerEvent) => (abajo = [ev.clientX, ev.clientY]);
    const alSoltar = (ev: PointerEvent) => {
      if (!abajo || Math.hypot(ev.clientX - abajo[0], ev.clientY - abajo[1]) > 4) return;
      const r = render.domElement.getBoundingClientRect();
      puntero.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(puntero, camara);
      const hit = ray.intersectObjects(clickeables, true)[0];
      const id = hit?.object.userData.id as string | undefined;
      // Solo se puede tocar lo que tiene número.
      elegir.current?.(id && nums.has(id) ? id : null);
    };
    render.domElement.addEventListener("pointerdown", alBajar);
    render.domElement.addEventListener("pointerup", alSoltar);

    const alCambiarTam = () => {
      const w = cont.clientWidth;
      const h = cont.clientHeight;
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
      render.setSize(w, h);
      etiquetas.setSize(w, h);
    };
    const obs = new ResizeObserver(alCambiarTam);
    obs.observe(cont);

    let cuadro = 0;
    const animar = () => {
      cuadro = requestAnimationFrame(animar);
      controles.update();
      render.render(escena, camara);
      etiquetas.render(escena, camara);
    };
    animar();

    return () => {
      camaraGuardada.current = { pos: camara.position.clone(), target: controles.target.clone() };
      cancelAnimationFrame(cuadro);
      obs.disconnect();
      controles.dispose();
      render.dispose();
      escena.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      cont.removeChild(render.domElement);
      cont.removeChild(etiquetas.domElement);
    };
  }, [elementos, area, seleccion]);

  return <div ref={contenedor} className={`relative overflow-hidden ${className}`} />;
}
