"use server";

import { revalidatePath } from "next/cache";
import { errorSiNoPuedeElegirDeportesDelClub } from "@/dominio/permisos";
import type { ResultadoSimple } from "@/dominio/resultado";
import { cargarSesion } from "../consultas/sesion";
import { supabaseServidor } from "../supabase-servidor";

/** Violación de unicidad de Postgres: el club ya tenía el deporte. */
const YA_ESTABA = "23505";
/** Lo rechaza la RLS: el deporte está borrado del catálogo (o no existe). */
const RECHAZADO_POR_RLS = "42501";

async function revalidar(clubId: string) {
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("club").select("slug").eq("id", clubId).maybeSingle();
  if (data?.slug) revalidatePath(`/c/${data.slug}/admin/deportes`);
  revalidatePath("/super-admin/deportes");
}

export async function sumarDeporteAlClub(
  clubId: string,
  deporteId: string,
): Promise<ResultadoSimple> {
  const error = errorSiNoPuedeElegirDeportesDelClub(await cargarSesion(), clubId);
  if (error) return { ok: false, error };

  const supabase = await supabaseServidor();
  const { error: errorBase } = await supabase
    .from("club_deporte")
    .insert({ club_id: clubId, deporte_id: deporteId });
  if (errorBase && errorBase.code !== YA_ESTABA) {
    if (errorBase.code === RECHAZADO_POR_RLS) {
      return { ok: false, error: "Ese deporte ya no está en el catálogo." };
    }
    return { ok: false, error: "No se pudo sumar el deporte. Probá de nuevo." };
  }

  await revalidar(clubId);
  return { ok: true };
}

/** Quita el deporte del club. En #56 también corta los vínculos de sus jugadores. */
export async function quitarDeporteDelClub(
  clubId: string,
  deporteId: string,
): Promise<ResultadoSimple> {
  const error = errorSiNoPuedeElegirDeportesDelClub(await cargarSesion(), clubId);
  if (error) return { ok: false, error };

  const supabase = await supabaseServidor();
  const { data, error: errorBase } = await supabase
    .from("club_deporte")
    .delete()
    .eq("club_id", clubId)
    .eq("deporte_id", deporteId)
    .select("deporte_id");
  if (errorBase) {
    return { ok: false, error: "No se pudo quitar el deporte. Probá de nuevo." };
  }
  if (!data?.length) {
    return { ok: false, error: "Ese deporte ya no estaba en el club." };
  }

  await revalidar(clubId);
  return { ok: true };
}
