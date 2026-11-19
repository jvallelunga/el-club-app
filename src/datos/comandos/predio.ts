"use server";

import { revalidatePath } from "next/cache";
import { errorSiNoPuedeEditarPredio } from "@/dominio/permisos";
import { errorDelPredio, predioParaGuardar, type DatosPredio } from "@/dominio/predio";
import {
  CLAVE_TIPO_OTRA,
  esClaveTipoInstalacion,
  type ClaveTipoInstalacion,
} from "@/dominio/tipos-instalacion";
import { cargarSesion } from "../consultas/sesion";
import { supabaseServidor } from "../supabase-servidor";
import type { ResultadoSimple } from "./sedes";

/**
 * Guarda el origen, el área y las instalaciones ubicadas del predio de una
 * sede, todo junto. Solo el Super Admin.
 */
export async function guardarPredio(
  clubId: string,
  sedeId: string,
  datos: DatosPredio,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeEditarPredio(sesion);
  if (permiso) return { ok: false, error: permiso };

  const supabase = await supabaseServidor();
  const { data: sede } = await supabase
    .from("sede")
    .select("id, club:club_id (slug), instalacion (id, tipo)")
    .eq("id", sedeId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!sede) return { ok: false, error: "No encontramos esa sede." };

  // Igual que sedePorId: un tipo que el código no conoce cuenta como «Otra».
  const tiposDeLaSede = new Map<string, ClaveTipoInstalacion>(
    sede.instalacion.map((i) => [
      i.id,
      esClaveTipoInstalacion(i.tipo) ? i.tipo : CLAVE_TIPO_OTRA,
    ]),
  );
  // Una instalación borrada mientras se editaba ya no se ubica.
  const enviadas = Array.isArray(datos?.instalaciones) ? datos.instalaciones : [];
  const deLaSede = {
    ...datos,
    instalaciones: enviadas.filter((i) => tiposDeLaSede.has(i?.instalacionId)),
  };

  const invalido = errorDelPredio(deLaSede, tiposDeLaSede);
  if (invalido) return { ok: false, error: invalido };
  const { origen, area, instalaciones } = predioParaGuardar(deLaSede);

  const { error } = await supabase.rpc("guardar_predio", {
    p_sede_id: sedeId,
    p_origen_lat: origen.lat,
    p_origen_lng: origen.lng,
    p_area: area,
    p_instalaciones: instalaciones.map((i) => ({
      instalacion_id: i.instalacionId,
      este: i.posicion[0],
      norte: i.posicion[1],
      rotacion: i.rotacion,
      medidas: i.medidas,
    })),
  });
  if (error) {
    return { ok: false, error: "No se pudo guardar el predio. Probá de nuevo." };
  }

  const slug = (sede.club as { slug: string } | null)?.slug;
  if (slug) revalidatePath(`/c/${slug}/admin/sedes/${sedeId}`);
  return { ok: true };
}
