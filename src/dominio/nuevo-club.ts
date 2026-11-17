import { validarDominioBase } from "./host";
import { esHexValido, normalizarHex, COLOR_CLARO_DEFAULT } from "./paleta";
import { slugDesdeNombre } from "./slug";

export const SLUG_FORMATO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BUCKET_ESCUDOS = "escudos";

export const ESCUDO_TIPOS_ACEPTADOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const ESCUDO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export const ESCUDO_TAMANIO_MAX = 2 * 1024 * 1024;

const ESCUDO_EXTENSIONES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type ErroresNuevoClub = {
  nombre?: string;
  slug?: string;
  marca?: string;
  claro?: string;
  extras?: string;
  dominioBase?: string;
  escudo?: string;
};

export type DatosNuevoClub = {
  nombre: string;
  slug: string;
  slugManual?: boolean;
  marca: string;
  claro: string;
  extras: string[];
  dominioBase: string;
};

export type ColoresClub = {
  colorPrincipal: string;
  colorClaro: string;
  color2: string | null;
  color3: string | null;
};

/** Devuelve el mensaje de error, o null si el identificador está bien. */
export function validarSlug(valor: string): string | null {
  const slug = valor.trim();
  if (!slug) {
    return "El identificador se arma con el nombre, o lo podés escribir vos.";
  }
  if (!SLUG_FORMATO.test(slug)) {
    return "Usá solo letras minúsculas, números y guiones, sin guión al inicio o al final.";
  }
  return null;
}

export function validarDatosNuevoClub(valores: DatosNuevoClub): ErroresNuevoClub {
  const errores: ErroresNuevoClub = {};
  if (!valores.nombre.trim()) {
    errores.nombre = "Escribí el nombre del club.";
  }
  const slug = valores.slugManual
    ? valores.slug.trim()
    : slugDesdeNombre(valores.nombre);
  const errorSlug = validarSlug(slug);
  if (errorSlug) errores.slug = errorSlug;
  if (!esHexValido(valores.marca)) {
    errores.marca = "Usá un color hexadecimal, por ejemplo #1f4b3a.";
  }
  if (!esHexValido(valores.claro)) {
    errores.claro = "Usá un color hexadecimal, por ejemplo #ffffff.";
  }
  const extraInvalido = valores.extras.some(
    (extra) => extra.trim() !== "" && !esHexValido(extra),
  );
  if (extraInvalido) {
    errores.extras =
      "Los colores opcionales van en hexadecimal, por ejemplo #c47a2c. Si los dejás vacíos, se derivan del principal.";
  }
  const errorDominio = validarDominioBase(valores.dominioBase);
  if (errorDominio) errores.dominioBase = errorDominio;
  return errores;
}

export function primerError(errores: ErroresNuevoClub): string | undefined {
  return (
    errores.nombre ??
    errores.slug ??
    errores.marca ??
    errores.claro ??
    errores.extras ??
    errores.dominioBase ??
    errores.escudo
  );
}

export function coloresParaGuardar(
  marca: string,
  claro: string,
  extras: string[],
): ColoresClub {
  return {
    colorPrincipal: normalizarHex(marca) ?? "",
    colorClaro: normalizarHex(claro) ?? COLOR_CLARO_DEFAULT,
    color2: normalizarHex(extras[0] ?? ""),
    color3: normalizarHex(extras[1] ?? ""),
  };
}

export function validarArchivoEscudo(
  tipo: string,
  tamanio: number,
): string | null {
  if (!ESCUDO_TIPOS_ACEPTADOS.includes(tipo as (typeof ESCUDO_TIPOS_ACEPTADOS)[number])) {
    return "El escudo tiene que ser PNG, JPG, WebP o GIF.";
  }
  if (tamanio > ESCUDO_TAMANIO_MAX) {
    return "El escudo no puede pesar más de 2 MB.";
  }
  return null;
}

export function rutaEscudo(clubId: string, tipo: string): string {
  const ext = ESCUDO_EXTENSIONES[tipo] ?? "png";
  return `${clubId}/escudo.${ext}`;
}

export function urlEscudoPublico(
  supabaseUrl: string,
  ruta: string | null | undefined,
): string | null {
  if (!ruta) return null;
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET_ESCUDOS}/${ruta}`;
}
