import "server-only";

import { headers } from "next/headers";

/** Origen de la petición actual (preview, localhost o el host de la app). */
export async function origenDePeticion(): Promise<string | null> {
  const cabeceras = await headers();
  const host = (cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) return null;
  const protoReenviado = (cabeceras.get("x-forwarded-proto") ?? "")
    .split(",")[0]
    ?.trim();
  const proto =
    protoReenviado === "http" || protoReenviado === "https"
      ? protoReenviado
      : host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https";
  return `${proto}://${host}`;
}
