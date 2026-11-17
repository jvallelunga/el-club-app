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
  NOMBRE_TIPO_OTRA,
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

function redesDesdeForm(formData: FormData): RedSocialInput[] {
  const crudo = textoForm(formData, "redes");
  if (!crudo) return [];
  try {
    const parsed = JSON.parse(crudo) as unknown;
    if (!Array.isArray(parsed)) return [];
    const redes: RedSocialInput[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const fila = item as Record<string, unknown>;
      const red = typeof fila.red === "string" ? fila.red : "";
      const valor = typeof fila.valor === "string" ? fila.valor : "";
      const etiqueta =
        typeof fila.etiqueta === "string" ? fila.etiqueta : undefined;
      if (!red && !valor) continue;
      redes.push({ red, valor, etiqueta });
    }
    return redes;
  } catch {
    return [];
  }
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

  const input = {
    telefono: textoForm(formData, "telefono"),
    email: textoForm(formData, "email"),
    direccion: textoForm(formData, "direccion"),
    web: textoForm(formData, "web"),
    redes: redesDesdeForm(formData),
  };
  const mensaje = primerMensaje(validarContacto(input));
  if (mensaje) return { ok: false, error: mensaje };

  const guardado = contactoParaGuardar(input);
  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from("club")
    .update({
      telefono: guardado.telefono,
      email: guardado.email,
      direccion: guardado.direccion,
      web: guardado.web,
    })
    .eq("id", clubId);
  if (error) {
    return { ok: false, error: "No se pudo guardar el contacto. Probá de nuevo." };
  }

  const { error: errorBorrar } = await supabase
    .from("club_red_social")
    .delete()
    .eq("club_id", clubId);
  if (errorBorrar) {
    return { ok: false, error: "No se pudieron actualizar las redes. Probá de nuevo." };
  }

  if (guardado.redes.length > 0) {
    const { error: errorRedes } = await supabase.from("club_red_social").insert(
      guardado.redes.map((red) => ({
        club_id: clubId,
        red: red.red,
        etiqueta: red.etiqueta,
        valor: red.valor,
        orden: red.orden,
      })),
    );
    if (errorRedes) {
      return { ok: false, error: "No se pudieron guardar las redes. Probá de nuevo." };
    }
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

async function resolverTipoInstalacion(params: {
  clubId: string;
  tipoId: string;
  tipoPropio: string | null;
  creaTipoPropio: boolean;
}): Promise<{ ok: true; tipoId: string } | { ok: false; error: string }> {
  const supabase = await supabaseServidor();

  if (params.creaTipoPropio && params.tipoPropio) {
    const nombre = params.tipoPropio;
    const { data: tiposDelClub, error: errorTipos } = await supabase
      .from("tipo_instalacion")
      .select("id, club_id, nombre")
      .eq("club_id", params.clubId);
    if (errorTipos) {
      return {
        ok: false,
        error: "No se pudo agregar el tipo de instalación. Probá de nuevo.",
      };
    }
    const existente = (tiposDelClub ?? []).find(
      (tipo) => tipo.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (existente) return { ok: true, tipoId: existente.id };

    const { data: creado, error } = await supabase
      .from("tipo_instalacion")
      .insert({ club_id: params.clubId, nombre })
      .select("id")
      .maybeSingle();
    if (error || !creado) {
      return {
        ok: false,
        error: "No se pudo agregar el tipo de instalación. Probá de nuevo.",
      };
    }
    return { ok: true, tipoId: creado.id };
  }

  const { data: tipo } = await supabase
    .from("tipo_instalacion")
    .select("id, club_id, nombre")
    .eq("id", params.tipoId)
    .maybeSingle();
  if (!tipo) {
    return { ok: false, error: "Elegí un tipo de instalación." };
  }
  if (tipo.club_id && tipo.club_id !== params.clubId) {
    return { ok: false, error: "Ese tipo no pertenece a este club." };
  }
  if (tipo.club_id === null && tipo.nombre === NOMBRE_TIPO_OTRA) {
    return { ok: false, error: "Poné el nombre del tipo de instalación." };
  }
  return { ok: true, tipoId: tipo.id };
}

async function tipoOtraId(): Promise<string | null> {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("tipo_instalacion")
    .select("id")
    .is("club_id", null)
    .eq("nombre", NOMBRE_TIPO_OTRA)
    .maybeSingle();
  return data?.id ?? null;
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

  const tipoOtra = await tipoOtraId();
  const input = {
    tipoId: textoForm(formData, "tipo_instalacion_id"),
    tipoPropio: textoForm(formData, "tipo_propio"),
    nombre: textoForm(formData, "nombre"),
    notas: textoForm(formData, "notas"),
    tipoOtraId: tipoOtra,
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

  const tipo = await resolverTipoInstalacion({
    clubId,
    tipoId: input.tipoId,
    tipoPropio: guardado.tipoPropio,
    creaTipoPropio: guardado.creaTipoPropio,
  });
  if (!tipo.ok) return tipo;

  const { data, error } = await supabase
    .from("instalacion")
    .insert({
      sede_id: sedeId,
      tipo_instalacion_id: tipo.tipoId,
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

  const tipoOtra = await tipoOtraId();
  const input = {
    tipoId: textoForm(formData, "tipo_instalacion_id"),
    tipoPropio: textoForm(formData, "tipo_propio"),
    nombre: textoForm(formData, "nombre"),
    notas: textoForm(formData, "notas"),
    tipoOtraId: tipoOtra,
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

  const tipo = await resolverTipoInstalacion({
    clubId,
    tipoId: input.tipoId,
    tipoPropio: guardado.tipoPropio,
    creaTipoPropio: guardado.creaTipoPropio,
  });
  if (!tipo.ok) return tipo;

  const { data, error } = await supabase
    .from("instalacion")
    .update({
      tipo_instalacion_id: tipo.tipoId,
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

