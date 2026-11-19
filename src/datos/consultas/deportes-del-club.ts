import "server-only";

import type { ClubesPorDeporte } from "@/dominio/deportes";
import { supabaseServidor } from "../supabase-servidor";

/** Los ids de los deportes que eligió el club, borrados del catálogo incluidos. */
export async function idsDeportesDelClub(clubId: string): Promise<string[]> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("club_deporte")
    .select("deporte_id")
    .eq("club_id", clubId);
  if (error) throw error;
  return (data ?? []).map((fila) => fila.deporte_id);
}

/**
 * Cuántos clubes eligieron cada deporte, para el «Uso» del catálogo. Solo
 * tiene sentido para el Super Admin: a un Admin la RLS le muestra su club.
 */
export async function clubesPorDeporte(): Promise<ClubesPorDeporte> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("club_deporte").select("deporte_id");
  if (error) throw error;
  const cantidades: ClubesPorDeporte = {};
  for (const fila of data ?? []) {
    cantidades[fila.deporte_id] = (cantidades[fila.deporte_id] ?? 0) + 1;
  }
  return cantidades;
}
