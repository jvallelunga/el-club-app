import { siguienteSeguro } from "./permisos";

export const TIPOS_OTP_EMAIL = [
  "magiclink",
  "email",
  "signup",
  "invite",
  "recovery",
  "email_change",
] as const;

export type TipoOtpEmail = (typeof TIPOS_OTP_EMAIL)[number];

/** Tipo de OTP que viene en el callback del magic link. Si no es uno conocido, se asume magiclink. */
export function tipoOtpEmail(valor: string | null | undefined): TipoOtpEmail {
  const tipo = (valor ?? "").trim().toLowerCase();
  return (TIPOS_OTP_EMAIL as readonly string[]).includes(tipo)
    ? (tipo as TipoOtpEmail)
    : "magiclink";
}

export type ParametrosCallbackAuth =
  | { clase: "error"; codigo: string }
  | { clase: "codigo"; code: string }
  | { clase: "otp"; tokenHash: string; tipo: TipoOtpEmail }
  | { clase: "vacio" };

export function parametrosCallbackAuth(
  params: URLSearchParams,
): ParametrosCallbackAuth {
  const error =
    params.get("error") ?? params.get("error_code") ?? params.get("error_description");
  if (error) {
    return { clase: "error", codigo: error };
  }
  const code = params.get("code");
  if (code) {
    return { clase: "codigo", code };
  }
  const tokenHash = params.get("token_hash") ?? params.get("tokenhash");
  if (tokenHash) {
    return {
      clase: "otp",
      tokenHash,
      tipo: tipoOtpEmail(params.get("type")),
    };
  }
  return { clase: "vacio" };
}

/** URL limpia de /auth/callback, con el destino interno en `siguiente` si es seguro. */
export function urlCallbackIngreso(
  origen: string,
  siguiente?: string | null,
): string | null {
  try {
    const base = new URL(origen);
    if (base.protocol !== "http:" && base.protocol !== "https:") return null;
    const url = new URL("/auth/callback", base.origin);
    const destino = siguienteSeguro(siguiente);
    if (destino) url.searchParams.set("siguiente", destino);
    return url.toString();
  } catch {
    return null;
  }
}

export function mensajeErrorEnvioLink(detalle?: string | null): string {
  const texto = (detalle ?? "").toLowerCase();
  if (
    texto.includes("rate") ||
    texto.includes("429") ||
    texto.includes("after") ||
    texto.includes("too many")
  ) {
    return "No se pudo enviar el link. Hay un cupo bajo de correos por hora. Esperá un rato y usá «Reenviar link».";
  }
  return "No se pudo enviar el link. Probá de nuevo con «Reenviar link».";
}

export function avisoTrasInvitar(params: {
  email: string;
  aceptadaDeInmediato: boolean;
  linkEnviado: boolean;
  errorLink?: string;
}): string {
  if (params.linkEnviado && params.aceptadaDeInmediato) {
    return `Listo, ${params.email} ya es Admin de este club. Le mandamos el link a ${params.email}.`;
  }
  if (params.linkEnviado) {
    return `Le mandamos el link a ${params.email}.`;
  }
  const detalle = params.errorLink ?? mensajeErrorEnvioLink();
  if (params.aceptadaDeInmediato) {
    return `Listo, ${params.email} ya es Admin de este club, pero no se pudo enviar el link. ${detalle}`;
  }
  return `Agregamos a ${params.email}, pero no se pudo enviar el link. ${detalle}`;
}
