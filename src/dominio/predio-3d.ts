/**
 * Lo que necesita el visor 3D del predio (#44): cuándo se muestra y cómo se
 * arma cada instalación con primitivas. Sin three.js, para poder probarlo.
 */

import type { DatosPredio, InstalacionDeLaSede, Punto } from "./predio";
import { tipoInstalacion, type ClaveTipoInstalacion } from "./tipos-instalacion";

/**
 * Un predio está armado si tiene área y al menos una instalación ubicada.
 * Solo un predio armado se muestra en el club.
 */
export function predioArmado(predio: DatosPredio | null): boolean {
  return !!predio && predio.area.length > 0 && predio.instalaciones.length > 0;
}

/** Una instalación ubicada, con lo que el visor necesita para dibujarla. */
export type InstalacionEnVisor = InstalacionDeLaSede & {
  /** Centro, en metros desde el origen: [este, norte]. */
  posicion: Punto;
  /** Grados en sentido horario; con 0°, el largo va de oeste a este. */
  rotacion: number;
  medidas: Record<string, number>;
};

export type PredioEnVisor = { area: Punto[]; instalaciones: InstalacionEnVisor[] };

/**
 * Lo que muestra el visor, o null si no hay nada que mostrar: el predio no
 * está armado o ninguna de sus instalaciones ubicadas sigue en la sede.
 */
export function predioParaVisor(
  guardado: DatosPredio | null,
  deLaSede: readonly InstalacionDeLaSede[],
): PredioEnVisor | null {
  if (!guardado) return null;
  const porId = new Map(deLaSede.map((i) => [i.id, i]));
  // Una instalación borrada mientras se miraba el predio no se dibuja.
  const vigente = {
    ...guardado,
    instalaciones: guardado.instalaciones.filter((u) => porId.has(u.instalacionId)),
  };
  if (!predioArmado(vigente)) return null;
  return {
    area: vigente.area,
    instalaciones: vigente.instalaciones.map(({ instalacionId, posicion, rotacion, medidas }) => ({
      ...porId.get(instalacionId)!,
      posicion,
      rotacion,
      medidas,
    })),
  };
}

// ---------------------------------------------------------------------------
// Piezas 3D de cada instalación. Coordenadas propias de la instalación, en
// metros: x a lo largo, y hacia arriba, z a lo ancho, con el centro de la
// huella en el origen. El visor después la ubica y la gira.
// ---------------------------------------------------------------------------

export type Tripla = [number, number, number];

export type Pieza = {
  /** «techo» es una pirámide de cuatro caras apoyada en su base. */
  forma: "caja" | "techo";
  centro: Tripla;
  /** [largo (x), alto (y), ancho (z)]. */
  tamano: Tripla;
  color: string;
};

const caja = (centro: Tripla, tamano: Tripla, color: string): Pieza => ({
  forma: "caja",
  centro,
  tamano,
  color,
});

/** Una caja apoyada en el piso, centrada en (x, z). */
const apoyada = (x: number, z: number, tamano: Tripla, color: string) =>
  caja([x, tamano[1] / 2, z], tamano, color);

const COLOR_EDIFICIO: Partial<Record<ClaveTipoInstalacion, string>> = {
  house: "#f2ead8",
  gym: "#d9dde3",
  vestuario: "#e9e4da",
  quincho: "#d8b48a",
  salon: "#ece6dc",
};
const COLOR_TECHO = "#8b4a3c";

function edificio(clave: ClaveTipoInstalacion, m: Record<string, number>): Pieza[] {
  const alturaTecho = Math.min(2.5, m.ancho * 0.3);
  return [
    apoyada(0, 0, [m.largo, m.alto, m.ancho], COLOR_EDIFICIO[clave] ?? "#e9e4da"),
    {
      forma: "techo",
      centro: [0, m.alto + alturaTecho / 2, 0],
      tamano: [m.largo, alturaTecho, m.ancho],
      color: COLOR_TECHO,
    },
  ];
}

const COLOR_CESPED = "#4f9e4a";
const COLOR_CANCHA: Partial<Record<ClaveTipoInstalacion, string>> = {
  cancha_hockey: "#2f6fb0",
  cancha_tenis: "#c9683a",
};
const BLANCO = "#ffffff";
const ANCHO_LINEA = 0.2;
const ALTO_PISO_CANCHA = 0.1;

