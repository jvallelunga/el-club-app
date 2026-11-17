import "server-only";

import { esIdRedSocial, type IdRedSocial } from "@/dominio/contacto";
import { ordenTiposBase } from "@/dominio/sedes";
import type { ClubRedSocial, Instalacion, Sede, TipoInstalacion } from "../tipos";
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

export type TipoInstalacionVista = {
  id: string;
  nombre: string;
  base: boolean;
};

export type InstalacionVista = {
  id: string;
  tipoId: string;
  tipoNombre: string;
  tipoBase: boolean;
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
    .select("id, sede_id, tipo_instalacion_id, nombre, notas, creado_en")
    .eq("sede_id", sedeId)
    .order("creado_en", { ascending: true });
  if (errorInst) throw errorInst;

  const tipos = await tiposDeInstalacion(clubId);
  const tipoPorId = new Map(tipos.map((tipo) => [tipo.id, tipo]));

  return {
    ...sede,
    instalaciones: (instalaciones ?? []).map((item: Instalacion) => {
      const tipo = tipoPorId.get(item.tipo_instalacion_id);
      return {
        id: item.id,
        tipoId: item.tipo_instalacion_id,
        tipoNombre: tipo?.nombre ?? "Tipo",
        tipoBase: tipo?.base ?? true,
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

export async function tiposDeInstalacion(
  clubId: string,
): Promise<TipoInstalacionVista[]> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("tipo_instalacion")
    .select("id, club_id, nombre, creado_en");
  if (error) throw error;

  const tipos: TipoInstalacionVista[] = (data ?? [])
    .filter((fila: TipoInstalacion) => fila.club_id === null || fila.club_id === clubId)
    .map((fila: TipoInstalacion) => ({
      id: fila.id,
      nombre: fila.nombre,
      base: fila.club_id === null,
    }));

  tipos.sort((a, b) => {
    if (a.base !== b.base) return a.base ? -1 : 1;
    if (a.base) return ordenTiposBase(a.nombre) - ordenTiposBase(b.nombre);
    return a.nombre.localeCompare(b.nombre, "es");
  });
  return tipos;
}
