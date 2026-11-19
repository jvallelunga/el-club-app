import "server-only";

import { coordenadasDesdeLinkMaps } from "@/dominio/maps";
import {
  errorDelArea,
  medidasDeLinea,
  medidasDeReferencia,
  medidasDelTipo,
  origenInicial,
  puntosDeLinea,
  tiposPorInstalacion,
  type DatosPredio,
  type InstalacionDeLaSede,
  type InstalacionUbicada,
  type LineaUbicada,
  type OrigenInicial,
  type Punto,
  type ReferenciaUbicada,
} from "@/dominio/predio";
import { predioParaVisor, type PredioEnVisor } from "@/dominio/predio-3d";
import type { ClaveTipoInstalacion } from "@/dominio/tipos-instalacion";
import { esClaveTipoLinea, esClaveTipoReferencia } from "@/dominio/tipos-referencia";
import { coordenadasDeDireccion } from "../geocodificar";
import { listarSedes, sedePorId } from "./sedes";
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
    .select(
      "id, instalacion_id, tipo_referencia, nombre, este, norte, rotacion, puntos, medidas, descripcion, orden_leyenda",
    )
    .eq("predio_id", data.id);
  if (errorElementos) throw errorElementos;

  const instalaciones: InstalacionUbicada[] = [];
  const referencias: ReferenciaUbicada[] = [];
  const lineas: LineaUbicada[] = [];
  for (const fila of elementos ?? []) {
    const medidas =
      fila.medidas && typeof fila.medidas === "object" && !Array.isArray(fila.medidas)
        ? (fila.medidas as Record<string, unknown>)
        : null;
    // Un camino o una valla (#47): sus puntos en vez de posición y rotación.
    if (esClaveTipoLinea(fila.tipo_referencia)) {
      const puntos = puntosDeLinea(fila.puntos);
      if (!puntos) continue;
      lineas.push({
        id: fila.id,
        tipo: fila.tipo_referencia,
        nombre: fila.nombre,
        puntos,
        medidas: medidasDeLinea(fila.tipo_referencia, medidas),
        descripcion: fila.descripcion,
        ordenLeyenda: fila.orden_leyenda,
      });
      continue;
    }
    // La base no deja guardar un elemento puntual sin posición ni rotación.
    if (fila.este === null || fila.norte === null || fila.rotacion === null) continue;
    // Un tipo que el código ya no conoce no se muestra (la base no lo deja guardar).
    if (esClaveTipoReferencia(fila.tipo_referencia)) {
      referencias.push({
        id: fila.id,
        tipo: fila.tipo_referencia,
        nombre: fila.nombre,
        posicion: [fila.este, fila.norte],
        rotacion: fila.rotacion,
        medidas: medidasDeReferencia(fila.tipo_referencia, medidas),
        descripcion: fila.descripcion,
        ordenLeyenda: fila.orden_leyenda,
      });
      continue;
    }
    const tipo = fila.instalacion_id ? tiposDeLaSede.get(fila.instalacion_id) : undefined;
    if (!fila.instalacion_id || !tipo) continue;
    instalaciones.push({
      instalacionId: fila.instalacion_id,
      posicion: [fila.este, fila.norte],
      rotacion: fila.rotacion,
      medidas: medidasDelTipo(tipo, medidas),
      descripcion: fila.descripcion,
      ordenLeyenda: fila.orden_leyenda,
    });
  }

  // La base ya valida el área; si algo raro quedara, se abre sin área.
  const area = errorDelArea(data.area) ? [] : (data.area as Punto[]);
  return {
    origen: { lat: data.origen_lat, lng: data.origen_lng },
    area,
    instalaciones,
    referencias,
    lineas,
  };
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

/**
 * Lo que muestra el visor 3D de una sede, o null si el predio no está armado
 * (#44). RLS deja leer a los Admins del club.
 */
export async function predioEnVisorDeSede(sede: {
  id: string;
  instalaciones: readonly InstalacionDeLaSede[];
}): Promise<PredioEnVisor | null> {
  const guardado = await predioDeSede(sede.id, tiposPorInstalacion(sede.instalaciones));
  return predioParaVisor(guardado, sede.instalaciones);
}

/**
 * Si el club tiene una sola sede y su predio está armado, su predio para la
 * Inicio (#44). Con más de una sede, null.
 */
export async function predioDeLaUnicaSede(
  clubId: string,
): Promise<{ sede: { id: string; nombre: string }; predio: PredioEnVisor } | null> {
  const sedes = await listarSedes(clubId);
  if (sedes.length !== 1) return null;
  const sede = await sedePorId(clubId, sedes[0].id);
  if (!sede) return null;
  const predio = await predioEnVisorDeSede(sede);
  return predio ? { sede: { id: sede.id, nombre: sede.nombre }, predio } : null;
}
