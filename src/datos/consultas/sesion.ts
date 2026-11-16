import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembresiaClub, SesionApp } from "@/dominio/permisos";
import type { Database } from "../tipos";
import { supabaseServidor } from "../supabase-servidor";

type Cliente = SupabaseClient<Database>;

export async function cargarSesion(
  cliente?: Cliente,
): Promise<SesionApp | null> {
  const supabase = cliente ?? (await supabaseServidor());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = (user.email ?? "").toLowerCase();
  const nombreAuth =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    (typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null) ??
    email.split("@")[0] ??
    "Usuario";

  const { data: perfil } = await supabase
    .from("usuario")
    .select("id, nombre, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: superAdmin } = await supabase
    .from("super_admin")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const { data: filas } = await supabase
    .from("club_miembro")
    .select("club_id, rol, club:club_id (id, slug, nombre)")
    .eq("usuario_id", user.id);

  const membresias: MembresiaClub[] = [];
  for (const fila of filas ?? []) {
    const club = fila.club;
    if (!club || Array.isArray(club) || fila.rol !== "admin") continue;
    membresias.push({
      clubId: club.id,
      slug: club.slug,
      nombre: club.nombre,
      rol: "admin",
    });
  }

  return {
    usuarioId: user.id,
    email: perfil?.email ?? email,
    nombre: perfil?.nombre ?? nombreAuth,
    esSuperAdmin: Boolean(superAdmin),
    membresias,
  };
}
