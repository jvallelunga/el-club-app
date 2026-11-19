"use server";

import { revalidatePath } from "next/cache";
import {
  deporteParaGuardar,
  validarDeporte,
  type DeporteInput,
} from "@/dominio/deportes";
import { errorSiNoPuedeAdministrarDeportes } from "@/dominio/permisos";
import type { ResultadoConId, ResultadoSimple } from "@/dominio/resultado";
import { cargarSesion } from "../consultas/sesion";
import { supabaseServidor } from "../supabase-servidor";

const RUTA_CATALOGO = "/super-admin/deportes";

/** Violación de unicidad de Postgres: ya hay un deporte activo con ese nombre. */
const NOMBRE_REPETIDO = "23505";
const MENSAJE_NOMBRE_REPETIDO = "Ya hay un deporte con ese nombre.";

function textoForm(formData: FormData, clave: string): string {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor : "";
}

function deporteDesdeForm(formData: FormData): DeporteInput {
  return {
    nombre: textoForm(formData, "nombre"),
    icono: textoForm(formData, "icono"),
    descripcion: textoForm(formData, "descripcion"),
  };
}

function primerMensaje(
  errores: Record<string, string | undefined>,
): string | undefined {
  return Object.values(errores).find((valor): valor is string => Boolean(valor));
}

async function errorDePermiso(): Promise<string | null> {
  return errorSiNoPuedeAdministrarDeportes(await cargarSesion());
}

export async function crearDeporte(formData: FormData): Promise<ResultadoConId> {
  const error = await errorDePermiso();
  if (error) return { ok: false, error };

  const input = deporteDesdeForm(formData);
  const mensaje = primerMensaje(validarDeporte(input));
  if (mensaje) return { ok: false, error: mensaje };

  const supabase = await supabaseServidor();
  const { data, error: errorBase } = await supabase
    .from("deporte")
    .insert(deporteParaGuardar(input))
    .select("id")
    .single();
  if (errorBase || !data) {
    if (errorBase?.code === NOMBRE_REPETIDO) {
      return { ok: false, error: MENSAJE_NOMBRE_REPETIDO };
    }
    return { ok: false, error: "No se pudo crear el deporte. Probá de nuevo." };
  }

  revalidatePath(RUTA_CATALOGO);
  return { ok: true, id: data.id };
}

export async function editarDeporte(
  deporteId: string,
  formData: FormData,
): Promise<ResultadoSimple> {
  const error = await errorDePermiso();
  if (error) return { ok: false, error };

  const input = deporteDesdeForm(formData);
  const mensaje = primerMensaje(validarDeporte(input));
  if (mensaje) return { ok: false, error: mensaje };

  const supabase = await supabaseServidor();
  const { data, error: errorBase } = await supabase
    .from("deporte")
    .update({ ...deporteParaGuardar(input), actualizado_en: new Date().toISOString() })
    .eq("id", deporteId)
    .is("borrado_en", null)
    .select("id");
  if (errorBase) {
    if (errorBase.code === NOMBRE_REPETIDO) {
      return { ok: false, error: MENSAJE_NOMBRE_REPETIDO };
    }
    return { ok: false, error: "No se pudo guardar el deporte. Probá de nuevo." };
  }
  if (!data?.length) {
    return { ok: false, error: "Ese deporte está borrado: ya no se puede editar." };
  }

  revalidatePath(RUTA_CATALOGO);
  return { ok: true };
}

/** Soft delete: el deporte queda, marcado como borrado. */
export async function borrarDeporte(deporteId: string): Promise<ResultadoSimple> {
  const error = await errorDePermiso();
  if (error) return { ok: false, error };

  const ahora = new Date().toISOString();
  const supabase = await supabaseServidor();
  const { data, error: errorBase } = await supabase
    .from("deporte")
    .update({ borrado_en: ahora, actualizado_en: ahora })
    .eq("id", deporteId)
    .is("borrado_en", null)
    .select("id");
  if (errorBase) {
    return { ok: false, error: "No se pudo borrar el deporte. Probá de nuevo." };
  }
  if (!data?.length) {
    return { ok: false, error: "Ese deporte ya estaba borrado." };
  }

  revalidatePath(RUTA_CATALOGO);
  return { ok: true };
}
