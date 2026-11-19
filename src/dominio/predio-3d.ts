/**
 * Lo que necesita el visor 3D del predio (#44): cuándo se muestra y cómo se
 * arma cada instalación y cada elemento de referencia (#46) con primitivas.
 * Sin three.js, para poder probarlo.
 */

import { numerosDeLeyenda } from "./leyenda";
import {
  elementosEnLeyenda,
  type DatosPredio,
  type InstalacionDeLaSede,
  type InstalacionUbicada,
  type LineaUbicada,
  type Punto,
  type ReferenciaUbicada,
} from "./predio";
import { tipoInstalacion, type ClaveTipoInstalacion } from "./tipos-instalacion";
import {
  esClaveTipoLinea,
  tipoLinea,
  tipoReferencia,
  type ClaveTipoLinea,
  type ClaveTipoReferencia,
} from "./tipos-referencia";

/**
 * Un predio está armado si tiene área y al menos una instalación ubicada.
 * Solo un predio armado se muestra en el club.
 */
export function predioArmado(predio: DatosPredio | null): boolean {
  return !!predio && predio.area.length > 0 && predio.instalaciones.length > 0;
}

/** Una instalación ubicada, con lo que el visor necesita para dibujarla. */
export type InstalacionEnVisor = InstalacionDeLaSede &
  Pick<InstalacionUbicada, "posicion" | "rotacion" | "medidas" | "descripcion"> & {
    /** Su número en la leyenda, o null: sin número no se puede tocar. */
    numero: number | null;
  };

/** Un elemento de referencia ubicado, con lo que el visor necesita para dibujarlo. */
export type ReferenciaEnVisor = Pick<
  ReferenciaUbicada,
  "id" | "tipo" | "posicion" | "rotacion" | "medidas" | "descripcion"
> & {
  /** Su nombre propio o, si no tiene, el de su tipo («Gradas»). */
  nombre: string;
  /** Su número en la leyenda, o null: sin número no se puede tocar. */
  numero: number | null;
};

/** Un camino o una valla, con lo que el visor necesita para dibujarlo. */
export type LineaEnVisor = Pick<LineaUbicada, "id" | "tipo" | "puntos" | "medidas" | "descripcion"> & {
  /** Su nombre propio o, si no tiene, el de su tipo («Camino»). */
  nombre: string;
  /** Su número en la leyenda, o null: sin número no se puede tocar. */
  numero: number | null;
};

/** El nombre con el que se muestra un elemento de referencia, puntual o línea. */
export function nombreDeReferencia(referencia: {
  tipo: ClaveTipoReferencia | ClaveTipoLinea;
  nombre: string | null;
}): string {
  const { tipo, nombre } = referencia;
  return nombre ?? (esClaveTipoLinea(tipo) ? tipoLinea(tipo) : tipoReferencia(tipo)).nombre;
}

/** Una línea de la leyenda: el número, el nombre y la descripción. */
export type EntradaLeyenda = {
  /** El id de la instalación o del elemento de referencia. */
  id: string;
  numero: number;
  nombre: string;
  descripcion: string | null;
};

