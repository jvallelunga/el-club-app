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