/** Línea pintada a lo ancho de la cancha, en x. */
const lineaAncho = (x: number, ancho: number) =>
  caja([x, ALTO_PISO_CANCHA + 0.01, 0], [ANCHO_LINEA, 0.02, ancho], BLANCO);
/** Línea pintada a lo largo de la cancha, en z. */
const lineaLargo = (z: number, largo: number) =>
  caja([0, ALTO_PISO_CANCHA + 0.01, z], [largo, 0.02, ANCHO_LINEA], BLANCO);

/** Un rectángulo de líneas de largo × ancho, centrado, más la línea de mitad. */
function lineasDeJuego(largo: number, ancho: number): Pieza[] {
  const borde = ANCHO_LINEA / 2;
  return [
    lineaAncho(-largo / 2 + borde, ancho),
    lineaAncho(largo / 2 - borde, ancho),
    lineaLargo(-ancho / 2 + borde, largo),
    lineaLargo(ancho / 2 - borde, largo),
    lineaAncho(0, ancho),
  ];
}

/** Un arco (o una hache, con travesaño bajo y palos altos) en la línea x. */
function arco(x: number, separacion: number, altoPalos: number, altoTravesano: number) {
  const palo = (z: number) => apoyada(x, z, [0.2, altoPalos, 0.2], BLANCO);
  return [
    palo(-separacion / 2),
    palo(separacion / 2),
    caja([x, altoTravesano, 0], [0.2, 0.2, separacion], BLANCO),
  ];
}

function cancha(clave: ClaveTipoInstalacion, m: Record<string, number>): Pieza[] {
  const ingoal = m.ingoal ?? 0;
  const total = m.largo + 2 * ingoal;
  const mitad = m.largo / 2;
  const piezas = [
    apoyada(0, 0, [total, ALTO_PISO_CANCHA, m.ancho], COLOR_CANCHA[clave] ?? COLOR_CESPED),
    ...lineasDeJuego(total, m.ancho),
  ];
  switch (clave) {
    case "cancha_rugby":
      // Líneas de try y haches: palos de 11 m a 5,6 m, travesaño a 3 m.
      piezas.push(lineaAncho(-mitad, m.ancho), lineaAncho(mitad, m.ancho));
      piezas.push(...arco(-mitad, 5.6, 11, 3), ...arco(mitad, 5.6, 11, 3));
      break;
    case "cancha_futbol":
      piezas.push(...arco(-mitad + 0.1, 7.32, 2.44, 2.44), ...arco(mitad - 0.1, 7.32, 2.44, 2.44));
      break;
    case "cancha_hockey":
      piezas.push(...arco(-mitad + 0.1, 3.66, 2.14, 2.14), ...arco(mitad - 0.1, 3.66, 2.14, 2.14));
      break;
    case "cancha_tenis": {
      // Las medidas incluyen el espacio alrededor: la cancha de juego va al centro.
      const largoJuego = Math.min(23.77, m.largo);
      const anchoJuego = Math.min(10.97, m.ancho);
      piezas.push(...lineasDeJuego(largoJuego, anchoJuego).slice(0, 4));
      piezas.push(apoyada(0, 0, [0.05, 1.07, Math.min(12.8, m.ancho)], "#222222"));
      break;
    }
  }
  return piezas;
}

export const COLOR_AGUA = "#36a9e1";

/** Las medidas son las de afuera: el borde va adentro y el agua, dentro del borde. */
function pileta(m: Record<string, number>): Pieza[] {
  const borde = Math.min(1, m.largo / 6, m.ancho / 6);
  return [
    apoyada(0, 0, [m.largo, 0.3, m.ancho], "#e8e2d4"),
    caja([0, 0.32, 0], [m.largo - 2 * borde, 0.06, m.ancho - 2 * borde], COLOR_AGUA),
  ];
}

/**
 * Las piezas con las que se dibuja una instalación: la forma de su tipo con
 * sus medidas. Todo queda dentro de la huella que se ve en el editor.
 */
export function piezasDeInstalacion(
  clave: ClaveTipoInstalacion,
  medidas: Record<string, number>,
): Pieza[] {
  switch (tipoInstalacion(clave).forma) {
    case "edificio":
      return edificio(clave, medidas);
    case "cancha":
      return cancha(clave, medidas);
    case "pileta":
      return pileta(medidas);
    case "bloque":
      return [apoyada(0, 0, [medidas.largo, medidas.alto, medidas.ancho], "#b8b8b8")];
    default:
      return [];
  }
}
