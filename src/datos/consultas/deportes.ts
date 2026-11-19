import "server-only";

import {
  esClaveIconoDeporte,
  ICONO_DEPORTE_POR_DEFECTO,
  type Deporte,
} from "@/dominio/deportes";
import { supabaseServidor } from "../supabase-servidor";

/** Todo el catálogo, borrados incluidos. */
export async function listarDeportes(): Promise<Deporte[]> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("deporte")
    .select("id, nombre, icono, descripcion, borrado_en")
    .order("nombre", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    icono: esClaveIconoDeporte(fila.icono) ? fila.icono : ICONO_DEPORTE_POR_DEFECTO,
    descripcion: fila.descripcion ?? "",
    borradoEn: fila.borrado_en,
  }));
}
