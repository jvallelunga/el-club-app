"use server";

import { revalidatePath } from "next/cache";
import {
  contactoParaGuardar,
  validarContacto,
  type RedSocialInput,
} from "@/dominio/contacto";
import { errorSiNoPuedeAdministrarSedes, errorSiNoPuedeEditarClub } from "@/dominio/permisos";
import {
  instalacionParaGuardar,
  sedeParaGuardar,
  validarInstalacion,
  validarSede,
} from "@/dominio/sedes";
import { cargarSesion } from "../consultas/sesion";
import { supabaseServidor } from "../supabase-servidor";

export type ResultadoSimple =
  | { ok: true }
  | { ok: false; error: string };

export type ResultadoConId =
  | { ok: true; id: string }
  | { ok: false; error: string };


function primerMensaje(
  errores: Record<string, string | undefined>,
): string | undefined {
  return Object.values(errores).find((valor): valor is string => Boolean(valor));
}

function textoForm(formData: FormData, clave: string): string {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor : "";
}

/**
 * Lee las redes del formulario. Devuelve null si el campo no es una lista
 * válida, para no confundir datos rotos con «sin redes» y borrarlas todas.
 */
function redesDesdeForm(formData: FormData): RedSocialInput[] | null {
  const crudo = textoForm(formData, "redes");
  if (!crudo) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(crudo);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const redes: RedSocialInput[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") return null;
    const fila = item as Record<string, unknown>;
    const red = typeof fila.red === "string" ? fila.red : "";
    const valor = typeof fila.valor === "string" ? fila.valor : "";
    const etiqueta =
      typeof fila.etiqueta === "string" ? fila.etiqueta : undefined;
    if (!red && !valor) continue;
    redes.push({ red, valor, etiqueta });
  }
  return redes;
}

async function slugDelClub(clubId: string): Promise<string | null> {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("club")
    .select("slug")
    .eq("id", clubId)
    .maybeSingle();
  return data?.slug ?? null;
}

function revalidarClub(slug: string) {
  revalidatePath(`/c/${slug}/admin`);
  revalidatePath(`/c/${slug}/admin/club`);
  revalidatePath(`/c/${slug}/admin/sedes`);
}

export async function actualizarContactoClub(
  clubId: string,
  formData: FormData,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeEditarClub(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
  }

  const redes = redesDesdeForm(formData);
  if (redes === null) {
    return { ok: false, error: "No se pudieron leer las redes. Recargá la página y probá de nuevo." };
  }
  const input = {
    telefono: textoForm(formData, "telefono"),
    email: textoForm(formData, "email"),
    direccion: textoForm(formData, "direccion"),
    web: textoForm(formData, "web"),
    redes,
  };
  const mensaje = primerMensaje(validarContacto(input));
  if (mensaje) return { ok: false, error: mensaje };

  const guardado = contactoParaGuardar(input);
  const supabase = await supabaseServidor();
  // Una sola transacción: si algo falla, no se pierden las redes anteriores.
  const { error } = await supabase.rpc("guardar_contacto_club", {
    p_club_id: clubId,
    p_telefono: guardado.telefono,
    p_email: guardado.email,
    p_direccion: guardado.direccion,
    p_web: guardado.web,
    p_redes: guardado.redes.map((red) => ({
      red: red.red,
      etiqueta: red.etiqueta,
      valor: red.valor,
      orden: red.orden,
    })),
  });
  if (error) {
    return { ok: false, error: "No se pudo guardar el contacto. Probá de nuevo." };
  }

  const slug = await slugDelClub(clubId);
  if (slug) revalidarClub(slug);
  return { ok: true };
}

export async function crearSede(
  clubId: string,
  formData: FormData,
): Promise<ResultadoConId> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarSedes(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
  }

  const input = {
    nombre: textoForm(formData, "nombre"),
    direccion: textoForm(formData, "direccion"),
    mapsUrl: textoForm(formData, "maps_url"),
  };
  const mensaje = primerMensaje(validarSede(input));
  if (mensaje) return { ok: false, error: mensaje };

  const fila = sedeParaGuardar(input);
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("sede")
    .insert({
      club_id: clubId,
      nombre: fila.nombre,
      direccion: fila.direccion,
      maps_url: fila.maps_url,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: "No se pudo crear la sede. Probá de nuevo." };
  }

  const slug = await slugDelClub(clubId);
  if (slug) {
    revalidarClub(slug);
    revalidatePath(`/c/${slug}/admin/sedes/${data.id}`);
  }
  return { ok: true, id: data.id };
}