export type PredioEnVisor = {
  area: Punto[];
  instalaciones: InstalacionEnVisor[];
  referencias: ReferenciaEnVisor[];
  /** Los caminos y las vallas (#47). */
  lineas: LineaEnVisor[];
  /** Lo que tiene número, en el orden de la leyenda. */
  leyenda: EntradaLeyenda[];
};

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
    instalaciones: guardado.instalaciones.filter((ubicada) => porId.has(ubicada.instalacionId)),
  };
  if (!predioArmado(vigente)) return null;
  // Se numera después de filtrar: lo que ya no está no deja un hueco.
  const numeros = numerosDeLeyenda(elementosEnLeyenda(vigente));
  const instalaciones = vigente.instalaciones.map(
    ({ instalacionId, posicion, rotacion, medidas, descripcion }) => ({
      ...porId.get(instalacionId)!,
      posicion,
      rotacion,
      medidas,
      descripcion,
      numero: numeros.get(instalacionId) ?? null,
    }),
  );
  const referencias = vigente.referencias.map(
    ({ id, tipo, nombre, posicion, rotacion, medidas, descripcion }) => ({
      id,
      tipo,
      nombre: nombreDeReferencia({ tipo, nombre }),
      posicion,
      rotacion,
      medidas,
      descripcion,
      numero: numeros.get(id) ?? null,
    }),
  );
  const lineas = vigente.lineas.map(({ id, tipo, nombre, puntos, medidas, descripcion }) => ({
    id,
    tipo,
    nombre: nombreDeReferencia({ tipo, nombre }),
    puntos,
    medidas,
    descripcion,
    numero: numeros.get(id) ?? null,
  }));
  const leyenda = [...instalaciones, ...referencias, ...lineas]
    .flatMap(({ id, numero, nombre, descripcion }) =>
      numero === null ? [] : [{ id, numero, nombre, descripcion }],
    )
    .sort((a, b) => a.numero - b.numero);
  return { area: vigente.area, instalaciones, referencias, lineas, leyenda };
}

// ---------------------------------------------------------------------------
// Piezas 3D de cada instalación. Coordenadas propias de la instalación, en
// metros: x a lo largo, y hacia arriba, z a lo ancho, con el centro de la
// huella en el origen. El visor después la ubica y la gira.
// ---------------------------------------------------------------------------

export type Tripla = [number, number, number];

export type Pieza = {
  /**
   * «techo» es una pirámide de cuatro caras apoyada en su base; «cilindro»,
   * «esfera» y «roca» (un poliedro irregular) llenan su caja de tamaño.
   */
  forma: "caja" | "techo" | "cilindro" | "esfera" | "roca";
  centro: Tripla;
  /** [largo (x), alto (y), ancho (z)]. */
  tamano: Tripla;
  color: string;
  /**
   * Giro sobre su centro alrededor del eje vertical, en radianes, en sentido
   * antihorario visto desde arriba (como three.js). Sin giro, el largo va en x.
   */
  giro?: number;
};

const caja = (centro: Tripla, tamano: Tripla, color: string): Pieza => ({
  forma: "caja",
  centro,
  tamano,
  color,
});

/** Una caja apoyada en el piso, centrada en (x, z). */
const apoyadaEnElPiso = (x: number, z: number, tamano: Tripla, color: string) =>
  caja([x, tamano[1] / 2, z], tamano, color);

const COLOR_PARED = "#e9e4da";
const COLOR_EDIFICIO: Partial<Record<ClaveTipoInstalacion, string>> = {
  house: "#f2ead8",
  gym: "#d9dde3",
  vestuario: COLOR_PARED,
  quincho: "#d8b48a",
  salon: "#ece6dc",
};
const COLOR_TECHO = "#8b4a3c";
const COLOR_BLOQUE = "#b8b8b8";

