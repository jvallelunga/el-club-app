"use server";

import { revalidatePath } from "next/cache";
import { emailValido, normalizarEmail } from "@/dominio/email";
import {
  BUCKET_ESCUDOS,
  coloresParaGuardar,
  primerError,
  rutaEscudo,
  rutaEscudoObsoleta,
  validarArchivoEscudo,
  validarDatosNuevoClub,
} from "@/dominio/nuevo-club";
import { rutaFallbackClub } from "@/dominio/host";
import type { ResultadoSimple } from "@/dominio/resultado";
import {
  errorAlQuitarAdmin,
  errorSiNoPuedeAdministrarAdmins,
  errorSiNoPuedeEditarClub,
  puedeEditarRutasDelClub,
} from "@/dominio/permisos";
import { cargarSesion } from "../consultas/sesion";
import { enviarMagicLinkIngreso } from "../enviar-link-ingreso";
import { origenDePeticion } from "../origen-peticion";
import { supabaseServidor } from "../supabase-servidor";

export type ResultadoCrearClub =
  | { ok: true; slug: string }
  | { ok: false; error: string };

function textoForm(formData: FormData, clave: string): string {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor : "";
}

export async function crearClub(formData: FormData): Promise<ResultadoCrearClub> {
  const nombre = textoForm(formData, "nombre");
  const slug = textoForm(formData, "slug");
  const colorPrincipal = textoForm(formData, "colorPrincipal");
  const colorClaro = textoForm(formData, "colorClaro");
  const color2 = textoForm(formData, "color2");
  const color3 = textoForm(formData, "color3");
  const dominioBase = textoForm(formData, "dominioBase");
  const escudoCrudo = formData.get("escudo");
  const escudo =
    escudoCrudo instanceof File && escudoCrudo.size > 0 ? escudoCrudo : null;

  const sesion = await cargarSesion();
  if (!sesion?.esSuperAdmin) {
    return { ok: false, error: "Solo el Super Admin puede crear un club." };
  }

  const errores = validarDatosNuevoClub({
    nombre,
    slug,
    slugManual: true,
    marca: colorPrincipal,
    claro: colorClaro || "#ffffff",
    extras: [color2, color3],
    dominioBase,
  });
  const mensaje = primerError(errores);
  if (mensaje) {
    return { ok: false, error: mensaje };
  }

  if (escudo) {
    const errorEscudo = validarArchivoEscudo(escudo.type, escudo.size);
    if (errorEscudo) {
      return { ok: false, error: errorEscudo };
    }
  }

  const colores = coloresParaGuardar(colorPrincipal, colorClaro, [color2, color3]);
  const dominio = dominioBase.trim() ? dominioBase.trim().toLowerCase() : null;
  const slugLimpio = slug.trim();
  const supabase = await supabaseServidor();

  const { data: slugExistente } = await supabase
    .from("club")
    .select("id")
    .eq("slug", slugLimpio)
    .maybeSingle();
  if (slugExistente) {
    return {
      ok: false,
      error: "Ya hay un club con ese identificador. Probá uno distinto.",
    };
  }

  if (dominio) {
    const { data: dominioExistente } = await supabase
      .from("club")
      .select("id")
      .eq("dominio_base", dominio)
      .maybeSingle();
    if (dominioExistente) {
      return {
        ok: false,
        error: "Ya hay un club con ese dominio. Probá uno distinto.",
      };
    }
  }

  const id = crypto.randomUUID();
  let escudoRuta: string | null = null;

  if (escudo) {
    escudoRuta = rutaEscudo(id, escudo.type);
    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_ESCUDOS)
      .upload(escudoRuta, escudo, {
        contentType: escudo.type,
        upsert: false,
      });
    if (errorSubida) {
      return { ok: false, error: "No se pudo subir el escudo. Probá de nuevo." };
    }
  }

  const { error } = await supabase.from("club").insert({
    id,
    nombre: nombre.trim(),
    slug: slugLimpio,
    dominio_base: dominio,
    escudo_ruta: escudoRuta,
    color_principal: colores.colorPrincipal,
    color_claro: colores.colorClaro,
    color_2: colores.color2,
    color_3: colores.color3,
  });

  if (error) {
    if (escudoRuta) {
      await supabase.storage.from(BUCKET_ESCUDOS).remove([escudoRuta]);
    }
    if (error.code === "23505") {
      const detalle = `${error.message} ${error.details ?? ""}`.toLowerCase();
      if (detalle.includes("dominio_base")) {
        return {
          ok: false,
          error: "Ya hay un club con ese dominio. Probá uno distinto.",
        };
      }
      return {
        ok: false,
        error: "Ya hay un club con ese identificador. Probá uno distinto.",
      };
    }
    return { ok: false, error: "No se pudo crear el club. Probá de nuevo." };
  }

  revalidatePath("/super-admin");
  return { ok: true, slug: slugLimpio };
}


