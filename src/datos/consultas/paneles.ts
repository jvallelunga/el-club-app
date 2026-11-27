import "server-only";

import type { PanelesSesion, SesionApp } from "@/dominio/permisos";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { inicialesDesdeNombre } from "@/dominio/slug";
import { urlYClaveAnon } from "../env-supabase";
import { supabaseServidor } from "../supabase-servidor";

/**
 * Los paneles a los que puede ir quien está en sesión, para el selector de
 * panel: el Super Admin, todos los clubes; el Admin, los suyos. Por nombre.
 */
export async function panelesDeLaSesion(sesion: SesionApp): Promise<PanelesSesion> {
  const supabase = await supabaseServidor();
  let consulta = supabase
    .from("club")
    .select("slug, nombre, escudo_ruta")
    .order("nombre", { ascending: true });
  if (!sesion.esSuperAdmin) {
    consulta = consulta.in(
      "id",
      sesion.membresias.map((membresia) => membresia.clubId),
    );
  }
  const { data, error } = await consulta;
  if (error) throw error;

  const supabaseUrl = urlYClaveAnon().url;
  return {
    esSuperAdmin: sesion.esSuperAdmin,
    clubes: (data ?? []).map((club) => ({
      slug: club.slug,
      nombre: club.nombre,
      iniciales: inicialesDesdeNombre(club.nombre),
      escudo: urlEscudoPublico(supabaseUrl, club.escudo_ruta),
    })),
  };
}