function edificio(clave: ClaveTipoInstalacion, medidas: Record<string, number>): Pieza[] {
  const alturaTecho = Math.min(2.5, medidas.ancho * 0.3);
  const pared = COLOR_EDIFICIO[clave] ?? COLOR_PARED;
  return [
    apoyadaEnElPiso(0, 0, [medidas.largo, medidas.alto, medidas.ancho], pared),
    {
      forma: "techo",
      centro: [0, medidas.alto + alturaTecho / 2, 0],
      tamano: [medidas.largo, alturaTecho, medidas.ancho],
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
  const palo = (z: number) => apoyadaEnElPiso(x, z, [0.2, altoPalos, 0.2], BLANCO);
  return [
    palo(-separacion / 2),
    palo(separacion / 2),
    caja([x, altoTravesano, 0], [0.2, 0.2, separacion], BLANCO),
  ];
}

function cancha(clave: ClaveTipoInstalacion, medidas: Record<string, number>): Pieza[] {
  const ingoal = medidas.ingoal ?? 0;
  const total = medidas.largo + 2 * ingoal;
  const mitad = medidas.largo / 2;
  const piezas = [
    apoyadaEnElPiso(0, 0, [total, ALTO_PISO_CANCHA, medidas.ancho], COLOR_CANCHA[clave] ?? COLOR_CESPED),
    ...lineasDeJuego(total, medidas.ancho),
  ];
  switch (clave) {
    case "cancha_rugby":
      // Líneas de try y haches: palos de 11 m a 5,6 m, travesaño a 3 m.
      piezas.push(lineaAncho(-mitad, medidas.ancho), lineaAncho(mitad, medidas.ancho));
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
      const largoJuego = Math.min(23.77, medidas.largo);
      const anchoJuego = Math.min(10.97, medidas.ancho);
      piezas.push(...lineasDeJuego(largoJuego, anchoJuego).slice(0, 4));
      piezas.push(apoyadaEnElPiso(0, 0, [0.05, 1.07, Math.min(12.8, medidas.ancho)], "#222222"));
      break;
    }
  }
  return piezas;
}

export const COLOR_AGUA = "#36a9e1";

/** Las medidas son las de afuera: el borde va adentro y el agua, dentro del borde. */
function pileta(medidas: Record<string, number>): Pieza[] {
  const borde = Math.min(1, medidas.largo / 6, medidas.ancho / 6);
  return [
    apoyadaEnElPiso(0, 0, [medidas.largo, 0.3, medidas.ancho], "#e8e2d4"),
    caja([0, 0.32, 0], [medidas.largo - 2 * borde, 0.06, medidas.ancho - 2 * borde], COLOR_AGUA),
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
  const forma = tipoInstalacion(clave).forma;
  switch (forma) {
    case "edificio":
      return edificio(clave, medidas);
    case "cancha":
      return cancha(clave, medidas);
    case "pileta":
      return pileta(medidas);
    case "bloque":
      return [apoyadaEnElPiso(0, 0, [medidas.largo, medidas.alto, medidas.ancho], COLOR_BLOQUE)];
    default: {
      const sinPiezas: never = forma;
      throw new Error(`Forma de instalación sin piezas 3D: ${String(sinPiezas)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Piezas 3D de cada elemento de referencia (#46), en las mismas coordenadas
// propias que una instalación: x a lo largo, y hacia arriba, z a lo ancho.
// ---------------------------------------------------------------------------

const COLOR_TRONCO = "#6b4a2f";
const COLOR_COPA = "#2f6b34";
const COLOR_PIEDRA = "#8a8a8a";
const COLOR_HORMIGON = "#d6d6d6";
const COLOR_TECHO_TRIBUNA = "#4d5a66";

/** Alto de cada escalón de las gradas, más o menos, en metros. */
const ALTO_ESCALON = 0.45;
/** Lo que separa los escalones del techo de la tribuna, en metros. */
const ALTO_BAJO_TECHO = 2.5;
/** Cada cuánto va un poste del techo de la tribuna, como mucho. */
const SEPARACION_POSTES = 10;

/** Cuántos escalones tienen unas gradas de ese alto: uno cada ~45 cm. */
export function escalonesDeGradas(alto: number): number {
  return Math.max(1, Math.round(alto / ALTO_ESCALON));
}

/** Tronco y copa: la copa toca la altura del árbol y tiene su diámetro. */
function arbol({ alto, copa }: Record<string, number>): Pieza[] {
  const altoCopa = Math.min(copa * 0.8, alto * 0.7);
  const tronco = Math.min(1, Math.max(0.2, alto * 0.05));
  const altoTronco = alto - altoCopa / 2;
  return [
    { forma: "cilindro", centro: [0, altoTronco / 2, 0], tamano: [tronco, altoTronco, tronco], color: COLOR_TRONCO },
    { forma: "esfera", centro: [0, alto - altoCopa / 2, 0], tamano: [copa, altoCopa, copa], color: COLOR_COPA },
  ];
}

/** Un pie y una pileta arriba, con agua. */
function bebedero({ largo, ancho, alto }: Record<string, number>): Pieza[] {
  const altoPileta = Math.min(0.15, alto / 3);
  return [
    apoyadaEnElPiso(0, 0, [largo * 0.6, alto - altoPileta, ancho * 0.6], COLOR_HORMIGON),
    caja([0, alto - altoPileta / 2 - 0.01, 0], [largo, altoPileta, ancho], "#b9b4aa"),
    caja([0, alto - 0.005, 0], [largo * 0.7, 0.01, ancho * 0.6], COLOR_AGUA),
  ];
}

/**
 * Escalones a lo largo, que suben hacia atrás: el frente (el más bajo) da a
 * z positivo, que con 0° es el sur.
 */
function gradas({ largo, ancho, alto }: Record<string, number>): Pieza[] {
  const escalones = escalonesDeGradas(alto);
  const fondo = ancho / escalones;
  return Array.from({ length: escalones }, (_, i) =>
    apoyadaEnElPiso(0, ancho / 2 - fondo * (i + 0.5), [largo, (alto * (i + 1)) / escalones, fondo], COLOR_HORMIGON),
  );
}

/** Las gradas con un techo arriba, sostenido por postes en el fondo. */
function tribuna(medidas: Record<string, number>): Pieza[] {
  const { largo, ancho, alto } = medidas;
  const altoTecho = alto + ALTO_BAJO_TECHO;
  const tramos = Math.max(1, Math.ceil(largo / SEPARACION_POSTES));
  const postes = Array.from({ length: tramos + 1 }, (_, i) =>
    apoyadaEnElPiso(-largo / 2 + 0.1 + ((largo - 0.2) * i) / tramos, -ancho / 2 + 0.1, [0.2, altoTecho, 0.2], COLOR_TECHO_TRIBUNA),
  );
  return [
    ...gradas(medidas),
    ...postes,
    caja([0, altoTecho + 0.1, 0], [largo, 0.2, ancho], COLOR_TECHO_TRIBUNA),
  ];
}

/**
 * Las piezas con las que se dibuja un elemento de referencia, con sus
 * medidas. Todo queda dentro de la huella que se ve en el editor.
 */
export function piezasDeReferencia(
  tipo: ClaveTipoReferencia,
  medidas: Record<string, number>,
): Pieza[] {
  switch (tipo) {
    case "arbol":
      return arbol(medidas);
    case "piedra":
      return [{ forma: "roca", centro: [0, medidas.alto / 2, 0], tamano: [medidas.diametro, medidas.alto, medidas.diametro], color: COLOR_PIEDRA }];
    case "bebedero":
      return bebedero(medidas);
    case "gradas":
      return gradas(medidas);
    case "tribuna":
      return tribuna(medidas);
    default: {
      const sinPiezas: never = tipo;
      throw new Error(`Elemento de referencia sin piezas 3D: ${String(sinPiezas)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Piezas 3D de caminos y vallas (#47). No tienen posición ni rotación: sus
// piezas van directo en coordenadas de la escena (x al este, y hacia arriba,
// z al sur), en metros desde el origen, y cada tramo lleva su giro.
// ---------------------------------------------------------------------------

const COLOR_CAMINO = "#cdb88f";
const COLOR_VALLA = "#f2f2f2";
/** El camino apenas sobresale del pasto, debajo del piso de una cancha. */
const ALTO_CAMINO = 0.05;
/** Cada cuánto va un poste de la valla, como mucho. */
const SEPARACION_POSTES_VALLA = 2.5;
const LADO_POSTE = 0.1;
const ALTO_TRAVESANO = 0.06;

type Tramo = {
  desde: Punto;
  hasta: Punto;
  largo: number;
  /** Su centro, en la escena. */
  medio: Tripla;
  giro: number;
};

/** [este, norte] → (x, y, z) de la escena: el norte va hacia −z. */
const enEscena = ([este, norte]: Punto, y: number): Tripla => [este, y, 0 - norte];

/** Los tramos entre puntos seguidos, sin los que no tienen largo. */
function tramosDe(puntos: readonly Punto[], y: number): Tramo[] {
  const tramos: Tramo[] = [];
  for (let i = 1; i < puntos.length; i++) {
    const [desde, hasta] = [puntos[i - 1], puntos[i]];
    const [de, dn] = [hasta[0] - desde[0], hasta[1] - desde[1]];
    const largo = Math.hypot(de, dn);
    if (largo === 0) continue;
    const medio: Punto = [(desde[0] + hasta[0]) / 2, (desde[1] + hasta[1]) / 2];
    // Visto desde arriba, el norte (−z) queda a 90° antihorario del este (x).
    tramos.push({ desde, hasta, largo, medio: enEscena(medio, y), giro: Math.atan2(dn, de) });
  }
  return tramos;
}

/** Una franja por tramo y un disco en cada vuelta, para que no queden huecos. */
function camino(puntos: readonly Punto[], { ancho }: Record<string, number>): Pieza[] {
  const tramos = tramosDe(puntos, ALTO_CAMINO / 2);
  const franjas = tramos.map(
    ({ largo, medio, giro }): Pieza => ({
      forma: "caja",
      centro: medio,
      tamano: [largo, ALTO_CAMINO, ancho],
      color: COLOR_CAMINO,
      giro,
    }),
  );
  const vueltas = tramos.slice(1).map(
    ({ desde }): Pieza => ({
      forma: "cilindro",
      centro: enEscena(desde, ALTO_CAMINO / 2),
      tamano: [ancho, ALTO_CAMINO, ancho],
      color: COLOR_CAMINO,
    }),
  );
  return [...franjas, ...vueltas];
}

/** Postes en cada punto y como mucho cada 2,5 m, con dos travesaños por tramo. */
function valla(puntos: readonly Punto[], { alto }: Record<string, number>): Pieza[] {
  return tramosDe(puntos, alto).flatMap(({ desde, hasta, largo, medio, giro }, i) => {
    const partes = Math.ceil(largo / SEPARACION_POSTES_VALLA);
    // El primer poste de cada tramo, salvo el del primero, ya está puesto.
    const postes = Array.from({ length: partes + (i === 0 ? 1 : 0) }, (_, k): Pieza => {
      const t = (k + (i === 0 ? 0 : 1)) / partes;
      const punto: Punto = [desde[0] + (hasta[0] - desde[0]) * t, desde[1] + (hasta[1] - desde[1]) * t];
      return caja(enEscena(punto, alto / 2), [LADO_POSTE, alto, LADO_POSTE], COLOR_VALLA);
    });
    const travesano = (y: number): Pieza => ({
      forma: "caja",
      centro: [medio[0], y, medio[2]],
      tamano: [largo, ALTO_TRAVESANO, LADO_POSTE / 2],
      color: COLOR_VALLA,
      giro,
    });
    return [...postes, travesano(alto - ALTO_TRAVESANO / 2), travesano(alto / 2)];
  });
}

/**
 * Las piezas con las que se dibuja un camino o una valla, siguiendo sus
 * puntos (en metros desde el origen).
 */
export function piezasDeLinea(
  tipo: ClaveTipoLinea,
  puntos: readonly Punto[],
  medidas: Record<string, number>,
): Pieza[] {
  switch (tipo) {
    case "camino":
      return camino(puntos, medidas);
    case "valla":
      return valla(puntos, medidas);
    default: {
      const sinPiezas: never = tipo;
      throw new Error(`Camino o valla sin piezas 3D: ${String(sinPiezas)}`);
    }
  }
}
