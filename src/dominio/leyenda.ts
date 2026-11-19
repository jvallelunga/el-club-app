/**
 * La leyenda del predio (#45): la lista numerada que acompaña el predio 3D.
 *
 * Cada elemento ubicado guarda su lugar en la leyenda (`ordenLeyenda`), o
 * null si no entra. El número que se ve no es ese valor sino su puesto en la
 * lista: así un hueco (algo quitado del predio) no salta un número.
 */

/** Lo que la leyenda necesita saber de un elemento ubicado. */
export type EnLeyenda = {
  id: string;
  /** Lugar en la leyenda (de menor a mayor), o null si no entra. */
  ordenLeyenda: number | null;
};

/** Lo que entra en la leyenda, en su orden. A igual orden, el de la lista. */
function enOrden<T extends EnLeyenda>(elementos: readonly T[]): T[] {
  return elementos
    .filter((e) => e.ordenLeyenda !== null)
    .sort((a, b) => a.ordenLeyenda! - b.ordenLeyenda!);
}

/** El número de cada elemento que entra en la leyenda: 1, 2, 3… sin huecos. */
export function numerosDeLeyenda(elementos: readonly EnLeyenda[]): Map<string, number> {
  return new Map(enOrden(elementos).map((e, i) => [e.id, i + 1]));
}

/** Pone el orden corrido (1, 2, 3…) respetando el orden actual de la leyenda. */
export function renumerarLeyenda<T extends EnLeyenda>(elementos: readonly T[]): T[] {
  const numeros = numerosDeLeyenda(elementos);
  return elementos.map((e) => ({ ...e, ordenLeyenda: numeros.get(e.id) ?? null }));
}

/** Pone o saca un elemento de la leyenda. Lo que entra va al final. */
export function cambiarEnLeyenda<T extends EnLeyenda>(
  elementos: readonly T[],
  id: string,
  entra: boolean,
): T[] {
  const ultimo = Math.max(0, ...elementos.map((e) => e.ordenLeyenda ?? 0));
  return renumerarLeyenda(
    elementos.map((e) => {
      if (e.id !== id || entra === (e.ordenLeyenda !== null)) return e;
      return { ...e, ordenLeyenda: entra ? ultimo + 1 : null };
    }),
  );
}

/** Sube (−1) o baja (+1) un lugar un elemento de la leyenda. */
export function moverEnLeyenda<T extends EnLeyenda>(
  elementos: readonly T[],
  id: string,
  delta: -1 | 1,
): T[] {
  const corrida = renumerarLeyenda(elementos);
  // Con el orden corrido, el lugar de cada uno es su número.
  const actual = corrida.find((e) => e.id === id)?.ordenLeyenda ?? null;
  const vecino = actual === null ? undefined : corrida.find((e) => e.ordenLeyenda === actual + delta);
  if (actual === null || !vecino) return corrida;
  return corrida.map((e) =>
    e === vecino
      ? { ...e, ordenLeyenda: actual }
      : e.id === id
        ? { ...e, ordenLeyenda: actual + delta }
        : e,
  );
}

/**
 * Tope de la descripción, en caracteres: un texto corto (#26). La historia
 * larga, con fotos, es otra cosa (#35).
 */
export const DESCRIPCION_MAXIMA = 280;

/**
 * La descripción como se guarda: texto sin formato, en una sola línea y sin
 * espacios de más. Vacía es no tener descripción (null).
 */
export function descripcionLimpia(texto: string | null): string | null {
  const limpia = (texto ?? "").replace(/\s+/g, " ").trim();
  return limpia === "" ? null : limpia;
}

/** Caracteres de un texto, contados como la base (un emoji es uno). */
function largoDeTexto(texto: string): number {
  return Array.from(texto).length;
}

/** Mensaje si la descripción no sirve, o null si está bien. */
export function errorDeDescripcion(descripcion: unknown): string | null {
  if (descripcion === null) return null;
  if (typeof descripcion !== "string") return "La descripción de un elemento no es válida.";
  if (largoDeTexto(descripcionLimpia(descripcion) ?? "") > DESCRIPCION_MAXIMA) {
    return `La descripción de un elemento tiene más de ${DESCRIPCION_MAXIMA} caracteres.`;
  }
  return null;
}
