/**
 * Tipos de elemento de referencia (#46): lo que se ubica en el predio sin ser
 * una instalación. Viven en código, como los tipos de instalación (ADR 0001):
 * cada uno tiene su forma 3D y sus medidas, con su valor por defecto. No hay
 * escala libre: el tamaño sale solo de estas medidas.
 *
 * Agregar o quitar un tipo también pide una migración: la base solo acepta
 * estas claves en `elemento_predio.tipo_referencia`. Caminos y vallas se
 * dibujan punto a punto y van aparte (#47).
 */

import type { MedidaInstalacion } from "./tipos-instalacion";

/** Las medidas se describen igual que las de una instalación, en metros. */
export type MedidaReferencia = MedidaInstalacion;

export type TipoReferencia = {
  clave: string;
  nombre: string;
  /** Redonda (árbol, piedra) o rectangular, para la huella en el mapa. */
  planta: "redonda" | "rectangular";
  medidas: readonly MedidaReferencia[];
};

const medida = (clave: string, etiqueta: string, porDefecto: number): MedidaReferencia => ({
  clave,
  etiqueta,
  porDefecto,
});

/** En el orden en que se ofrecen en el editor. */
export const TIPOS_REFERENCIA = [
  {
    clave: "arbol",
    nombre: "Árbol",
    planta: "redonda",
    medidas: [medida("alto", "Altura", 10), medida("copa", "Diámetro de copa", 7)],
  },
  {
    clave: "piedra",
    nombre: "Piedra",
    planta: "redonda",
    medidas: [medida("diametro", "Diámetro", 1.5), medida("alto", "Alto", 1)],
  },
  {
    clave: "bebedero",
    nombre: "Bebedero",
    planta: "rectangular",
    medidas: [medida("largo", "Largo", 1), medida("ancho", "Ancho", 0.5), medida("alto", "Alto", 1)],
  },
  {
    // Escalones descubiertos. La cantidad de escalones sale del alto.
    clave: "gradas",
    nombre: "Gradas",
    planta: "rectangular",
    medidas: [medida("largo", "Largo", 20), medida("ancho", "Ancho (fondo)", 4), medida("alto", "Alto", 2)],
  },
  {
    // Gradas con techo: las mismas medidas.
    clave: "tribuna",
    nombre: "Tribuna",
    planta: "rectangular",
    medidas: [medida("largo", "Largo", 30), medida("ancho", "Ancho (fondo)", 6), medida("alto", "Alto", 3)],
  },
] as const satisfies readonly TipoReferencia[];

export type ClaveTipoReferencia = (typeof TIPOS_REFERENCIA)[number]["clave"];

const TIPO_POR_CLAVE = new Map<string, TipoReferencia>(
  TIPOS_REFERENCIA.map((tipo) => [tipo.clave, tipo]),
);

export function esClaveTipoReferencia(valor: unknown): valor is ClaveTipoReferencia {
  return typeof valor === "string" && TIPO_POR_CLAVE.has(valor);
}

export function tipoReferencia(clave: ClaveTipoReferencia): TipoReferencia {
  return TIPO_POR_CLAVE.get(clave)!;
}

export function medidasPorDefectoDeReferencia(clave: ClaveTipoReferencia): Record<string, number> {
  return Object.fromEntries(tipoReferencia(clave).medidas.map((m) => [m.clave, m.porDefecto]));
}

/** El largo y el ancho que ocupa en el piso (en la huella del mapa). */
export function plantaDeReferencia(
  clave: ClaveTipoReferencia,
  medidas: Record<string, number>,
): { largo: number; ancho: number } {
  switch (clave) {
    case "arbol":
      return { largo: medidas.copa, ancho: medidas.copa };
    case "piedra":
      return { largo: medidas.diametro, ancho: medidas.diametro };
    default:
      return { largo: medidas.largo, ancho: medidas.ancho };
  }
}
