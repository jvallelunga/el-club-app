import "server-only";

import type { Club } from "../tipos";
import { supabaseServidor } from "../supabase-servidor";

const COLUMNAS_CLUB =
  "id, slug, nombre, dominio_base, escudo_ruta, color_principal, color_claro, color_2, color_3, telefono, email, direccion, web, creado_en, borrado_en";

/** Los clubes activos, por nombre. */
export async function listarClubes(): Promise<Club[]> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("club")
    .select(COLUMNAS_CLUB)
    .is("borrado_en", null)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Los clubes que eliminó el Super Admin, el último primero. */
export async function listarClubesEliminados(): Promise<Club[]> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("club")
    .select(COLUMNAS_CLUB)
    .not("borrado_en", "is", null)
    .order("borrado_en", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Un club activo por su identificador; uno eliminado no se encuentra. */
export async function clubPorSlug(slug: string): Promise<Club | null> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("club")
    .select(COLUMNAS_CLUB)
    .eq("slug", slug)
    .is("borrado_en", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type AdminDelClub = {
  usuarioId: string;
  nombre: string;
  email: string;
};

export type InvitacionPendiente = {
  id: string;
  email: string;
  creadoEn: string;
};

export async function adminsYInvitaciones(clubId: string): Promise<{
  admins: AdminDelClub[];
  invitaciones: InvitacionPendiente[];
}> {
  const supabase = await supabaseServidor();

  const { data: miembros, error: errorMiembros } = await supabase
    .from("club_miembro")
    .select("usuario_id, usuario:usuario_id (id, nombre, email)")
    .eq("club_id", clubId)
    .eq("rol", "admin")
    .order("creado_en", { ascending: true });
  if (errorMiembros) throw errorMiembros;

  const admins: AdminDelClub[] = [];
  for (const fila of miembros ?? []) {
    const usuario = fila.usuario;
    if (!usuario || Array.isArray(usuario)) continue;
    admins.push({
      usuarioId: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
    });
  }

  const { data: invitaciones, error: errorInvitaciones } = await supabase
    .from("club_invitacion")
    .select("id, email, creado_en")
    .eq("club_id", clubId)
    .is("aceptada_en", null)
    .order("creado_en", { ascending: true });
  if (errorInvitaciones) throw errorInvitaciones;

  return {
    admins,
    invitaciones: (invitaciones ?? []).map((fila) => ({
      id: fila.id,
      email: fila.email,
      creadoEn: fila.creado_en,
    })),
  };
}

export async function cantidadAdminsPorClub(
  clubIds: string[],
): Promise<Record<string, number>> {
  if (clubIds.length === 0) return {};
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("club_miembro")
    .select("club_id")
    .in("club_id", clubIds)
    .eq("rol", "admin");
  if (error) throw error;
  const conteo: Record<string, number> = {};
  for (const id of clubIds) conteo[id] = 0;
  for (const fila of data ?? []) {
    conteo[fila.club_id] = (conteo[fila.club_id] ?? 0) + 1;
  }
  return conteo;
}
