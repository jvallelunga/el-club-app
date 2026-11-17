import "server-only";

import { headers } from "next/headers";
import { dominiosProducto, hayConfiguracionSupabase } from "@/datos/env-supabase";
import { supabaseServidor } from "@/datos/supabase-servidor";
import { resolverHost, slugClubEnRuta } from "@/dominio/host";

export type MarcaPublicaClub = {
  slug: string;
  nombre: string;
  escudo_ruta: string | null;
  color_principal: string;
  color_claro: string;
  color_2: string | null;
  color_3: string | null;
};

function filaAMarca(fila: unknown): MarcaPublicaClub | null {
  if (!fila || typeof fila !== "object") return null;
  const r = fila as Record<string, unknown>;
  if (typeof r.slug !== "string" || typeof r.nombre !== "string") return null;
  if (typeof r.color_principal !== "string" || typeof r.color_claro !== "string") {
    return null;
  }
  return {
    slug: r.slug,
    nombre: r.nombre,
    escudo_ruta: typeof r.escudo_ruta === "string" ? r.escudo_ruta : null,
    color_principal: r.color_principal,
    color_claro: r.color_claro,
    color_2: typeof r.color_2 === "string" ? r.color_2 : null,
    color_3: typeof r.color_3 === "string" ? r.color_3 : null,
  };
}

/** Marca pública de un club (nombre, escudo, paleta) por slug o dominio base. */
export async function marcaPublicaDelClub(filtro: {
  slug?: string | null;
  dominioBase?: string | null;
}): Promise<MarcaPublicaClub | null> {
  const slug = filtro.slug?.trim() || null;
  const dominioBase = filtro.dominioBase?.trim().toLowerCase() || null;
  if (!slug && !dominioBase) return null;
  if (!hayConfiguracionSupabase()) return null;

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("marca_publica_del_club", {
    p_slug: slug,
    p_dominio_base: dominioBase,
  });
  if (error) return null;
  if (Array.isArray(data)) return filaAMarca(data[0]);
  return filaAMarca(data);
}

/**
 * Resuelve el club de la petición: slug de la ruta o de `siguiente`,
 * o el host de una superficie del club (admin./vivo.<dominio_base>).
 */
export async function marcaClubDePeticion(opts?: {
  slug?: string | null;
  siguiente?: string | null;
}): Promise<MarcaPublicaClub | null> {
  if (!hayConfiguracionSupabase()) return null;

  const slug = opts?.slug ?? slugClubEnRuta(opts?.siguiente ?? null);
  const cabeceras = await headers();
  const host =
    cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "";
  const resolucion = resolverHost(host, dominiosProducto());
  const dominioBase =
    resolucion.tipo === "superficie" ? resolucion.dominioBase : null;

  return marcaPublicaDelClub({ slug, dominioBase });
}
