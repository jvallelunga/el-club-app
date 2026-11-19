"use client";

/**
 * Visor 3D del predio, de solo lectura (#44, variante D del mock).
 *
 * Piso de pasto estilizado (sin foto satelital) y cada instalación ubicada y
 * cada elemento de referencia (#46), caminos y vallas incluidos (#47: siguen
 * sus puntos), armados con las piezas de su tipo
 * (src/dominio/predio-3d.ts). Se orbita y se hace zoom. Dibuja solo cuando
 * algo cambia: no hay un bucle de animación.
 *
 * Lo que entra en la leyenda lleva su número encima (#45). Solo eso se puede
 * tocar: el número o el elemento. Lo demás es decorado.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { puntoMedioDeLinea, type Punto } from "@/dominio/predio";
import {
  piezasDeInstalacion,
  piezasDeLinea,
  piezasDeReferencia,
  type Pieza,
  type PredioEnVisor,
} from "@/dominio/predio-3d";

const CIELO = "#cfe6f5";
const PASTO_AFUERA = "#6f8f52";
const PASTO_CLARO = "#a3d173";
const PASTO_OSCURO = "#93c463";
/** Cada franja del corte de pasto, en metros. */
const FRANJA = 8;

/** Altura del número sobre lo más alto del elemento, en metros. */
const ALTURA_NUMERO = 4;
/** Cuánto se puede mover el puntero entre bajar y soltar para que sea un toque. */
const TOLERANCIA_TOQUE = 4;

/** Metros [este, norte] → escena (x, z): el norte va hacia −z. */
const enEscena = ([este, norte]: Punto, y = 0) => new THREE.Vector3(este, y, -norte);

/** Franjas de pasto cortado, como un césped recién cortado. */
function texturaPasto(): THREE.Texture {
  const lienzo = document.createElement("canvas");
  lienzo.width = 2;
  lienzo.height = 2;
  const ctx = lienzo.getContext("2d")!;
  ctx.fillStyle = PASTO_CLARO;
  ctx.fillRect(0, 0, 1, 2);
  ctx.fillStyle = PASTO_OSCURO;
  ctx.fillRect(1, 0, 1, 2);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.magFilter = THREE.NearestFilter;
  textura.colorSpace = THREE.SRGBColorSpace;
  // Las UV del área son metros: una vuelta de la textura son dos franjas.
  textura.repeat.set(1 / (2 * FRANJA), 1 / (2 * FRANJA));
  return textura;
}

/** Geometría de lado 1 para cada forma; la malla la estira a su tamaño. */
function geometriaUnitaria(forma: Pieza["forma"]): THREE.BufferGeometry {
  switch (forma) {
    case "caja":
      return new THREE.BoxGeometry(1, 1, 1);
    case "techo": {
      // Pirámide de base cuadrada de lado 1.
      const geometria = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
      geometria.rotateY(Math.PI / 4);
      return geometria;
    }
    case "cilindro":
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
    case "esfera":
      return new THREE.SphereGeometry(0.5, 16, 12);
    case "roca":
      return new THREE.DodecahedronGeometry(0.5);
  }
}

function mallaDePieza(pieza: Pieza, material: THREE.Material): THREE.Mesh {
  const malla = new THREE.Mesh(geometriaUnitaria(pieza.forma), material);
  const [largo, alto, ancho] = pieza.tamano;
  malla.scale.set(largo, alto, ancho);
  malla.position.set(...pieza.centro);
  malla.rotation.y = pieza.giro ?? 0;
  malla.castShadow = alto > 0.5;
  malla.receiveShadow = true;
  return malla;
}

/** El número de la leyenda sobre un elemento: un botón que se puede tocar. */
function botonNumero(
  id: string,
  numero: number,
  nombre: string,
  onTocar: () => void,
): HTMLButtonElement {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.dataset.numeroDe = id;
  boton.textContent = String(numero);
  boton.title = nombre;
  boton.setAttribute("aria-label", `${numero}. ${nombre}`);
  boton.className =
    "pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[13px] font-bold text-white shadow-md data-[elegido=true]:bg-[#ffd23f] data-[elegido=true]:text-neutral-900";
  boton.addEventListener("click", (evento) => {
    evento.stopPropagation();
    onTocar();
  });
  return boton;
}

/**
 * Arma la escena. Devuelve lo que hay que liberar al desmontar y los grupos
 * que se pueden tocar (con su id en userData).
 */
