import {
  descripcionLimpia,
  errorDeDescripcion,
  largoDeTexto,
  numerosDeLeyenda,
  textoEnUnaLinea,
  type EnLeyenda,
} from "./leyenda";
import { sonCoordenadasValidas, type Coordenadas } from "./maps";
import { tipoInstalacion, type ClaveTipoInstalacion, type MedidaInstalacion } from "./tipos-instalacion";
import {
  esClaveTipoLinea,
  esClaveTipoReferencia,
  plantaDeReferencia,
  tipoLinea,
  tipoReferencia,
  type ClaveTipoLinea,
  type ClaveTipoReferencia,
} from "./tipos-referencia";

/** Metros desde el origen del predio: [este, norte]. */
export type Punto = [number, number];

/** Radio medio de la Tierra, en metros. */
const RADIO_TIERRA = 6_371_008.8;
const METROS_POR_GRADO = (Math.PI / 180) * RADIO_TIERRA;

function metrosPorGradoDeLongitud(lat: number): number {
  return METROS_POR_GRADO * Math.cos((lat * Math.PI) / 180);
}

/**
 * Pasa un punto del mapa a metros desde el origen. Es una proyección plana
 * local: alcanza para un predio (unos cientos de metros).
 */
export function aMetros(origen: Coordenadas, punto: Coordenadas): Punto {
  return [
    (punto.lng - origen.lng) * metrosPorGradoDeLongitud(origen.lat),
    (punto.lat - origen.lat) * METROS_POR_GRADO,
  ];
}

/** Inversa de aMetros. */
export function aCoordenadas(origen: Coordenadas, [este, norte]: Punto): Coordenadas {
  return {
    lat: origen.lat + norte / METROS_POR_GRADO,
    lng: origen.lng + este / metrosPorGradoDeLongitud(origen.lat),
  };
}

/**
 * Los puntos de un camino o una valla (#47), del mapa a metros desde el
 * origen, en el mismo orden.
 */
export function lineaEnMetros(origen: Coordenadas, puntos: readonly Coordenadas[]): Punto[] {
  return puntos.map((punto) => aMetros(origen, punto));
}

/** Inversa de lineaEnMetros. */
export function lineaEnCoordenadas(origen: Coordenadas, puntos: readonly Punto[]): Coordenadas[] {
  return puntos.map((punto) => aCoordenadas(origen, punto));
}

/** El largo de una línea: la suma de sus tramos, en metros. */
export function largoDeLinea(puntos: readonly Punto[]): number {
  let largo = 0;
  for (let i = 1; i < puntos.length; i++) {
    largo += Math.hypot(puntos[i][0] - puntos[i - 1][0], puntos[i][1] - puntos[i - 1][1]);
  }
  return largo;
}

/**
 * El punto que está a mitad del largo, sobre la línea: ahí van su etiqueta en
 * el mapa y su número en el 3D.
 */
