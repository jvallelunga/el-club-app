import "server-only";

import { CONDICION_VACIA, validarCondicion } from "@/dominio/condicion";
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
    .select("id, nombre, icono, descripcion, condicion, borrado_en")
    .order("nombre", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((fila) => {
    // La base ya valida la forma (deporte_condicion_check); esto solo tipa el jsonb.
    const condicion = validarCondicion(fila.condicion);
    return {
      id: fila.id,
      nombre: fila.nombre,
      icono: esClaveIconoDeporte(fila.icono) ? fila.icono : ICONO_DEPORTE_POR_DEFECTO,
      descripcion: fila.descripcion ?? "",
      condicion: condicion.ok ? condicion.condicion : CONDICION_VACIA,
      borradoEn: fila.borrado_en,
    };
  });
}