export async function actualizarClub(
  clubId: string,
  formData: FormData,
): Promise<ResultadoCrearClub> {
  const nombre = textoForm(formData, "nombre");
  const colorPrincipal = textoForm(formData, "colorPrincipal");
  const colorClaro = textoForm(formData, "colorClaro");
  const color2 = textoForm(formData, "color2");
  const color3 = textoForm(formData, "color3");
  const dominioBase = textoForm(formData, "dominioBase");
  const escudoCrudo = formData.get("escudo");
  const escudo =
    escudoCrudo instanceof File && escudoCrudo.size > 0 ? escudoCrudo : null;

  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeEditarClub(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
  }

  const supabase = await supabaseServidor();
  const { data: club, error: errorClub } = await supabase
    .from("club")
    .select("id, slug, escudo_ruta, dominio_base")
    .eq("id", clubId)
    .maybeSingle();
  if (errorClub || !club) {
    return { ok: false, error: "No encontramos ese club." };
  }

  const editaRutas = puedeEditarRutasDelClub(sesion);
  const dominioParaValidar = editaRutas ? dominioBase : (club.dominio_base ?? "");

  const errores = validarDatosNuevoClub({
    nombre,
    slug: club.slug,
    slugManual: true,
    marca: colorPrincipal,
    claro: colorClaro || "#ffffff",
    extras: [color2, color3],
    dominioBase: dominioParaValidar,
  });
  const mensaje = primerError(errores);
  if (mensaje) {
    return { ok: false, error: mensaje };
  }

  if (escudo) {
    const errorEscudo = validarArchivoEscudo(escudo.type, escudo.size);
    if (errorEscudo) {
      return { ok: false, error: errorEscudo };
    }
  }

  const colores = coloresParaGuardar(colorPrincipal, colorClaro, [color2, color3]);
  const dominio = editaRutas
    ? (dominioBase.trim() ? dominioBase.trim().toLowerCase() : null)
    : club.dominio_base;

  if (editaRutas && dominio) {
    const { data: dominioExistente } = await supabase
      .from("club")
      .select("id")
      .eq("dominio_base", dominio)
      .neq("id", clubId)
      .maybeSingle();
    if (dominioExistente) {
      return {
        ok: false,
        error: "Ya hay un club con ese dominio. Probá uno distinto.",
      };
    }
  }

  let escudoRuta = club.escudo_ruta;
  let rutaSubida: string | null = null;

  if (escudo) {
    const rutaNueva = rutaEscudo(club.id, escudo.type);
    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_ESCUDOS)
      .upload(rutaNueva, escudo, {
        contentType: escudo.type,
        upsert: true,
      });
    if (errorSubida) {
      return { ok: false, error: "No se pudo subir el escudo. Probá de nuevo." };
    }
    rutaSubida = rutaNueva;
    escudoRuta = rutaNueva;
  }

  const { error } = await supabase
    .from("club")
    .update(
      editaRutas
        ? {
            nombre: nombre.trim(),
            dominio_base: dominio,
            escudo_ruta: escudoRuta,
            color_principal: colores.colorPrincipal,
            color_claro: colores.colorClaro,
            color_2: colores.color2,
            color_3: colores.color3,
          }
        : {
            nombre: nombre.trim(),
            escudo_ruta: escudoRuta,
            color_principal: colores.colorPrincipal,
            color_claro: colores.colorClaro,
            color_2: colores.color2,
            color_3: colores.color3,
          },
    )
    .eq("id", clubId);

  if (error) {
    if (rutaSubida && rutaSubida !== club.escudo_ruta) {
      await supabase.storage.from(BUCKET_ESCUDOS).remove([rutaSubida]);
    }
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ya hay un club con ese dominio. Probá uno distinto.",
      };
    }
    return { ok: false, error: "No se pudo guardar el club. Probá de nuevo." };
  }

  const rutaVieja = rutaSubida
    ? rutaEscudoObsoleta(club.escudo_ruta, rutaSubida)
    : null;
  if (rutaVieja) {
    await supabase.storage.from(BUCKET_ESCUDOS).remove([rutaVieja]);
  }

  revalidatePath("/super-admin");
  revalidatePath(`/c/${club.slug}/admin`);
  revalidatePath(`/c/${club.slug}/admin/club`);
  revalidatePath(`/super-admin/clubes/${club.slug}/editar`);
  revalidatePath(`/super-admin/clubes/${club.slug}/admins`);
  revalidatePath(`/c/${club.slug}/admin/admins`);
  return { ok: true, slug: club.slug };
}

