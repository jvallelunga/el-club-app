/**
 * Resolución de hosts de la app.
 *
 * El dominio raíz del club (ej. loscardosrc.com.ar) es el SITIO WEB del club,
 * no la app. La app vive en subdominios por superficie:
 *   admin.loscardosrc.com.ar → administrador
 *   vivo.loscardosrc.com.ar  → partidos en vivo / tablero
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