function armarEscena(predio: PredioEnVisor, onTocar: (id: string) => void) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(CIELO);

  const materiales = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color: string) => {
    let m = materiales.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
      materiales.set(color, m);
    }
    return m;
  };

  // Tamaño del predio, para la luz, la niebla y la cámara.
  const caja = new THREE.Box3().setFromPoints(predio.area.map((p) => enEscena(p)));
  const centro = caja.getCenter(new THREE.Vector3());
  const tamano = Math.max(caja.getSize(new THREE.Vector3()).length(), 60);
  escena.fog = new THREE.Fog(CIELO, tamano * 1.5, tamano * 4);

  escena.add(new THREE.HemisphereLight("#ffffff", "#5d7a3a", 1.1));
  const sol = new THREE.DirectionalLight("#fff6e0", 1.6);
  sol.position.set(centro.x - tamano * 0.4, tamano * 0.7, centro.z + tamano * 0.35);
  sol.target.position.copy(centro);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, {
    left: -tamano * 0.7,
    right: tamano * 0.7,
    top: tamano * 0.7,
    bottom: -tamano * 0.7,
    far: tamano * 3,
  });
  escena.add(sol, sol.target);

  // Afuera del predio, pasto más oscuro.
  const afuera = new THREE.Mesh(new THREE.PlaneGeometry(tamano * 10, tamano * 10), material(PASTO_AFUERA));
  afuera.rotation.x = -Math.PI / 2;
  afuera.position.set(centro.x, -0.05, centro.z);
  afuera.receiveShadow = true;
  escena.add(afuera);

  // El área del predio, con el pasto cortado en franjas.
  const pasto = texturaPasto();
  const forma = new THREE.Shape(predio.area.map(([e, n]) => new THREE.Vector2(e, n)));
  const area = new THREE.Mesh(
    new THREE.ShapeGeometry(forma),
    new THREE.MeshStandardMaterial({ map: pasto, roughness: 1 }),
  );
  area.rotation.x = -Math.PI / 2;
  area.receiveShadow = true;
  escena.add(area);

  const borde = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(predio.area.map((p) => enEscena(p, 0.05))),
    new THREE.LineBasicMaterial({ color: "#f4f8ec" }),
  );
  escena.add(borde);

  const tocables: THREE.Object3D[] = [];
  const elementos: {
    id: string;
    nombre: string;
    numero: number | null;
    posicion: Punto;
    rotacion: number;
    piezas: Pieza[];
    /** Dónde va el número, si no es sobre el centro (un camino en L). */
    ancla?: Punto;
  }[] = [
    ...predio.instalaciones.map((i) => ({ ...i, piezas: piezasDeInstalacion(i.tipo, i.medidas) })),
    ...predio.referencias.map((r) => ({ ...r, piezas: piezasDeReferencia(r.tipo, r.medidas) })),
    // Los caminos y las vallas ya traen sus piezas en la escena (#47).
    ...predio.lineas.map((l) => ({
      ...l,
      posicion: [0, 0] as Punto,
      rotacion: 0,
      piezas: piezasDeLinea(l.tipo, l.puntos, l.medidas),
      ancla: puntoMedioDeLinea(l.puntos),
    })),
  ];
  for (const elemento of elementos) {
    const grupo = new THREE.Group();
    for (const pieza of elemento.piezas) {
      grupo.add(mallaDePieza(pieza, material(pieza.color)));
    }
    grupo.position.copy(enEscena(elemento.posicion));
    // La rotación va en sentido horario visto desde arriba; en three.js, un
    // ángulo positivo en y gira en sentido antihorario.
    grupo.rotation.y = -THREE.MathUtils.degToRad(elemento.rotacion);
    grupo.name = elemento.nombre;
    escena.add(grupo);

    if (elemento.numero === null) continue;
    grupo.userData.id = elemento.id;
    tocables.push(grupo);
    const marca = new CSS2DObject(
      botonNumero(elemento.id, elemento.numero, elemento.nombre, () => onTocar(elemento.id)),
    );
    const caja3 = new THREE.Box3().setFromObject(grupo);
    const arriba = elemento.ancla ? enEscena(elemento.ancla) : caja3.getCenter(new THREE.Vector3());
    marca.position.set(arriba.x, caja3.max.y + ALTURA_NUMERO, arriba.z);
    escena.add(marca);
  }

  return { escena, centro, tamano, tocables };
}

/** El id de lo que tiene número bajo el puntero, o null. */
function idTocado(
  evento: PointerEvent,
  lienzo: HTMLCanvasElement,
  camara: THREE.Camera,
  tocables: THREE.Object3D[],
): string | null {
  const r = lienzo.getBoundingClientRect();
  const puntero = new THREE.Vector2(
    ((evento.clientX - r.left) / r.width) * 2 - 1,
    -((evento.clientY - r.top) / r.height) * 2 + 1,
  );
  const rayo = new THREE.Raycaster();
  rayo.setFromCamera(puntero, camara);
  for (const choque of rayo.intersectObjects(tocables, true)) {
    let objeto: THREE.Object3D | null = choque.object;
    while (objeto && objeto.userData.id === undefined) objeto = objeto.parent;
    if (objeto) return objeto.userData.id as string;
  }
  return null;
}

