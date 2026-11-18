import type { Coordenadas } from "./maps";

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

/**
 * Origen con el que abre el editor: el guardado del predio; si no hay, las
 * coordenadas de la sede; si no, la ciudad del club; si no, Buenos Aires.
 */
export function origenInicial(params: {
  predio: Coordenadas | null;
  sede: Coordenadas | null;
  ciudad: Coordenadas | null;
}): { coordenadas: Coordenadas; desde: DesdeOrigen } {
  if (params.predio) return { coordenadas: params.predio, desde: "predio" };
  if (params.sede) return { coordenadas: params.sede, desde: "sede" };
  if (params.ciudad) return { coordenadas: params.ciudad, desde: "ciudad" };
  return { coordenadas: ORIGEN_POR_DEFECTO, desde: "por-defecto" };
}

/** Reexpresa el área desde otro origen, sin moverla del lugar del mapa. */
export function moverOrigen(
  area: Punto[],
  origenViejo: Coordenadas,
  origenNuevo: Coordenadas,
): Punto[] {
  return area.map((punto) => aMetros(origenNuevo, aCoordenadas(origenViejo, punto)));
}

export type DatosPredio = { origen: Coordenadas; area: Punto[] };

/** Un centímetro: por debajo de eso, una diferencia es ruido del mapa. */
const TOLERANCIA_METROS = 0.01;

/** Si lo que está en el editor difiere de lo guardado (null = sin predio). */
export function hayCambiosEnPredio(
  guardado: DatosPredio | null,
  actual: DatosPredio,
): boolean {
  if (!guardado) return true;
  const [deltaEste, deltaNorte] = aMetros(guardado.origen, actual.origen);
  if (Math.hypot(deltaEste, deltaNorte) > TOLERANCIA_METROS) return true;
  if (guardado.area.length !== actual.area.length) return true;
  return guardado.area.some(
    ([e, n], i) =>
      Math.hypot(e - actual.area[i][0], n - actual.area[i][1]) > TOLERANCIA_METROS,
  );
}

/** Redondea para guardar: el área al centímetro y el origen a 7 decimales (~1 cm). */
export function predioParaGuardar(datos: DatosPredio): DatosPredio {
  const cm = (n: number) => Math.round(n * 100) / 100;
  const grados = (n: number) => Math.round(n * 1e7) / 1e7;
  return {
    origen: { lat: grados(datos.origen.lat), lng: grados(datos.origen.lng) },
    area: datos.area.map(([e, n]) => [cm(e), cm(n)]),
  };
}

/** Lee las coordenadas del primer resultado de una búsqueda en Nominatim. */
export function coordenadasDesdeNominatim(respuesta: unknown): Coordenadas | null {
  if (!Array.isArray(respuesta) || respuesta.length === 0) return null;
  const primero: unknown = respuesta[0];
  if (!primero || typeof primero !== "object") return null;
  const { lat, lon } = primero as Record<string, unknown>;
  const latN = Number(lat);
  const lngN = Number(lon);
  if (typeof lat !== "string" || typeof lon !== "string") return null;
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return null;
  if (latN < -90 || latN > 90 || lngN < -180 || lngN > 180) return null;
  return { lat: latN, lng: lngN };
}
