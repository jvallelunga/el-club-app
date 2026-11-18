/** Validación de sedes e instalaciones. */

import { textoOpcional } from "./contacto";
import {
  esClaveTipoInstalacion,
  type ClaveTipoInstalacion,
} from "./tipos-instalacion";

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
  /** Clave del tipo de instalación en código. */
  tipo: string;
  nombre: string;
  notas: string;
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

export function validarInstalacion(input: InstalacionInput): ErroresInstalacion {
  const errores: ErroresInstalacion = {};
  if (!input.nombre.trim()) {
    errores.nombre = "Poné un nombre, por ejemplo «Cancha 1».";
  }
  if (!esClaveTipoInstalacion(input.tipo)) {
    errores.tipo = "Elegí un tipo de instalación.";
  }
  return errores;
}

/** Solo para un input que pasó `validarInstalacion`. */
export function instalacionParaGuardar(input: InstalacionInput): {
  tipo: ClaveTipoInstalacion;
  nombre: string;
  notas: string | null;
} {
  if (!esClaveTipoInstalacion(input.tipo)) {
    throw new Error(`Tipo de instalación desconocido: ${input.tipo}`);
  }
  return {
    tipo: input.tipo,
    nombre: input.nombre.trim(),
    notas: textoOpcional(input.notas),
  };
}
