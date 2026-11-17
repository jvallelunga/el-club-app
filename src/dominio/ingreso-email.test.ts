import { describe, expect, it } from "vitest";
import { parametrosCallbackAuth, tipoOtpEmail } from "./ingreso-email";

describe("tipoOtpEmail", () => {
  it("acepta los tipos de email de Auth y asume magiclink si falta o no es válido", () => {
    expect(tipoOtpEmail("email")).toBe("email");
    expect(tipoOtpEmail("MAGICLINK")).toBe("magiclink");
    expect(tipoOtpEmail(null)).toBe("magiclink");
    expect(tipoOtpEmail("otro")).toBe("magiclink");
  });
});

describe("parametrosCallbackAuth", () => {
  it("prioriza un error de OAuth", () => {
    const params = new URLSearchParams("error=access_denied&code=abc");
    expect(parametrosCallbackAuth(params)).toEqual({
      clase: "error",
      codigo: "access_denied",
    });
  });

  it("lee el code de PKCE", () => {
    const params = new URLSearchParams("code=pkce-code");
    expect(parametrosCallbackAuth(params)).toEqual({
      clase: "codigo",
      code: "pkce-code",
    });
  });

  it("lee token_hash y el type para verifyOtp", () => {
    const params = new URLSearchParams("token_hash=abc123&type=email");
    expect(parametrosCallbackAuth(params)).toEqual({
      clase: "otp",
      tokenHash: "abc123",
      tipo: "email",
    });
  });

  it("queda vacío si no hay code ni token", () => {
    expect(parametrosCallbackAuth(new URLSearchParams())).toEqual({
      clase: "vacio",
    });
  });
});
