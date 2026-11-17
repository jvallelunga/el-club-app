/**
 * Resolución de hosts de la app.
 *
 * El dominio raíz del club (ej. clubejemplo.com.ar) es el SITIO WEB del club,
 * no la app. La app vive en subdominios por superficie:
 *   admin.clubejemplo.com.ar → administrador
 *   vivo.clubejemplo.com.ar  → partidos en vivo / tablero
 *
 * En la base se guarda solo el dominio base (`club.dominio_base`). Las
 * superficies conocidas viven acá, en código, y se pueden sumar después.
 * Sin dominio propio, el fallback es `/c/<slug>/<superficie>`.
 */

export const SUPERFICIES_APP = ["admin", "vivo"] as const;

export type SuperficieApp = (typeof SUPERFICIES_APP)[number];

export type ResolucionHost =
  | { tipo: "producto" }
  | { tipo: "superficie"; superficie: SuperficieApp; dominioBase: string }
  | { tipo: "sitio_o_desconocido" };

export function normalizarHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "").split(":")[0] ?? "";
}

export function esSuperficieApp(valor: string): valor is SuperficieApp {
  return (SUPERFICIES_APP as readonly string[]).includes(valor);
}

/**
 * Interpreta un host.
 * `dominiosProducto` son los hosts de la app en sí (Vercel, localhost),
 * que no se deben tomar como dominio de un club.
 */
export function resolverHost(
  hostCrudo: string,
  dominiosProducto: readonly string[] = [],
): ResolucionHost {
  const host = normalizarHost(hostCrudo);
  if (!host) return { tipo: "sitio_o_desconocido" };

  const producto = new Set(
    dominiosProducto.map(normalizarHost).filter(Boolean),
  );
  if (producto.has(host)) return { tipo: "producto" };

  const partes = host.split(".").filter(Boolean);
  if (partes.length < 3) {
    return { tipo: "sitio_o_desconocido" };
  }

  const [primera, ...resto] = partes;
  const dominioBase = resto.join(".");

  if (producto.has(dominioBase)) {
    return { tipo: "producto" };
  }

  if (primera && esSuperficieApp(primera)) {
    return { tipo: "superficie", superficie: primera, dominioBase };
  }

  return { tipo: "sitio_o_desconocido" };
}

export function rutaFallbackClub(
  slug: string,
  superficie: SuperficieApp,
): string {
  return `/c/${slug}/${superficie}`;
}

export function hostSuperficie(
  dominioBase: string,
  superficie: SuperficieApp,
): string {
  return `${superficie}.${normalizarHost(dominioBase)}`;
}

const FORMATO_DOMINIO_BASE =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/**
 * Valida un dominio base de club (sin esquema ni www). Vacío es válido
 * porque el campo es opcional: sin dominio, se usa /c/<slug>.
 * Devuelve el mensaje de error, o null si está bien.
 */
export function validarDominioBase(valor: string): string | null {
  const recortado = valor.trim();
  if (!recortado) return null;
  const normalizado = recortado.toLowerCase();
  if (normalizado.startsWith("www.")) {
    return "El dominio base va sin www. El sitio web puede usar www; en la app se guarda el dominio raíz.";
  }
  if (normalizado !== recortado) {
    return "Escribí el dominio en minúsculas, sin esquema (sin https://).";
  }
  if (!FORMATO_DOMINIO_BASE.test(normalizado)) {
    return "Ese dominio no se ve válido. Ej.: clubejemplo.com.ar";
  }
  return null;
}

/**
 * Extrae el slug de una ruta o destino `/c/<slug>/...`.
 * Sirve para el ingreso con `?siguiente=` o para una URL del club.
 */
export function slugClubEnRuta(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  const path = ruta.trim().split("?")[0] ?? "";
  const match = /^\/c\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|$)/.exec(path);
  return match?.[1] ?? null;
}
