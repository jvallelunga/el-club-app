/**
 * Imágenes satelitales del editor de predio.
 *
 * Google Map Tiles API (2D, satelital) con la clave pública
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Si no hay clave o Google falla, se usan las
 * imágenes de Esri World Imagery y el editor lo avisa.
 *
 * Términos de Google para visores que no son de Google (#26, 18/11/2026):
 * mostrar el logo de Google y el copyright del viewport, que cambia con la
 * zona que se ve, sin que nada los tape.
 */

import type { RasterSourceSpecification } from "maplibre-gl";

/** Zoom máximo del editor (decisión de #26). */
export const ZOOM_MAXIMO = 19;

const CLAVE_GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const TILES_GOOGLE = "https://tile.googleapis.com";

export type Limites = { norte: number; sur: number; este: number; oeste: number };

export type FuenteSatelital =
  | {
      proveedor: "google";
      raster: RasterSourceSpecification;
      /** Copyright de Google para la zona visible; vacío si no se pudo leer. */
      copyright: (zoom: number, limites: Limites) => Promise<string>;
    }
  | {
      proveedor: "esri";
      raster: RasterSourceSpecification;
      /** Por qué no se usa Google, para avisarlo en pantalla. */
      aviso: string;
    };

export const ATRIBUCION_ESRI = "Esri, Maxar, Earthstar Geographics";

const RASTER_ESRI: RasterSourceSpecification = {
  type: "raster",
  tiles: [
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  ],
  tileSize: 256,
  maxzoom: ZOOM_MAXIMO,
};

async function sesionGoogle(clave: string): Promise<string> {
  const respuesta = await fetch(`${TILES_GOOGLE}/v1/createSession?key=${clave}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mapType: "satellite", language: "es-AR", region: "AR" }),
  });
  if (!respuesta.ok) throw new Error(`createSession respondió ${respuesta.status}`);
  const { session } = (await respuesta.json()) as { session?: string };
  if (!session) throw new Error("createSession no devolvió una sesión");
  return session;
}

/** Abre una sesión de Google; si no se puede, devuelve Esri con el motivo. */
export async function fuenteSatelital(): Promise<FuenteSatelital> {
  if (!CLAVE_GOOGLE) {
    return {
      proveedor: "esri",
      raster: RASTER_ESRI,
      aviso: "Falta la clave de Google: se muestran imágenes de Esri.",
    };
  }
  const clave = CLAVE_GOOGLE;
  try {
    const sesion = await sesionGoogle(clave);
    return {
      proveedor: "google",
      raster: {
        type: "raster",
        tiles: [`${TILES_GOOGLE}/v1/2dtiles/{z}/{x}/{y}?session=${sesion}&key=${clave}`],
        tileSize: 256,
        maxzoom: ZOOM_MAXIMO,
      },
      copyright: async (zoom, limites) => {
        const url = new URL(`${TILES_GOOGLE}/tile/v1/viewport`);
        url.searchParams.set("session", sesion);
        url.searchParams.set("key", clave);
        url.searchParams.set("zoom", String(Math.round(zoom)));
        url.searchParams.set("north", String(limites.norte));
        url.searchParams.set("south", String(limites.sur));
        url.searchParams.set("east", String(limites.este));
        url.searchParams.set("west", String(limites.oeste));
        const respuesta = await fetch(url);
        if (!respuesta.ok) return "";
        const { copyright } = (await respuesta.json()) as { copyright?: string };
        return copyright ?? "";
      },
    };
  } catch (error) {
    console.warn("Map Tiles API de Google no disponible:", error);
    return {
      proveedor: "esri",
      raster: RASTER_ESRI,
      aviso: "No se pudo usar Google: se muestran imágenes de Esri.",
    };
  }
}