export function VisorPredio({
  predio,
  etiqueta,
  seleccion = null,
  onElegir,
  className = "",
}: {
  predio: PredioEnVisor;
  /** Para lectores de pantalla, por ejemplo «Predio 3D de la sede Los Cardos». */
  etiqueta: string;
  /** El elemento con número elegido, que se marca en amarillo. */
  seleccion?: string | null;
  /** Al tocar algo con número (su id) o el resto del predio (null). */
  onElegir?: (id: string | null) => void;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [sinWebGL, setSinWebGL] = useState(false);
  // La escena se arma con el predio; el aviso al elegir puede cambiar sin rearmarla.
  const elegir = useRef(onElegir);
  useLayoutEffect(() => {
    elegir.current = onElegir;
  });

  useEffect(() => {
    const cont = contenedor.current;
    if (!cont) return;

    let render: THREE.WebGLRenderer;
    try {
      render = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el navegador no tiene WebGL
      setSinWebGL(true);
      return;
    }
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render.setSize(cont.clientWidth, cont.clientHeight);
    render.shadowMap.enabled = true;
    render.domElement.style.display = "block";
    cont.appendChild(render.domElement);

    const etiquetas = new CSS2DRenderer();
    etiquetas.setSize(cont.clientWidth, cont.clientHeight);
    Object.assign(etiquetas.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    cont.appendChild(etiquetas.domElement);

    const { escena, centro, tamano, tocables } = armarEscena(predio, (id) =>
      elegir.current?.(id),
    );
    const camara = new THREE.PerspectiveCamera(
      45,
      cont.clientWidth / Math.max(cont.clientHeight, 1),
      1,
      tamano * 8,
    );
    // Desde el sureste, en diagonal: se ven las alturas y todo el predio. En
    // un marco angosto (el celular) se aleja, para que entre a lo ancho.
    const alejar = Math.max(1, 1.4 / camara.aspect);
    camara.position.set(
      centro.x + tamano * 0.35 * alejar,
      tamano * 0.45 * alejar,
      centro.z + tamano * 0.6 * alejar,
    );

    const controles = new OrbitControls(camara, render.domElement);
    controles.target.copy(centro);
    controles.maxPolarAngle = Math.PI / 2.15;
    controles.minDistance = 15;
    controles.maxDistance = tamano * 2.5;
    controles.update();

    const dibujar = () => {
      render.render(escena, camara);
      etiquetas.render(escena, camara);
    };
    controles.addEventListener("change", dibujar);

    // Un toque (no un arrastre para orbitar) elige lo que tiene número.
    let abajo: [number, number] | null = null;
    const alBajar = (evento: PointerEvent) => {
      abajo = [evento.clientX, evento.clientY];
    };
    const alSoltar = (evento: PointerEvent) => {
      if (!abajo) return;
      const movido = Math.hypot(evento.clientX - abajo[0], evento.clientY - abajo[1]);
      abajo = null;
      if (movido > TOLERANCIA_TOQUE) return;
      elegir.current?.(idTocado(evento, render.domElement, camara, tocables));
    };
    render.domElement.addEventListener("pointerdown", alBajar);
    render.domElement.addEventListener("pointerup", alSoltar);

    const observador = new ResizeObserver(() => {
      const ancho = cont.clientWidth;
      const alto = cont.clientHeight;
      if (ancho === 0 || alto === 0) return;
      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
      render.setSize(ancho, alto);
      etiquetas.setSize(ancho, alto);
      dibujar();
    });
    observador.observe(cont);
    dibujar();

    return () => {
      render.domElement.removeEventListener("pointerdown", alBajar);
      render.domElement.removeEventListener("pointerup", alSoltar);
      observador.disconnect();
      controles.removeEventListener("change", dibujar);
      controles.dispose();
      escena.traverse((objeto) => {
        if (!(objeto instanceof THREE.Mesh || objeto instanceof THREE.Line)) return;
        objeto.geometry.dispose();
        const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
        for (const m of materiales) {
          (m as THREE.MeshStandardMaterial).map?.dispose();
          m.dispose();
        }
      });
      render.dispose();
      cont.removeChild(render.domElement);
      cont.removeChild(etiquetas.domElement);
    };
  }, [predio]);

  // El número elegido se marca sin rearmar la escena.
  useEffect(() => {
    const botones = contenedor.current?.querySelectorAll<HTMLElement>("[data-numero-de]") ?? [];
    for (const boton of botones) {
      boton.setAttribute("data-elegido", String(boton.dataset.numeroDe === seleccion));
    }
  }, [seleccion, predio]);

  return (
    <div
      ref={contenedor}
      // Con números, adentro hay botones: un «img» los escondería.
      role={predio.leyenda.length > 0 ? "group" : "img"}
      aria-label={etiqueta}
      className={`relative overflow-hidden ${className}`}
    >
      {sinWebGL ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Este navegador no puede mostrar el predio en 3D.
        </p>
      ) : null}
    </div>
  );
}
