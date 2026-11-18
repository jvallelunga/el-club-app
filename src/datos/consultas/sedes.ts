import "server-only";

import { esIdRedSocial, type IdRedSocial } from "@/dominio/contacto";
import {
  CLAVE_TIPO_OTRA,
  esClaveTipoInstalacion,
  tipoInstalacion,
  type ClaveTipoInstalacion,
} from "@/dominio/tipos-instalacion";
import type { ClubRedSocial, Instalacion, Sede } from "../tipos";
import { supabaseServidor } from "../supabase-servidor";

export type RedSocialClub = {
  id: string;
  red: IdRedSocial;
  etiqueta: string | null;
  valor: string;
  orden: number;
};

export type ContactoClub = {
  telefono: string;
  email: string;
  direccion: string;
  web: string;
  redes: RedSocialClub[];
};

export type InstalacionVista = {
  id: string;
  tipo: ClaveTipoInstalacion;
  tipoNombre: string;
  nombre: string;
  notas: string;
};

export type SedeLista = Sede & { cantidadInstalaciones: number };

export type SedeDetalle = Sede & { instalaciones: InstalacionVista[] };

export async function contactoDelClub(clubId: string): Promise<ContactoClub> {
  const supabase = await supabaseServidor();
  const { data: club, error } = await supabase
    .from("club")
    .select("telefono, email, direccion, web")
    .eq("id", clubId)
    .maybeSingle();
  if (error) throw error;

  const { data: redes, error: errorRedes } = await supabase
    .from("club_red_social")
    .select("id, red, etiqueta, valor, orden")
    .eq("club_id", clubId)
    .order("orden", { ascending: true })
    .order("creado_en", { ascending: true });
  if (errorRedes) throw errorRedes;

  return {
    telefono: club?.telefono ?? "",
    email: club?.email ?? "",
    direccion: club?.direccion ?? "",
    web: club?.web ?? "",
    redes: (redes ?? [])
      .filter((fila): fila is ClubRedSocial & { red: IdRedSocial } =>
        esIdRedSocial(fila.red),
      )
      .map((fila) => ({
        id: fila.id,
        red: fila.red,
        etiqueta: fila.etiqueta,
        valor: fila.valor,
        orden: fila.orden,
      })),
  };
}

export async function listarSedes(clubId: string): Promise<SedeLista[]> {
  const supabase = await supabaseServidor();
  const { data: sedes, error } = await supabase
    .from("sede")
    .select("id, club_id, nombre, direccion, maps_url, creado_en")
    .eq("club_id", clubId)
    .order("nombre", { ascending: true });
  if (error) throw error;
  const lista = sedes ?? [];
  if (lista.length === 0) return [];

  const { data: instalaciones, error: errorInst } = await supabase
    .from("instalacion")
    .select("sede_id")
    .in(
      "sede_id",
      lista.map((sede) => sede.id),
    );
  if (errorInst) throw errorInst;

  const conteo: Record<string, number> = {};
  for (const sede of lista) conteo[sede.id] = 0;
  for (const fila of instalaciones ?? []) {
    conteo[fila.sede_id] = (conteo[fila.sede_id] ?? 0) + 1;
  }

  return lista.map((sede) => ({
    ...sede,
    cantidadInstalaciones: conteo[sede.id] ?? 0,
  }));
}

export async function sedePorId(
  clubId: string,
  sedeId: string,
): Promise<SedeDetalle | null> {
  const supabase = await supabaseServidor();
  const { data: sede, error } = await supabase
    .from("sede")
    .select("id, club_id, nombre, direccion, maps_url, creado_en")
    .eq("id", sedeId)
    .eq("club_id", clubId)
    .maybeSingle();
  if (error) throw error;
  if (!sede) return null;

  const { data: instalaciones, error: errorInst } = await supabase
    .from("instalacion")
    .select("id, sede_id, tipo, nombre, notas, creado_en")
    .eq("sede_id", sedeId)
    .order("creado_en", { ascending: true });
  if (errorInst) throw errorInst;

  return {
    ...sede,
    instalaciones: (instalaciones ?? []).map((item: Instalacion) => {
      // La base solo acepta claves en código; «Otra» por si quedan desfasadas.
      const tipo = esClaveTipoInstalacion(item.tipo) ? item.tipo : CLAVE_TIPO_OTRA;
      return {
        id: item.id,
        tipo,
        tipoNombre: tipoInstalacion(tipo).nombre,
        nombre: item.nombre,
        notas: item.notas ?? "",
      };
    }),
  };
}

export async function instalacionPorId(
  clubId: string,
  sedeId: string,
  instalacionId: string,
): Promise<InstalacionVista | null> {
  const sede = await sedePorId(clubId, sedeId);
  if (!sede) return null;
  return sede.instalaciones.find((item) => item.id === instalacionId) ?? null;
}
