"use server";

import { revalidatePath } from "next/cache";
import { emailValido, normalizarEmail } from "@/dominio/email";
import { slugDesdeNombre } from "@/dominio/slug";
import { cargarSesion } from "../consultas/sesion";
import { supabaseServidor } from "../supabase-servidor";

export type ResultadoCrearClub =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function crearClub(nombreCrudo: string): Promise<ResultadoCrearClub> {
  const nombre = nombreCrudo.trim();
  const slug = slugDesdeNombre(nombre);
  if (!nombre || !slug) {
    return { ok: false, error: "Escribí el nombre del club." };
  }

  const sesion = await cargarSesion();
  if (!sesion?.esSuperAdmin) {
    return { ok: false, error: "Solo el Super Admin puede crear un club." };
  }

  const supabase = await supabaseServidor();
  const { error } = await supabase.from("club").insert({ nombre, slug });
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ya hay un club con ese identificador. Probá un nombre distinto.",
      };
    }
    return { ok: false, error: "No se pudo crear el club. Probá de nuevo." };
  }

  revalidatePath("/super-admin");
  return { ok: true, slug };
}

export type ResultadoInvitar =
  | { ok: true; aceptadaDeInmediato: boolean }
  | { ok: false; error: string };

export async function invitarAdminClub(
  clubId: string,
  emailCrudo: string,
): Promise<ResultadoInvitar> {
  const email = normalizarEmail(emailCrudo);
  if (!emailValido(email)) {
    return { ok: false, error: "Ese email no se ve válido." };
  }

  const sesion = await cargarSesion();
  if (!sesion) {
    return { ok: false, error: "Tenés que ingresar de nuevo." };
  }

  const supabase = await supabaseServidor();

  const { data: club } = await supabase
    .from("club")
    .select("id, slug")
    .eq("id", clubId)
    .maybeSingle();
  if (!club) {
    return { ok: false, error: "No encontramos ese club." };
  }

  const { data: yaMiembro } = await supabase
    .from("club_miembro")
    .select("id, usuario:usuario_id (email)")
    .eq("club_id", clubId);

  if (
    (yaMiembro ?? []).some((fila) => {
      const usuario = fila.usuario;
      return usuario && !Array.isArray(usuario) && usuario.email === email;
    })
  ) {
    return { ok: false, error: "Ese email ya es Admin de este club." };
  }

  const { data, error } = await supabase
    .from("club_invitacion")
    .insert({ club_id: clubId, email, rol: "admin" })
    .select("id, aceptada_en")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ese email ya tiene una invitación pendiente.",
      };
    }
    return { ok: false, error: "No se pudo agregar. Probá de nuevo." };
  }

  revalidatePath(`/super-admin/clubes/${club.slug}/admins`);
  revalidatePath(`/c/${club.slug}/admin`);
  return { ok: true, aceptadaDeInmediato: Boolean(data?.aceptada_en) };
}

export type ResultadoSimple = { ok: true } | { ok: false; error: string };

export async function quitarAdminClub(
  clubId: string,
  usuarioId: string,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  if (!sesion) {
    return { ok: false, error: "Tenés que ingresar de nuevo." };
  }

  const supabase = await supabaseServidor();
  const { data: club } = await supabase
    .from("club")
    .select("id, slug")
    .eq("id", clubId)
    .maybeSingle();
  if (!club) {
    return { ok: false, error: "No encontramos ese club." };
  }

  const { error } = await supabase
    .from("club_miembro")
    .delete()
    .eq("club_id", clubId)
    .eq("usuario_id", usuarioId);

  if (error) {
    return { ok: false, error: "No se pudo quitar. Probá de nuevo." };
  }

  revalidatePath(`/super-admin/clubes/${club.slug}/admins`);
  revalidatePath(`/c/${club.slug}/admin`);
  return { ok: true };
}

export async function cancelarInvitacionClub(
  clubId: string,
  invitacionId: string,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  if (!sesion) {
    return { ok: false, error: "Tenés que ingresar de nuevo." };
  }

  const supabase = await supabaseServidor();
  const { data: club } = await supabase
    .from("club")
    .select("id, slug")
    .eq("id", clubId)
    .maybeSingle();
  if (!club) {
    return { ok: false, error: "No encontramos ese club." };
  }

  const { error } = await supabase
    .from("club_invitacion")
    .delete()
    .eq("id", invitacionId)
    .eq("club_id", clubId)
    .is("aceptada_en", null);

  if (error) {
    return { ok: false, error: "No se pudo cancelar. Probá de nuevo." };
  }

  revalidatePath(`/super-admin/clubes/${club.slug}/admins`);
  return { ok: true };
}
