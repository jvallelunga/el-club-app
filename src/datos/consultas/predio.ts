import "server-only";

import { coordenadasDesdeLinkMaps } from "@/dominio/maps";
import {
  errorDelArea,
  origenInicial,
  type DatosPredio,
  type DesdeOrigen,
  type Punto,
} from "@/dominio/predio";
import type { Coordenadas } from "@/dominio/maps";
import { coordenadasDeDireccion } from "../geocodificar";
import { supabaseServidor } from "../supabase-servidor";

export type PredioParaEditor = {
  /** Lo guardado, o null si la sede todavía no tiene predio. */
  guardado: DatosPredio | null;
  /** Con qué origen abre el editor y de dónde salió. */
  origen: { coordenadas: Coordenadas; desde: DesdeOrigen };
};

/** El predio guardado de una sede, o null. RLS deja leer a los Admins del club. */
export async function predioDeSede(sedeId: string): Promise<DatosPredio | null> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("predio")
    .select("origen_lat, origen_lng, area")
    .eq("sede_id", sedeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // La base ya valida el área; si algo raro quedara, se abre sin área.
  const area = errorDelArea(data.area) ? [] : (data.area as Punto[]);
  return { origen: { lat: data.origen_lat, lng: data.origen_lng }, area };
}

/**
 * Lo que necesita el editor: el predio guardado y el origen inicial (predio,
 * coordenadas de la sede, ciudad del club o Buenos Aires).
 */
export async function predioParaEditor(params: {
  sedeId: string;
  mapsUrlSede: string | null;
  direccionClub: string | null;
}): Promise<PredioParaEditor> {
  const guardado = await predioDeSede(params.sedeId);
  const sede = params.mapsUrlSede ? coordenadasDesdeLinkMaps(params.mapsUrlSede) : null;
  // Solo se busca la dirección del club si no hay nada mejor.
  const ciudad =
    guardado || sede ? null : await coordenadasDeDireccion(params.direccionClub);
  return {
    guardado,
    origen: origenInicial({ predio: guardado?.origen ?? null, sede, ciudad }),
  };
}