export type ResultadoInvitar =
  | {
      ok: true;
      aceptadaDeInmediato: boolean;
      linkEnviado: boolean;
      errorLink?: string;
    }
  | { ok: false; error: string };

async function enviarLinkInvitacion(
  email: string,
  slug: string,
): Promise<{ linkEnviado: boolean; errorLink?: string }> {
  const origen = await origenDePeticion();
  if (!origen) {
    return {
      linkEnviado: false,
      errorLink: "No se pudo enviar el link. Probá de nuevo con «Reenviar link».",
    };
  }
  const envio = await enviarMagicLinkIngreso(email, {
    origen,
    siguiente: rutaFallbackClub(slug, "admin"),
  });
  if (!envio.ok) {
    return { linkEnviado: false, errorLink: envio.error };
  }
  return { linkEnviado: true };
}

export async function invitarAdminClub(
  clubId: string,
  emailCrudo: string,
): Promise<ResultadoInvitar> {
  const email = normalizarEmail(emailCrudo);
  if (!emailValido(email)) {
    return { ok: false, error: "Ese email no se ve válido." };
  }

  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarAdmins(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
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
  revalidatePath(`/c/${club.slug}/admin/admins`);
  revalidatePath(`/c/${club.slug}/admin`);

  const envio = await enviarLinkInvitacion(email, club.slug);
  return {
    ok: true,
    aceptadaDeInmediato: Boolean(data?.aceptada_en),
    ...envio,
  };
}

export async function reenviarLinkInvitacionClub(
  clubId: string,
  invitacionId: string,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarAdmins(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
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

  const { data: invitacion } = await supabase
    .from("club_invitacion")
    .select("id, email")
    .eq("id", invitacionId)
    .eq("club_id", clubId)
    .is("aceptada_en", null)
    .maybeSingle();
  if (!invitacion) {
    return { ok: false, error: "No encontramos esa invitación pendiente." };
  }

  const envio = await enviarLinkInvitacion(invitacion.email, club.slug);
  if (!envio.linkEnviado) {
    return {
      ok: false,
      error: envio.errorLink ?? "No se pudo enviar el link. Probá de nuevo con «Reenviar link».",
    };
  }
  return { ok: true };
}

export async function quitarAdminClub(
  clubId: string,
  usuarioId: string,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarAdmins(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
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

  const { count, error: errorConteo } = await supabase
    .from("club_miembro")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("rol", "admin");
  if (errorConteo) {
    return { ok: false, error: "No se pudo quitar. Probá de nuevo." };
  }
  const mensajeUltimo = errorAlQuitarAdmin({
    actorUsuarioId: sesion.usuarioId,
    objetivoUsuarioId: usuarioId,
    cantidadAdmins: count ?? 0,
  });
  if (mensajeUltimo) {
    return { ok: false, error: mensajeUltimo };
  }

  const { data: borrados, error } = await supabase
    .from("club_miembro")
    .delete()
    .eq("club_id", clubId)
    .eq("usuario_id", usuarioId)
    .select("id");

  if (error) {
    if (error.code === "P0001") {
      // La base no deja quitar al último Admin (otro quitó al resto mientras tanto).
      return { ok: false, error: "No se puede quitar al último Admin del club." };
    }
    return { ok: false, error: "No se pudo quitar. Probá de nuevo." };
  }
  if (!borrados || borrados.length === 0) {
    return { ok: false, error: "Esa persona ya no es Admin de este club." };
  }

  revalidatePath(`/super-admin/clubes/${club.slug}/admins`);
  revalidatePath(`/c/${club.slug}/admin/admins`);
  revalidatePath(`/c/${club.slug}/admin`);
  return { ok: true };
}

export async function cancelarInvitacionClub(
  clubId: string,
  invitacionId: string,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarAdmins(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
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

  const { data: borradas, error } = await supabase
    .from("club_invitacion")
    .delete()
    .eq("id", invitacionId)
    .eq("club_id", clubId)
    .is("aceptada_en", null)
    .select("id");

  if (error) {
    return { ok: false, error: "No se pudo cancelar. Probá de nuevo." };
  }
  if (!borradas || borradas.length === 0) {
    return { ok: false, error: "No encontramos esa invitación pendiente." };
  }

  revalidatePath(`/super-admin/clubes/${club.slug}/admins`);
  revalidatePath(`/c/${club.slug}/admin/admins`);
  return { ok: true };
}
