/** Validación de sedes, instalaciones y tipos. */

import { textoOpcional } from "./contacto";

export const NOMBRES_TIPOS_INSTALACION_BASE = [
  "Cancha de rugby",
  "Cancha de hockey",
  "Cancha de tenis",
  "Cancha de fútbol",
  "House",
  "Pileta",
  "Gym",
  "Vestuario",
  "Quincho",
  "Salón",
  "Otra",
] as const;

export const NOMBRE_TIPO_OTRA = "Otra";

export type SedeInput = {
  nombre: string;
  direccion: string;
  mapsUrl: string;
};

export type ErroresSede = {
  nombre?: string;
  direccion?: string;
  mapsUrl?: string;
};

export type InstalacionInput = {
  tipoId: string;
  tipoPropio: string;
  nombre: string;
  notas: string;
  /** Id del tipo de base «Otra», si se conoce. */
  tipoOtraId?: string | null;
};

export type ErroresInstalacion = {
  tipo?: string;
  nombre?: string;
  notas?: string;
};

export function validarSede(input: SedeInput): ErroresSede {
  const errores: ErroresSede = {};
  if (!input.nombre.trim()) {
    errores.nombre = "Poné un nombre para la sede.";
  }
  return errores;
}

export function sedeParaGuardar(input: SedeInput): {
  nombre: string;
  direccion: string | null;
  maps_url: string | null;
} {
  return {
    nombre: input.nombre.trim(),
    direccion: textoOpcional(input.direccion),
    maps_url: textoOpcional(input.mapsUrl),
  };
}

export function eligeTipoPropio(
  tipoId: string,
  tipoOtraId?: string | null,
): boolean {
  return tipoId === "otra" || (Boolean(tipoOtraId) && tipoId === tipoOtraId);
}

export function validarInstalacion(input: InstalacionInput): ErroresInstalacion {
  const errores: ErroresInstalacion = {};
  if (!input.nombre.trim()) {
    errores.nombre = "Poné un nombre, por ejemplo «Cancha 1».";
  }
  if (eligeTipoPropio(input.tipoId, input.tipoOtraId) && !input.tipoPropio.trim()) {
    errores.tipo = "Poné el nombre del tipo de instalación.";
  } else if (!input.tipoId && !input.tipoPropio.trim()) {
    errores.tipo = "Elegí un tipo de instalación.";
  }
  return errores;
}

export function instalacionParaGuardar(input: InstalacionInput): {
  nombre: string;
  notas: string | null;
  tipoPropio: string | null;
  creaTipoPropio: boolean;
} {
  const creaTipoPropio = eligeTipoPropio(input.tipoId, input.tipoOtraId);
  return {
    nombre: input.nombre.trim(),
    notas: textoOpcional(input.notas),
    tipoPropio: creaTipoPropio ? input.tipoPropio.trim() : null,
    creaTipoPropio,
  };
}

export function ordenTiposBase(nombre: string): number {
  const i = NOMBRES_TIPOS_INSTALACION_BASE.findIndex(
    (item) => item.toLowerCase() === nombre.toLowerCase(),
  );
  return i === -1 ? NOMBRES_TIPOS_INSTALACION_BASE.length : i;
}
