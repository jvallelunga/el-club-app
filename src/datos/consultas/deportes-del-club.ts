import "server-only";

import { CONDICION_VACIA, validarCondicion } from "@/dominio/condicion";
import type { ClubesPorDeporte, DeporteElegido } from "@/dominio/deportes";
import { supabaseServidor } from "../supabase-servidor";

/**
 * Los deportes que eligió el club, borrados del catálogo incluidos, con la
 * condición que el club les suma (#77).
 */
export async function deportesElegidosPorElClub(clubId: string): Promise<DeporteElegido[]> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("club_deporte")
    .select("deporte_id, condicion")
    .eq("club_id", clubId);
  if (error) throw error;
  return (data ?? []).map((fila) => {
    // La base ya valida la forma (club_deporte_condicion_check); esto solo tipa el jsonb.
    const condicion = validarCondicion(fila.condicion);
    return {
      deporteId: fila.deporte_id,
      condicion: condicion.ok ? condicion.condicion : CONDICION_VACIA,
    };
  });
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
