/**
 * PROTOTIPO (#26): datos de ejemplo del predio de Los Cardos para los mocks.
 * Posiciones aproximadas, medidas a ojo sobre la imagen satelital.
 * Se tira cuando se aprueben los mocks.
 */

export type Punto = [number, number]; // metros: [este, norte] desde el origen

export type Clase = "instalacion" | "referencia";

export type Elemento = {
  id: string;
  clase: Clase;
  tipo: string;
  /** Nombre: el de la instalación, u opcional en un elemento de referencia. */
  nombre?: string;
  descripcion?: string;
  enLeyenda: boolean;
  /** Sin posición = instalación sin ubicar. */
  x?: number;
  y?: number;
  /** Grados, sentido horario desde el norte. */
  rot?: number;
  medidas: Record<string, number>;
  /** Caminos y vallas. */
  puntos?: Punto[];
};

export type Medida = { clave: string; etiqueta: string; unidad: string };

export type TipoDef = {
  clave: string;
  nombre: string;
  clase: Clase;
  icono: string;
  linea?: boolean;
  medidas: Medida[];
  porDefecto: Record<string, number>;
  color: string;
};

const m = (clave: string, etiqueta: string, unidad = "m"): Medida => ({
  clave,
  etiqueta,
  unidad,
});

export const TIPOS: TipoDef[] = [
  { clave: "cancha_rugby", nombre: "Cancha de rugby", clase: "instalacion", icono: "🏉", medidas: [m("largo", "Largo"), m("ancho", "Ancho"), m("ingoal", "In-goal")], porDefecto: { largo: 100, ancho: 70, ingoal: 10 }, color: "#3f9b4f" },
  { clave: "cancha_hockey", nombre: "Cancha de hockey", clase: "instalacion", icono: "🏑", medidas: [m("largo", "Largo"), m("ancho", "Ancho")], porDefecto: { largo: 91.4, ancho: 55 }, color: "#2f7fc1" },
  { clave: "cancha_tenis", nombre: "Cancha de tenis", clase: "instalacion", icono: "🎾", medidas: [m("largo", "Largo"), m("ancho", "Ancho")], porDefecto: { largo: 36, ancho: 18 }, color: "#d0703c" },
  { clave: "cancha_futbol", nombre: "Cancha de fútbol", clase: "instalacion", icono: "⚽", medidas: [m("largo", "Largo"), m("ancho", "Ancho")], porDefecto: { largo: 100, ancho: 64 }, color: "#3f9b4f" },
  { clave: "pileta", nombre: "Pileta", clase: "instalacion", icono: "🏊", medidas: [m("largo", "Largo"), m("ancho", "Ancho")], porDefecto: { largo: 25, ancho: 12 }, color: "#4fb3e8" },
  { clave: "house", nombre: "House", clase: "instalacion", icono: "🏠", medidas: [m("largo", "Largo"), m("ancho", "Ancho"), m("alto", "Alto")], porDefecto: { largo: 30, ancho: 15, alto: 5 }, color: "#c9b28f" },
  { clave: "vestuario", nombre: "Vestuario", clase: "instalacion", icono: "🚿", medidas: [m("largo", "Largo"), m("ancho", "Ancho"), m("alto", "Alto")], porDefecto: { largo: 15, ancho: 8, alto: 3.5 }, color: "#b9a589" },
  { clave: "quincho", nombre: "Quincho", clase: "instalacion", icono: "🔥", medidas: [m("largo", "Largo"), m("ancho", "Ancho"), m("alto", "Alto")], porDefecto: { largo: 14, ancho: 9, alto: 4 }, color: "#a97b52" },
  { clave: "otra", nombre: "Otra", clase: "instalacion", icono: "▭", medidas: [m("largo", "Largo"), m("ancho", "Ancho"), m("alto", "Alto")], porDefecto: { largo: 10, ancho: 10, alto: 3 }, color: "#9a9a9a" },
  { clave: "arbol", nombre: "Árbol", clase: "referencia", icono: "🌳", medidas: [m("altura", "Altura"), m("copa", "Diámetro de copa")], porDefecto: { altura: 10, copa: 7 }, color: "#2e6b34" },
  { clave: "camino", nombre: "Camino", clase: "referencia", icono: "═", linea: true, medidas: [m("ancho", "Ancho")], porDefecto: { ancho: 4 }, color: "#c8b48a" },
  { clave: "valla", nombre: "Valla", clase: "referencia", icono: "┃", linea: true, medidas: [m("alto", "Alto")], porDefecto: { alto: 1.5 }, color: "#eeeeee" },
  { clave: "piedra", nombre: "Piedra", clase: "referencia", icono: "●", medidas: [m("diametro", "Diámetro")], porDefecto: { diametro: 2 }, color: "#8a8a8a" },
  { clave: "gradas", nombre: "Gradas", clase: "referencia", icono: "▤", medidas: [m("largo", "Largo"), m("escalones", "Escalones", "")], porDefecto: { largo: 20, escalones: 4 }, color: "#d8d8d8" },
  { clave: "tribuna", nombre: "Tribuna", clase: "referencia", icono: "▥", medidas: [m("largo", "Largo"), m("escalones", "Escalones", "")], porDefecto: { largo: 30, escalones: 6 }, color: "#d8d8d8" },
  { clave: "bebedero", nombre: "Bebedero", clase: "referencia", icono: "⛲", medidas: [], porDefecto: {}, color: "#7fb6d8" },
];

