import "server-only";

import type { Coordenadas } from "@/dominio/maps";
import { coordenadasDesdeNominatim } from "@/dominio/predio";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/**
 * Busca una dirección en Nominatim (OpenStreetMap). Se usa poco: solo cuando
 * se abre el editor de un predio sin origen y la sede no tiene coordenadas.
 * La respuesta se guarda un mes en la caché de Next. Si falla, devuelve null.
 */
export async function coordenadasDeDireccion(
  direccion: string | null,
): Promise<Coordenadas | null> {
  const texto = direccion?.trim();
  if (!texto) return null;
  const url = new URL(NOMINATIM);
  url.searchParams.set("q", texto);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "es");
  try {
    const respuesta = await fetch(url, {
      // La política de uso de Nominatim pide identificar la aplicación.
      headers: { "User-Agent": "el-club-app (editor de predios)" },
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (!respuesta.ok) return null;
    return coordenadasDesdeNominatim(await respuesta.json());
  } catch {
    return null;
  }
}
