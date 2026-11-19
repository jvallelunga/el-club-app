"use client";

/**
 * Visor 3D del predio, de solo lectura (#44, variante D del mock).
 *
 * Piso de pasto estilizado (sin foto satelital) y cada instalación ubicada
 * armada con las piezas de su tipo (src/dominio/predio-3d.ts). Se orbita y se
 * hace zoom. Dibuja solo cuando algo cambia: no hay un bucle de animación.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Punto } from "@/dominio/predio";
import { piezasDeInstalacion, type Pieza, type PredioEnVisor } from "@/dominio/predio-3d";

const CIELO = "#cfe6f5";
const PASTO_AFUERA = "#6f8f52";
const PASTO_CLARO = "#a3d173";
const PASTO_OSCURO = "#93c463";
/** Cada franja del corte de pasto, en metros. */
const FRANJA = 8;

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

function mallaDePieza(pieza: Pieza, material: THREE.Material): THREE.Mesh {
  const [largo, alto, ancho] = pieza.tamano;
  let malla: THREE.Mesh;
  if (pieza.forma === "techo") {
    // Pirámide de base cuadrada de lado 1, estirada a la base del edificio.
    const geometria = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
    geometria.rotateY(Math.PI / 4);
    malla = new THREE.Mesh(geometria, material);
    malla.scale.set(largo, alto, ancho);
  } else {
    malla = new THREE.Mesh(new THREE.BoxGeometry(largo, alto, ancho), material);
  }
  malla.position.set(...pieza.centro);
  malla.castShadow = alto > 0.5;
  malla.receiveShadow = true;
  return malla;
}

/** Arma la escena. Devuelve lo que hay que liberar al desmontar. */
function armarEscena(predio: PredioEnVisor) {
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

  for (const instalacion of predio.instalaciones) {
    const grupo = new THREE.Group();
    for (const pieza of piezasDeInstalacion(instalacion.tipo, instalacion.medidas)) {
      grupo.add(mallaDePieza(pieza, material(pieza.color)));
    }
    grupo.position.copy(enEscena(instalacion.posicion));
    // La rotación va en sentido horario visto desde arriba; en three.js, un
    // ángulo positivo en y gira en sentido antihorario.
    grupo.rotation.y = -THREE.MathUtils.degToRad(instalacion.rotacion);
    grupo.name = instalacion.nombre;
    escena.add(grupo);
  }

  return { escena, centro, tamano };
}

export function VisorPredio({
  predio,
  etiqueta,
  className = "",
}: {
  predio: PredioEnVisor;
  /** Para lectores de pantalla, por ejemplo «Predio 3D de la sede Los Cardos». */
  etiqueta: string;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [sinWebGL, setSinWebGL] = useState(false);

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

    const { escena, centro, tamano } = armarEscena(predio);
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

    const dibujar = () => render.render(escena, camara);
    controles.addEventListener("change", dibujar);

    const observador = new ResizeObserver(() => {
      const ancho = cont.clientWidth;
      const alto = cont.clientHeight;
      if (ancho === 0 || alto === 0) return;
      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
      render.setSize(ancho, alto);
      dibujar();
    });
    observador.observe(cont);
    dibujar();

    return () => {
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
    };
  }, [predio]);

  return (
    <div
      ref={contenedor}
      role="img"
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