export const tipoDe = (clave: string) =>
  TIPOS.find((t) => t.clave === clave) ?? TIPOS[0];

export const ORIGEN = { lat: -37.33599, lng: -59.08072 };

/** Rotación de la grilla del club: las canchas siguen las calles, a 47°. */
const R = 47;

export const AREA_INICIAL: Punto[] = [
  [-85, 6],
  [35, 120],
  [215, -48],
  [83, -184],
  [-10, -156],
  [-100, -80],
];

export const ELEMENTOS_INICIALES: Elemento[] = [
  { id: "i1", clase: "instalacion", tipo: "cancha_rugby", nombre: "Cancha 1", descripcion: "La cancha principal, donde juega el Plantel Superior.", enLeyenda: true, x: -30, y: -70, rot: R, medidas: { largo: 100, ancho: 68, ingoal: 8 } },
  { id: "i2", clase: "instalacion", tipo: "cancha_hockey", nombre: "Cancha de hockey", enLeyenda: true, x: 88, y: -29, rot: R, medidas: { largo: 91.4, ancho: 55 } },
  { id: "i3", clase: "instalacion", tipo: "cancha_tenis", nombre: "Cancha de tenis", enLeyenda: true, x: 22, y: -5, rot: R, medidas: { largo: 36, ancho: 30 } },
  { id: "i4", clase: "instalacion", tipo: "pileta", nombre: "Pileta", enLeyenda: true, x: -25, y: 72, rot: 138, medidas: { largo: 25, ancho: 12 } },
  { id: "i5", clase: "instalacion", tipo: "house", nombre: "House", descripcion: "Buffet, secretaría y salón.", enLeyenda: true, x: 18, y: 58, rot: R, medidas: { largo: 26, ancho: 14, alto: 5 } },
  { id: "i6", clase: "instalacion", tipo: "vestuario", nombre: "Vestuarios", enLeyenda: true, x: 97, y: -94, rot: R, medidas: { largo: 15, ancho: 9, alto: 3.5 } },
  { id: "i7", clase: "instalacion", tipo: "cancha_rugby", nombre: "Cancha 2", enLeyenda: false, medidas: { largo: 90, ancho: 60, ingoal: 6 } },
  { id: "i8", clase: "instalacion", tipo: "quincho", nombre: "Quincho", enLeyenda: false, medidas: { largo: 14, ancho: 9, alto: 4 } },
  { id: "r1", clase: "referencia", tipo: "arbol", nombre: "El ombú", descripcion: "El ombú del club, al lado de la cancha principal.", enLeyenda: true, x: -78, y: -18, rot: 0, medidas: { altura: 12, copa: 14 } },
  { id: "r2", clase: "referencia", tipo: "gradas", nombre: "Gradas «Tito»", descripcion: "En homenaje a Tito, que no se perdía un partido.", enLeyenda: true, x: 8, y: -40, rot: R + 90, medidas: { largo: 20, escalones: 4 } },
  { id: "r3", clase: "referencia", tipo: "arbol", enLeyenda: false, x: 150, y: -60, rot: 0, medidas: { altura: 9, copa: 7 } },
  { id: "r4", clase: "referencia", tipo: "arbol", enLeyenda: false, x: 160, y: -75, rot: 0, medidas: { altura: 9, copa: 7 } },
  { id: "r5", clase: "referencia", tipo: "arbol", enLeyenda: false, x: 140, y: -45, rot: 0, medidas: { altura: 10, copa: 8 } },
  { id: "r6", clase: "referencia", tipo: "camino", enLeyenda: false, medidas: { ancho: 4 }, puntos: [[-60, 30], [10, 30], [60, -20], [100, -60]] },
  { id: "r7", clase: "referencia", tipo: "valla", enLeyenda: false, medidas: { alto: 1.5 }, puntos: [[-70, -10], [-5, -75], [40, -120]] },
  { id: "r8", clase: "referencia", tipo: "bebedero", enLeyenda: false, x: 45, y: -40, rot: 0, medidas: {} },
];