export function puntoMedioDeLinea(puntos: readonly Punto[]): Punto {
  let falta = largoDeLinea(puntos) / 2;
  for (let i = 1; i < puntos.length; i++) {
    const [a, b] = [puntos[i - 1], puntos[i]];
    const tramo = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (tramo > 0 && falta <= tramo) {
      const t = falta / tramo;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    falta -= tramo;
  }
  return puntos[0];
}

/** Distancia máxima de un punto del predio al origen, en metros. */
export const DISTANCIA_MAXIMA_AL_ORIGEN = 5000;

/** Tope de puntos del área: un polígono dibujado a mano no llega ni cerca. */
export const PUNTOS_MAXIMOS_DEL_AREA = 500;

function esPunto(valor: unknown): valor is Punto {
  return (
    Array.isArray(valor) &&
    valor.length === 2 &&
    valor.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

/** Orientación del giro p → q → r: >0 antihorario, <0 horario, 0 alineados. */
function giro(p: Punto, q: Punto, r: Punto): number {
  return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
}

function seCruzan(a: Punto, b: Punto, c: Punto, d: Punto): boolean {
  const d1 = giro(c, d, a);
  const d2 = giro(c, d, b);
  const d3 = giro(a, b, c);
  const d4 = giro(a, b, d);
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

/**
 * Mensaje si el área del predio no sirve, o null si está bien. Un área vacía
 * vale: el predio puede guardarse antes de dibujarla.
 */
export function errorDelArea(area: unknown): string | null {
  if (!Array.isArray(area)) return "El área del predio no es válida.";
  if (area.length === 0) return null;
  if (!area.every(esPunto)) return "El área del predio tiene puntos inválidos.";
  if (area.length < 3) return "El área del predio necesita al menos tres puntos.";
  if (area.length > PUNTOS_MAXIMOS_DEL_AREA) {
    return `El área del predio tiene demasiados puntos (máximo ${PUNTOS_MAXIMOS_DEL_AREA}).`;
  }
  if (area.some(([e, n]) => Math.hypot(e, n) > DISTANCIA_MAXIMA_AL_ORIGEN)) {
    return "El área del predio está demasiado lejos del origen.";
  }
  const lados = area.map((p, i) => [p, area[(i + 1) % area.length]] as const);
  for (let i = 0; i < lados.length; i++) {
    // Los lados vecinos comparten un vértice; se comparan los que no se tocan.
    for (let j = i + 2; j < lados.length; j++) {
      if (i === 0 && j === lados.length - 1) continue;
      if (seCruzan(lados[i][0], lados[i][1], lados[j][0], lados[j][1])) {
        return "El área del predio se cruza consigo misma.";
      }
    }
  }
  return null;
}

/** Dónde arranca el mapa cuando no hay nada mejor: el Obelisco, Buenos Aires. */
export const ORIGEN_POR_DEFECTO: Coordenadas = { lat: -34.60373, lng: -58.38157 };

export type DesdeOrigen = "predio" | "sede" | "ciudad" | "por-defecto";

/** Con qué origen abre el editor y de dónde salió. */
export type OrigenInicial = { coordenadas: Coordenadas; desde: DesdeOrigen };

/**
 * Origen con el que abre el editor: el guardado del predio; si no hay, las
 * coordenadas de la sede; si no, la ciudad del club; si no, Buenos Aires.
 */
export function origenInicial(params: {
  predio: Coordenadas | null;
  sede: Coordenadas | null;
  ciudad: Coordenadas | null;
}): OrigenInicial {
  if (params.predio) return { coordenadas: params.predio, desde: "predio" };
  if (params.sede) return { coordenadas: params.sede, desde: "sede" };
  if (params.ciudad) return { coordenadas: params.ciudad, desde: "ciudad" };
  return { coordenadas: ORIGEN_POR_DEFECTO, desde: "por-defecto" };
}

export type DatosPredio = {
  origen: Coordenadas;
  area: Punto[];
  instalaciones: InstalacionUbicada[];
  /** Los elementos de referencia que se ubican en un punto (#46). */
  referencias: ReferenciaUbicada[];
  /** Los caminos y las vallas, que se dibujan punto a punto (#47). */
  lineas: LineaUbicada[];
};

/** Un centímetro: por debajo de eso, una diferencia es ruido del mapa. */
const TOLERANCIA_METROS = 0.01;
/** Una décima de grado. */
const TOLERANCIA_GRADOS = 0.1;

/** Diferencia entre dos ángulos, entre 0 y 180 (359° y 1° están a 2°). */
function diferenciaDeAngulos(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Lo que tienen en común una instalación ubicada y un elemento de referencia. */
type Ubicado = Pick<InstalacionUbicada, "posicion" | "rotacion" | "medidas" | "descripcion">;

function hayCambiosEnMedidas(antes: Record<string, number>, ahora: Record<string, number>) {
  const claves = new Set([...Object.keys(antes), ...Object.keys(ahora)]);
  return [...claves].some(
    (clave) => !(Math.abs((antes[clave] ?? NaN) - (ahora[clave] ?? NaN)) <= TOLERANCIA_METROS),
  );
}

/** Si cambió algún punto, o cuántos son, o su orden. */
function hayCambiosEnPuntos(antes: readonly Punto[], ahora: readonly Punto[]) {
  return (
    antes.length !== ahora.length ||
    antes.some(([e, n], i) => Math.hypot(e - ahora[i][0], n - ahora[i][1]) > TOLERANCIA_METROS)
  );
}

function hayCambiosEnUbicado(antes: Ubicado, ahora: Ubicado) {
  return (
    descripcionLimpia(antes.descripcion) !== descripcionLimpia(ahora.descripcion) ||
    Math.hypot(antes.posicion[0] - ahora.posicion[0], antes.posicion[1] - ahora.posicion[1]) >
      TOLERANCIA_METROS ||
    diferenciaDeAngulos(antes.rotacion, ahora.rotacion) > TOLERANCIA_GRADOS ||
    hayCambiosEnMedidas(antes.medidas, ahora.medidas)
  );
}

/**
 * Todo lo ubicado, como lo ve la leyenda: instalaciones y elementos de
 * referencia comparten una sola leyenda. Una instalación se identifica con
 * su id de instalación; un elemento de referencia, con el suyo.
 */
export function elementosEnLeyenda(
  datos: Pick<DatosPredio, "instalaciones" | "referencias" | "lineas">,
): EnLeyenda[] {
  return [
    ...datos.instalaciones.map((i) => ({ id: i.instalacionId, ordenLeyenda: i.ordenLeyenda })),
    ...datos.referencias.map((r) => ({ id: r.id, ordenLeyenda: r.ordenLeyenda })),
    ...datos.lineas.map((l) => ({ id: l.id, ordenLeyenda: l.ordenLeyenda })),
  ];
}

/** Si cambió qué entra en la leyenda o en qué orden (los números que se ven). */
function hayCambiosEnLeyenda(antes: DatosPredio, ahora: DatosPredio) {
  const numerosAntes = numerosDeLeyenda(elementosEnLeyenda(antes));
  const numerosAhora = numerosDeLeyenda(elementosEnLeyenda(ahora));
  return (
    numerosAntes.size !== numerosAhora.size ||
    [...numerosAhora].some(([id, numero]) => numerosAntes.get(id) !== numero)
  );
}

function hayCambiosEnInstalaciones(antes: InstalacionUbicada[], ahora: InstalacionUbicada[]) {
  if (antes.length !== ahora.length) return true;
  const porId = new Map(antes.map((i) => [i.instalacionId, i]));
  return ahora.some((i) => {
    const previa = porId.get(i.instalacionId);
    return !previa || hayCambiosEnUbicado(previa, i);
  });
}

function hayCambiosEnReferencias(antes: ReferenciaUbicada[], ahora: ReferenciaUbicada[]) {
  if (antes.length !== ahora.length) return true;
  const porId = new Map(antes.map((r) => [r.id, r]));
  return ahora.some((r) => {
    const previa = porId.get(r.id);
    return (
      !previa ||
      previa.tipo !== r.tipo ||
      nombreLimpio(previa.nombre) !== nombreLimpio(r.nombre) ||
      hayCambiosEnUbicado(previa, r)
    );
  });
}

function hayCambiosEnLineas(antes: LineaUbicada[], ahora: LineaUbicada[]) {
  if (antes.length !== ahora.length) return true;
  const porId = new Map(antes.map((l) => [l.id, l]));
  return ahora.some((l) => {
    const previa = porId.get(l.id);
    return (
      !previa ||
      previa.tipo !== l.tipo ||
      nombreLimpio(previa.nombre) !== nombreLimpio(l.nombre) ||
      descripcionLimpia(previa.descripcion) !== descripcionLimpia(l.descripcion) ||
      hayCambiosEnMedidas(previa.medidas, l.medidas) ||
      hayCambiosEnPuntos(previa.puntos, l.puntos)
    );
  });
}

/** Si lo que está en el editor difiere de lo guardado (null = sin predio). */
export function hayCambiosEnPredio(
  guardado: DatosPredio | null,
  actual: DatosPredio,
): boolean {
  if (!guardado) return true;
  const [deltaEste, deltaNorte] = aMetros(guardado.origen, actual.origen);
  if (Math.hypot(deltaEste, deltaNorte) > TOLERANCIA_METROS) return true;
  if (hayCambiosEnLeyenda(guardado, actual)) return true;
  if (hayCambiosEnInstalaciones(guardado.instalaciones, actual.instalaciones)) return true;
  if (hayCambiosEnReferencias(guardado.referencias, actual.referencias)) return true;
  if (hayCambiosEnLineas(guardado.lineas, actual.lineas)) return true;
  return hayCambiosEnPuntos(guardado.area, actual.area);
}

/** Normaliza un ángulo a [0°, 360°) y lo redondea a la décima. */
function rotacionParaGuardar(grados: number): number {
  const decimas = Math.round(grados * 10);
  return (((decimas % 3600) + 3600) % 3600) / 10;
}

/**
 * Prepara para guardar. Redondea el área, las posiciones y las medidas al
 * centímetro, la rotación a la décima de grado y el origen a 7 decimales
 * (~1 cm). Limpia la descripción y deja el orden de la leyenda corrido (1, 2, 3…).
 */
export function predioParaGuardar(datos: DatosPredio): DatosPredio {
  // «+ 0» evita guardar -0.
  const cm = (n: number) => Math.round(n * 100) / 100 + 0;
  const grados = (n: number) => Math.round(n * 1e7) / 1e7;
  // La leyenda es una sola: se numera todo junto.
  const numeros = numerosDeLeyenda(elementosEnLeyenda(datos));
  const medidas = (m: Record<string, number>) =>
    Object.fromEntries(Object.entries(m).map(([clave, valor]) => [clave, cm(valor)]));
  const ubicado = (u: Ubicado) => ({
    posicion: [cm(u.posicion[0]), cm(u.posicion[1])] as Punto,
    rotacion: rotacionParaGuardar(u.rotacion),
    medidas: medidas(u.medidas),
    descripcion: descripcionLimpia(u.descripcion),
  });
  return {
    origen: { lat: grados(datos.origen.lat), lng: grados(datos.origen.lng) },
    area: datos.area.map(([e, n]) => [cm(e), cm(n)]),
    instalaciones: datos.instalaciones.map((i) => ({
      instalacionId: i.instalacionId,
      ...ubicado(i),
      ordenLeyenda: numeros.get(i.instalacionId) ?? null,
    })),
    referencias: datos.referencias.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      nombre: nombreLimpio(r.nombre),
      ...ubicado(r),
      ordenLeyenda: numeros.get(r.id) ?? null,
    })),
    lineas: datos.lineas.map((l) => ({
      id: l.id,
      tipo: l.tipo,
      nombre: nombreLimpio(l.nombre),
      puntos: l.puntos.map(([e, n]): Punto => [cm(e), cm(n)]),
      medidas: medidas(l.medidas),
      descripcion: descripcionLimpia(l.descripcion),
      ordenLeyenda: numeros.get(l.id) ?? null,
    })),
  };
}

/** Lee las coordenadas del primer resultado de una búsqueda en Nominatim. */
export function coordenadasDesdeNominatim(respuesta: unknown): Coordenadas | null {
  if (!Array.isArray(respuesta) || respuesta.length === 0) return null;
  const primero: unknown = respuesta[0];
  if (!primero || typeof primero !== "object") return null;
  const { lat, lon } = primero as Record<string, unknown>;
  if (typeof lat !== "string" || typeof lon !== "string") return null;
  const coordenadas = { lat: Number(lat), lng: Number(lon) };
  return sonCoordenadasValidas(coordenadas.lat, coordenadas.lng) ? coordenadas : null;
}

function esCoordenadas(valor: unknown): valor is Coordenadas {
  if (!valor || typeof valor !== "object") return false;
  const { lat, lng } = valor as Record<string, unknown>;
  return typeof lat === "number" && typeof lng === "number" && sonCoordenadasValidas(lat, lng);
}

/**
 * Mensaje si lo que llega para guardar no es un predio válido, o null.
 * `tiposDeLaSede` da el tipo de cada instalación de la sede, por id.
 */
export function errorDelPredio(
  datos: unknown,
  tiposDeLaSede: ReadonlyMap<string, ClaveTipoInstalacion>,
): string | null {
  if (!datos || typeof datos !== "object") return "El predio no es válido.";
  const { origen, area, instalaciones, referencias, lineas } = datos as Record<string, unknown>;
  if (!esCoordenadas(origen)) return "El origen del predio no es válido.";
  // Un id es de un solo elemento de referencia, sea puntual o una línea.
  const ids = new Set<string>();
  return (
    errorDelArea(area) ??
    errorDeInstalaciones(instalaciones, tiposDeLaSede) ??
    errorDeReferencias(referencias, ids) ??
    errorDeLineas(lineas, ids) ??
    (ids.size > REFERENCIAS_MAXIMAS
      ? `El predio tiene demasiados elementos de referencia (máximo ${REFERENCIAS_MAXIMAS}).`
      : null)
  );
}

/** Mensaje si el lugar en la leyenda no sirve: null (sin número) o 1, 2, 3… */
function errorDeOrdenLeyenda(ordenLeyenda: unknown, cual: string): string | null {
  if (ordenLeyenda !== null && !(Number.isInteger(ordenLeyenda) && (ordenLeyenda as number) >= 1)) {
    return `El lugar de ${cual} en la leyenda no es válido.`;
  }
  return null;
}

/** Mensaje si la posición, la rotación o el lugar en la leyenda no sirven. */
function errorDeUbicacion(
  { posicion, rotacion, ordenLeyenda }: Record<string, unknown>,
  cual: string,
): string | null {
  if (!esPunto(posicion)) return `La posición de ${cual} no es válida.`;
  if (Math.hypot(...posicion) > DISTANCIA_MAXIMA_AL_ORIGEN) {
    return `${cual[0].toUpperCase()}${cual.slice(1)} está demasiado lejos del origen.`;
  }
  if (typeof rotacion !== "number" || !Number.isFinite(rotacion)) {
    return `La rotación de ${cual} no es válida.`;
  }
  return errorDeOrdenLeyenda(ordenLeyenda, cual);
}

function errorDeInstalaciones(
  instalaciones: unknown,
  tiposDeLaSede: ReadonlyMap<string, ClaveTipoInstalacion>,
): string | null {
  if (!Array.isArray(instalaciones)) return "Las instalaciones del predio no son válidas.";
  const vistas = new Set<string>();
  for (const instalacion of instalaciones) {
    if (!instalacion || typeof instalacion !== "object") {
      return "Una instalación del predio no es válida.";
    }
    const { instalacionId, medidas, descripcion } = instalacion as Record<string, unknown>;
    const tipo = typeof instalacionId === "string" ? tiposDeLaSede.get(instalacionId) : undefined;
    if (!tipo) return "Una de las instalaciones no es de esta sede.";
    if (vistas.has(instalacionId as string)) return "Una instalación está ubicada dos veces.";
    vistas.add(instalacionId as string);

    const error =
      errorDeUbicacion(instalacion as Record<string, unknown>, "una instalación") ??
      errorDeMedidas(tipoInstalacion(tipo).medidas, medidas, "una instalación") ??
      errorDeDescripcion(descripcion);
    if (error) return error;
  }
  return null;
}

/** Tope de elementos de referencia por predio: un predio real no llega ni cerca. */
export const REFERENCIAS_MAXIMAS = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mensaje si el id de un elemento de referencia no sirve o ya está en `vistos`. */
function errorDeId(id: unknown, vistos: Set<string>): string | null {
  if (typeof id !== "string" || !UUID.test(id)) return "Un elemento de referencia no es válido.";
  if (vistos.has(id)) return "Un elemento de referencia está dos veces.";
  vistos.add(id);
  return null;
}

function errorDeReferencias(referencias: unknown, vistos: Set<string>): string | null {
  if (!Array.isArray(referencias)) return "Los elementos de referencia del predio no son válidos.";
  if (referencias.length > REFERENCIAS_MAXIMAS) {
    return `El predio tiene demasiados elementos de referencia (máximo ${REFERENCIAS_MAXIMAS}).`;
  }
  for (const referencia of referencias) {
    if (!referencia || typeof referencia !== "object") {
      return "Un elemento de referencia no es válido.";
    }
    const campos = referencia as Record<string, unknown>;
    const { tipo, medidas, descripcion } = campos;
    const errorId = errorDeId(campos.id, vistos);
    if (errorId) return errorId;
    if (!esClaveTipoReferencia(tipo)) return "Un elemento de referencia tiene un tipo que no existe.";
    const error =
      errorDeNombre(campos.nombre) ??
      errorDeUbicacion(campos, "un elemento de referencia") ??
      errorDeMedidas(tipoReferencia(tipo).medidas, medidas, "un elemento de referencia") ??
      errorDeDescripcion(descripcion);
    if (error) return error;
  }
  return null;
}

/** Tope de puntos de un camino o una valla, como el del área. */
const PUNTOS_MAXIMOS_DE_LINEA = PUNTOS_MAXIMOS_DEL_AREA;

/** Mensaje si los puntos de un camino o una valla no sirven, o null. */
function errorDePuntos(puntos: unknown): string | null {
  if (!Array.isArray(puntos) || !puntos.every(esPunto)) {
    return "Los puntos de un camino o una valla no son válidos.";
  }
  if (puntos.length < 2) return "Un camino o una valla necesita al menos dos puntos.";
  if (puntos.length > PUNTOS_MAXIMOS_DE_LINEA) {
    return `Un camino o una valla tiene demasiados puntos (máximo ${PUNTOS_MAXIMOS_DE_LINEA}).`;
  }
  if (puntos.some(([e, n]) => Math.hypot(e, n) > DISTANCIA_MAXIMA_AL_ORIGEN)) {
    return "Un camino o una valla está demasiado lejos del origen.";
  }
  if (largoDeLinea(puntos) <= TOLERANCIA_METROS) {
    return "Un camino o una valla necesita un largo: tiene todos sus puntos en el mismo lugar.";
  }
  return null;
}

function errorDeLineas(lineas: unknown, vistos: Set<string>): string | null {
  if (!Array.isArray(lineas)) return "Los caminos y vallas del predio no son válidos.";
  for (const linea of lineas) {
    if (!linea || typeof linea !== "object") return "Un camino o una valla no es válido.";
    const campos = linea as Record<string, unknown>;
    const errorId = errorDeId(campos.id, vistos);
    if (errorId) return errorId;
    if (!esClaveTipoLinea(campos.tipo)) return "Un camino o una valla tiene un tipo que no existe.";
    const error =
      errorDeNombre(campos.nombre) ??
      errorDePuntos(campos.puntos) ??
      errorDeMedidas(tipoLinea(campos.tipo).medidas, campos.medidas, "un camino o una valla") ??
      errorDeDescripcion(campos.descripcion) ??
      errorDeOrdenLeyenda(campos.ordenLeyenda, "un camino o una valla");
    if (error) return error;
  }
  return null;
}

function errorDeMedidas(
  definidas: readonly MedidaInstalacion[],
  medidas: unknown,
  cual: string,
): string | null {
  const esperadas = definidas.map((m) => m.clave);
  if (!medidas || typeof medidas !== "object") {
    return `Las medidas de ${cual} no son válidas.`;
  }
  const claves = Object.keys(medidas);
  if (claves.length !== esperadas.length || !esperadas.every((c) => claves.includes(c))) {
    return `Las medidas de ${cual} no son las de su tipo.`;
  }
  if (!Object.values(medidas).every(esMedidaValida)) {
    return `Cada medida de ${cual} tiene que estar entre 0,5 y 300 m.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Instalaciones ubicadas en el predio (#43). La rotación va en grados, en
// sentido horario; con 0°, el largo de la instalación va de oeste a este.
// ---------------------------------------------------------------------------

/** Una instalación de la sede, ubicada o no: lo que el predio sabe de ella. */
export type InstalacionDeLaSede = {
  id: string;
  nombre: string;
  tipo: ClaveTipoInstalacion;
};

/** El tipo de cada instalación de la sede, por id. */
export function tiposPorInstalacion(
  instalaciones: readonly InstalacionDeLaSede[],
): ReadonlyMap<string, ClaveTipoInstalacion> {
  return new Map(instalaciones.map((i) => [i.id, i.tipo]));
}

/** Una instalación de la sede ubicada en el predio (#43), con su leyenda (#45). */
export type InstalacionUbicada = {
  instalacionId: string;
  /** Centro de la instalación, en metros desde el origen. */
  posicion: Punto;
  rotacion: number;
  medidas: Record<string, number>;
  /** Texto corto que se ve en la leyenda; no son las notas internas. */
  descripcion: string | null;
  /** Lugar en la leyenda, o null si no entra (sin número). Ver leyenda.ts. */
  ordenLeyenda: number | null;
};

/**
 * Pasa puntos propios del elemento (x a lo largo, y a lo ancho, en metros
 * desde su centro) a metros desde el origen, girados en sentido horario.
 */
function ubicarPuntos(posicion: Punto, rotacion: number, puntos: Punto[]): Punto[] {
  const angulo = (rotacion * Math.PI) / 180;
  const cos = Math.cos(angulo);
  const sin = Math.sin(angulo);
  // Giro horario: (x, y) → (x·cos + y·sin, −x·sin + y·cos).
  return puntos.map(([x, y]) => [
    posicion[0] + x * cos + y * sin,
    posicion[1] - x * sin + y * cos,
  ]);
}

/** Las esquinas de un rectángulo de largo × ancho centrado en (0, 0). */
function rectangulo(largo: number, ancho: number): Punto[] {
  return [
    [-largo / 2, -ancho / 2],
    [largo / 2, -ancho / 2],
    [largo / 2, ancho / 2],
    [-largo / 2, ancho / 2],
  ];
}

/** Las cuatro esquinas de la huella, en metros desde el origen. */
export function huellaDeInstalacion(
  instalacion: Pick<InstalacionUbicada, "posicion" | "rotacion" | "medidas">,
): Punto[] {
  const { posicion, rotacion, medidas } = instalacion;
  // El in-goal (rugby) se suma en cada punta del largo.
  const largo = medidas.largo + 2 * (medidas.ingoal ?? 0);
  return ubicarPuntos(posicion, rotacion, rectangulo(largo, medidas.ancho));
}

/** Una medida, en metros: de medio metro a 300 m. */
export const MEDIDA_MINIMA = 0.5;
export const MEDIDA_MAXIMA = 300;

function esMedidaValida(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor >= MEDIDA_MINIMA &&
    valor <= MEDIDA_MAXIMA
  );
}

/**
 * Las medidas del tipo, tomando las guardadas que sirvan. Si la instalación
 * cambió de tipo, lo que no es del tipo nuevo se descarta y lo que falta va
 * con su valor por defecto.
 */
export function medidasDelTipo(
  tipo: ClaveTipoInstalacion,
  guardadas: Record<string, unknown> | null,
): Record<string, number> {
  return medidasSegun(tipoInstalacion(tipo).medidas, guardadas);
}

function medidasSegun(
  definidas: readonly MedidaInstalacion[],
  guardadas: Record<string, unknown> | null,
): Record<string, number> {
  return Object.fromEntries(
    definidas.map((medida) => {
      const guardada = guardadas?.[medida.clave];
      return [medida.clave, esMedidaValida(guardada) ? guardada : medida.porDefecto];
    }),
  );
}

// ---------------------------------------------------------------------------
// Elementos de referencia (#46): árbol, piedra, bebedero, gradas y tribuna.
// Se ubican y se giran como las instalaciones; el tamaño sale de las medidas
// de su tipo (src/dominio/tipos-referencia.ts).
// ---------------------------------------------------------------------------

/** Un elemento de referencia ubicado en el predio. */
export type ReferenciaUbicada = Ubicado & {
  /** Lo pone el editor al agregarlo (un uuid). */
  id: string;
  tipo: ClaveTipoReferencia;
  /** Nombre propio opcional, por ejemplo «El ombú» o «Gradas Tito». */
  nombre: string | null;
  /** Lugar en la leyenda, o null si no entra (sin número). Ver leyenda.ts. */
  ordenLeyenda: number | null;
};

/** Tope del nombre de un elemento de referencia, en caracteres. */
export const NOMBRE_MAXIMO = 60;

/** El nombre como se guarda: en una línea y sin espacios de más; vacío es null. */
export const nombreLimpio = textoEnUnaLinea;

function errorDeNombre(nombre: unknown): string | null {
  if (nombre === null) return null;
  if (typeof nombre !== "string") return "El nombre de un elemento de referencia no es válido.";
  if (largoDeTexto(nombreLimpio(nombre) ?? "") > NOMBRE_MAXIMO) {
    return `El nombre de un elemento de referencia tiene más de ${NOMBRE_MAXIMO} caracteres.`;
  }
  return null;
}

/** Las medidas del tipo, tomando las guardadas que sirvan (como medidasDelTipo). */
export function medidasDeReferencia(
  tipo: ClaveTipoReferencia,
  guardadas: Record<string, unknown> | null,
): Record<string, number> {
  return medidasSegun(tipoReferencia(tipo).medidas, guardadas);
}

/** Lados del polígono con el que se dibuja una planta redonda. */
const LADOS_DEL_CIRCULO = 24;

/** La huella en el mapa: un círculo (árbol, piedra) o un rectángulo. */
export function huellaDeReferencia(
  referencia: Pick<ReferenciaUbicada, "tipo" | "posicion" | "rotacion" | "medidas">,
): Punto[] {
  const { tipo, posicion, rotacion, medidas } = referencia;
  const { largo, ancho } = plantaDeReferencia(tipo, medidas);
  if (tipoReferencia(tipo).planta === "rectangular") {
    return ubicarPuntos(posicion, rotacion, rectangulo(largo, ancho));
  }
  return Array.from({ length: LADOS_DEL_CIRCULO }, (_, i): Punto => {
    const angulo = (2 * Math.PI * i) / LADOS_DEL_CIRCULO;
    return [posicion[0] + (largo / 2) * Math.cos(angulo), posicion[1] + (ancho / 2) * Math.sin(angulo)];
  });
}

/**
 * El borde del frente de las gradas o la tribuna (el escalón más bajo), en
 * metros desde el origen. Con 0° mira al sur; se gira para que mire a la cancha.
 */
export function frenteDeGradas(
  gradas: Pick<ReferenciaUbicada, "posicion" | "rotacion" | "medidas">,
): [Punto, Punto] {
  const { largo, ancho } = gradas.medidas;
  const [a, b] = ubicarPuntos(gradas.posicion, gradas.rotacion, [
    [-largo / 2, -ancho / 2],
    [largo / 2, -ancho / 2],
  ]);
  return [a, b];
}

// ---------------------------------------------------------------------------
// Caminos y vallas (#47): elementos de referencia que se dibujan punto a
// punto. En vez de posición y rotación guardan sus puntos en metros desde el
// origen (src/dominio/tipos-referencia.ts, TIPOS_LINEA).
// ---------------------------------------------------------------------------

/** Un camino o una valla en el predio. */
export type LineaUbicada = {
  /** Lo pone el editor al dibujarlo (un uuid). */
  id: string;
  tipo: ClaveTipoLinea;
  /** Nombre propio opcional, por ejemplo «Camino de los pinos». */
  nombre: string | null;
  /** Los puntos, en metros desde el origen, en el orden en que se dibujaron. */
  puntos: Punto[];
  /** El ancho del camino o el alto de la valla. */
  medidas: Record<string, number>;
  /** Texto corto que se ve en la leyenda; no son notas internas. */
  descripcion: string | null;
  /** Lugar en la leyenda, o null si no entra (sin número). Ver leyenda.ts. */
  ordenLeyenda: number | null;
};

/** Las medidas del tipo, tomando las guardadas que sirvan (como medidasDelTipo). */
export function medidasDeLinea(
  tipo: ClaveTipoLinea,
  guardadas: Record<string, unknown> | null,
): Record<string, number> {
  return medidasSegun(tipoLinea(tipo).medidas, guardadas);
}

/** Los puntos guardados de un camino o una valla, o null si no sirven. */
export function puntosDeLinea(puntos: unknown): Punto[] | null {
  return errorDePuntos(puntos) ? null : (puntos as Punto[]);
}