export async function actualizarSede(
  clubId: string,
  sedeId: string,
  formData: FormData,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarSedes(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
  }

  const input = {
    nombre: textoForm(formData, "nombre"),
    direccion: textoForm(formData, "direccion"),
    mapsUrl: textoForm(formData, "maps_url"),
  };
  const mensaje = primerMensaje(validarSede(input));
  if (mensaje) return { ok: false, error: mensaje };

  const fila = sedeParaGuardar(input);
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("sede")
    .update({
      nombre: fila.nombre,
      direccion: fila.direccion,
      maps_url: fila.maps_url,
    })
    .eq("id", sedeId)
    .eq("club_id", clubId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, error: "No se pudo guardar la sede. Probá de nuevo." };
  }
  if (!data) {
    return { ok: false, error: "No encontramos esa sede." };
  }

  const slug = await slugDelClub(clubId);
  if (slug) {
    revalidarClub(slug);
    revalidatePath(`/c/${slug}/admin/sedes/${sedeId}`);
  }
  return { ok: true };
}

export async function crearInstalacion(
  clubId: string,
  sedeId: string,
  formData: FormData,
): Promise<ResultadoConId> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarSedes(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
  }

  const input = {
    tipo: textoForm(formData, "tipo"),
    nombre: textoForm(formData, "nombre"),
    notas: textoForm(formData, "notas"),
  };
  const mensaje = primerMensaje(validarInstalacion(input));
  if (mensaje) return { ok: false, error: mensaje };
  const guardado = instalacionParaGuardar(input);

  const supabase = await supabaseServidor();
  const { data: sede } = await supabase
    .from("sede")
    .select("id")
    .eq("id", sedeId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!sede) return { ok: false, error: "No encontramos esa sede." };

  const { data, error } = await supabase
    .from("instalacion")
    .insert({
      sede_id: sedeId,
      tipo: guardado.tipo,
      nombre: guardado.nombre,
      notas: guardado.notas,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: "No se pudo agregar la instalación. Probá de nuevo." };
  }

  const slug = await slugDelClub(clubId);
  if (slug) {
    revalidarClub(slug);
    revalidatePath(`/c/${slug}/admin/sedes/${sedeId}`);
  }
  return { ok: true, id: data.id };
}

export async function actualizarInstalacion(
  clubId: string,
  sedeId: string,
  instalacionId: string,
  formData: FormData,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarSedes(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
  }

  const input = {
    tipo: textoForm(formData, "tipo"),
    nombre: textoForm(formData, "nombre"),
    notas: textoForm(formData, "notas"),
  };
  const mensaje = primerMensaje(validarInstalacion(input));
  if (mensaje) return { ok: false, error: mensaje };
  const guardado = instalacionParaGuardar(input);

  const supabase = await supabaseServidor();
  const { data: sede } = await supabase
    .from("sede")
    .select("id")
    .eq("id", sedeId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!sede) return { ok: false, error: "No encontramos esa sede." };

  const { data, error } = await supabase
    .from("instalacion")
    .update({
      tipo: guardado.tipo,
      nombre: guardado.nombre,
      notas: guardado.notas,
    })
    .eq("id", instalacionId)
    .eq("sede_id", sedeId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, error: "No se pudo guardar la instalación. Probá de nuevo." };
  }
  if (!data) return { ok: false, error: "No encontramos esa instalación." };

  const slug = await slugDelClub(clubId);
  if (slug) {
    revalidarClub(slug);
    revalidatePath(`/c/${slug}/admin/sedes/${sedeId}`);
  }
  return { ok: true };
}

export async function eliminarInstalacion(
  clubId: string,
  sedeId: string,
  instalacionId: string,
): Promise<ResultadoSimple> {
  const sesion = await cargarSesion();
  const permiso = errorSiNoPuedeAdministrarSedes(sesion, clubId);
  if (permiso || !sesion) {
    return { ok: false, error: permiso ?? "Tenés que ingresar de nuevo." };
  }

  const supabase = await supabaseServidor();
  const { data: sede } = await supabase
    .from("sede")
    .select("id")
    .eq("id", sedeId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (!sede) return { ok: false, error: "No encontramos esa sede." };

  const { data, error } = await supabase
    .from("instalacion")
    .delete()
    .eq("id", instalacionId)
    .eq("sede_id", sedeId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, error: "No se pudo eliminar. Probá de nuevo." };
  }
  if (!data) return { ok: false, error: "No encontramos esa instalación." };

  const slug = await slugDelClub(clubId);
  if (slug) {
    revalidarClub(slug);
    revalidatePath(`/c/${slug}/admin/sedes/${sedeId}`);
  }
  return { ok: true };
}