// --- geometría ---

const rad = (g: number) => (g * Math.PI) / 180;

/** Gira un vector local (dx a lo ancho, dy a lo largo) según la rotación desde el norte. */
export function girar(dx: number, dy: number, rot: number): Punto {
  const a = rad(rot);
  // eje largo apunta a la rotación (horario desde el norte)
  const e = dy * Math.sin(a) + dx * Math.cos(a);
  const n = dy * Math.cos(a) - dx * Math.sin(a);
  return [e, n];
}

export function tamano(el: Elemento): { largo: number; ancho: number } {
  const md = el.medidas;
  switch (el.tipo) {
    case "cancha_rugby":
      return { largo: md.largo + 2 * (md.ingoal ?? 0), ancho: md.ancho };
    case "arbol":
      return { largo: md.copa, ancho: md.copa };
    case "piedra":
      return { largo: md.diametro, ancho: md.diametro };
    case "gradas":
    case "tribuna":
      return { largo: md.largo, ancho: (md.escalones ?? 4) * 0.8 };
    case "bebedero":
      return { largo: 1.5, ancho: 1.5 };
    default:
      return { largo: md.largo ?? 5, ancho: md.ancho ?? 5 };
  }
}

/** Huella rectangular en metros. */
export function huella(el: Elemento): Punto[] {
  const { largo, ancho } = tamano(el);
  const x = el.x ?? 0;
  const y = el.y ?? 0;
  const rot = el.rot ?? 0;
  return [
    [-ancho / 2, -largo / 2],
    [ancho / 2, -largo / 2],
    [ancho / 2, largo / 2],
    [-ancho / 2, largo / 2],
  ].map(([dx, dy]) => {
    const [e, n] = girar(dx, dy, rot);
    return [x + e, y + n] as Punto;
  });
}

const M_LAT = 111320;
const M_LNG = M_LAT * Math.cos(rad(ORIGEN.lat));

export const aLngLat = ([e, n]: Punto): [number, number] => [
  ORIGEN.lng + e / M_LNG,
  ORIGEN.lat + n / M_LAT,
];

export const aMetros = (lng: number, lat: number): Punto => [
  (lng - ORIGEN.lng) * M_LNG,
  (lat - ORIGEN.lat) * M_LAT,
];

/** Numeración de la leyenda: en el orden de la lista, solo lo que entra. */
export function numeros(els: Elemento[]): Map<string, number> {
  const res = new Map<string, number>();
  let n = 1;
  for (const el of els) {
    if (el.enLeyenda && ubicado(el)) res.set(el.id, n++);
  }
  return res;
}

export const ubicado = (el: Elemento) =>
  el.puntos ? el.puntos.length > 1 : el.x !== undefined;

export const etiqueta = (el: Elemento) =>
  el.nombre ?? tipoDe(el.tipo).nombre;
