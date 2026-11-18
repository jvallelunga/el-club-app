"use server";

import { revalidatePath } from "next/cache";
import { errorSiNoPuedeEditarPredio } from "@/dominio/permisos";
import { errorDelPredio, predioParaGuardar, type DatosPredio } from "@/dominio/predio";
import { cargarSesion } from "../consultas/sesion";
import { supabaseServidor } from "../supabase-servidor";

export type ResultadoGuardarPredio = { ok: true } | { ok: false; error: string };

/** Guarda el origen y el área del predio de una sede. Solo el Super Admin. */
export async function guardarPredio(
  clubId: string,
  sedeId: string,
  datos: DatosPredio,
): Promise<ResultadoGuardarPredio> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeEditarPredio(sesion);
  if (permiso) return { ok: false, error: permiso };

  const invalido = errorDelPredio(datos);
  if (invalido) return { ok: false, error: invalido };
  const { origen, area } = predioParaGuardar(datos);

  const supabase = await supabaseServidor();
  const { data: sede } = await supabase
    .from("sede")
    .select("id, club:club_id (slug)")
    .eq("id", sedeId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!sede) return { ok: false, error: "No encontramos esa sede." };

  const { error } = await supabase.from("predio").upsert(
    {
      sede_id: sedeId,
      origen_lat: origen.lat,
      origen_lng: origen.lng,
      area,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "sede_id" },
  );
  if (error) {
    return { ok: false, error: "No se pudo guardar el predio. Probá de nuevo." };
  }

  const slug = (sede.club as { slug: string } | null)?.slug;
  if (slug) revalidatePath(`/c/${slug}/admin/sedes/${sedeId}`);
  return { ok: true };
}
