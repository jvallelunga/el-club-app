import "server-only";

import { coordenadasDesdeLinkMaps } from "@/dominio/maps";
import {
  errorDelArea,
  medidasDelTipo,
  origenInicial,
  type DatosPredio,
  type InstalacionDeLaSede,
  type InstalacionUbicada,
  type OrigenInicial,
  type Punto,
} from "@/dominio/predio";
import { predioParaVisor, type PredioEnVisor } from "@/dominio/predio-3d";
import type { ClaveTipoInstalacion } from "@/dominio/tipos-instalacion";
import { coordenadasDeDireccion } from "../geocodificar";
import { supabaseServidor } from "../supabase-servidor";

export type PredioParaEditor = {
  /** Lo guardado, o null si la sede todavía no tiene predio. */
  guardado: DatosPredio | null;
  origen: OrigenInicial;
};

/**
 * El predio guardado de una sede, o null. RLS deja leer a los Admins del club.
 * `tiposDeLaSede` da el tipo de cada instalación de la sede, por id: las
 * medidas guardadas se ajustan al tipo actual (puede haber cambiado).
 */
export async function predioDeSede(
  sedeId: string,
  tiposDeLaSede: ReadonlyMap<string, ClaveTipoInstalacion>,
): Promise<DatosPredio | null> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("predio")
    .select("id, origen_lat, origen_lng, area")
    .eq("sede_id", sedeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: elementos, error: errorElementos } = await supabase
    .from("elemento_predio")
    .select("instalacion_id, este, norte, rotacion, medidas")
    .eq("predio_id", data.id);
  if (errorElementos) throw errorElementos;

  const instalaciones: InstalacionUbicada[] = [];
  for (const fila of elementos ?? []) {
    const tipo = fila.instalacion_id ? tiposDeLaSede.get(fila.instalacion_id) : undefined;
    if (!fila.instalacion_id || !tipo) continue;
    const medidas =
      fila.medidas && typeof fila.medidas === "object" && !Array.isArray(fila.medidas)
        ? (fila.medidas as Record<string, unknown>)
        : null;
    instalaciones.push({
      instalacionId: fila.instalacion_id,
      posicion: [fila.este, fila.norte],
      rotacion: fila.rotacion,
      medidas: medidasDelTipo(tipo, medidas),
    });
  }

  // La base ya valida el área; si algo raro quedara, se abre sin área.
  const area = errorDelArea(data.area) ? [] : (data.area as Punto[]);
  return { origen: { lat: data.origen_lat, lng: data.origen_lng }, area, instalaciones };
}

/**
 * Lo que necesita el editor: el predio guardado y el origen inicial (predio,
 * coordenadas de la sede, ciudad del club o Buenos Aires).
 */
export async function predioParaEditor(params: {
  sedeId: string;
  tiposDeLaSede: ReadonlyMap<string, ClaveTipoInstalacion>;
  mapsUrlSede: string | null;
  direccionClub: string | null;
}): Promise<PredioParaEditor> {
  const guardado = await predioDeSede(params.sedeId, params.tiposDeLaSede);
  const coordenadasSede = params.mapsUrlSede
    ? coordenadasDesdeLinkMaps(params.mapsUrlSede)
    : null;
  // Solo se busca la dirección del club si no hay nada mejor.
  const coordenadasClub =
    guardado || coordenadasSede ? null : await coordenadasDeDireccion(params.direccionClub);
  return {
    guardado,
    origen: origenInicial({
      predio: guardado?.origen ?? null,
      sede: coordenadasSede,
      ciudad: coordenadasClub,
    }),
  };
}

/** El tipo de cada instalación de la sede, por id (lo pide predioDeSede). */
export function tiposDeLaSede(
  instalaciones: readonly InstalacionDeLaSede[],
): ReadonlyMap<string, ClaveTipoInstalacion> {
  return new Map(instalaciones.map((i) => [i.id, i.tipo]));
}

/**
 * Lo que muestra el visor 3D de una sede, o null si el predio no está armado
 * (#44). RLS deja leer a los Admins del club.
 */
export async function predioEnVisorDeSede(sede: {
  id: string;
  instalaciones: readonly InstalacionDeLaSede[];
}): Promise<PredioEnVisor | null> {
  const guardado = await predioDeSede(sede.id, tiposDeLaSede(sede.instalaciones));
  return predioParaVisor(guardado, sede.instalaciones);
}
