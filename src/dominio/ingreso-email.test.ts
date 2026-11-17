import { describe, expect, it } from "vitest";
import {
  avisoTrasInvitar,
  mensajeErrorEnvioLink,
  parametrosCallbackAuth,
  tipoOtpEmail,
  urlCallbackIngreso,
} from "./ingreso-email";

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

describe("urlCallbackIngreso", () => {
  it("arma el callback del origen y agrega un destino seguro", () => {
    expect(urlCallbackIngreso("https://preview.example/admin")).toBe(
      "https://preview.example/auth/callback",
    );
    expect(
      urlCallbackIngreso("https://preview.example", "/c/club-norte/admin"),
    ).toBe(
      "https://preview.example/auth/callback?siguiente=%2Fc%2Fclub-norte%2Fadmin",
    );
  });

  it("ignora un destino inseguro y rechaza un origen inválido", () => {
    expect(
      urlCallbackIngreso("https://preview.example", "https://evil.example"),
    ).toBe("https://preview.example/auth/callback");
    expect(urlCallbackIngreso("no-es-una-url")).toBeNull();
    expect(urlCallbackIngreso("ftp://preview.example")).toBeNull();
  });
});

describe("mensajeErrorEnvioLink", () => {
  it("explica el cupo horario cuando el error es de rate limit", () => {
    expect(mensajeErrorEnvioLink("email rate limit exceeded")).toMatch(/cupo/);
    expect(mensajeErrorEnvioLink("Error 429")).toMatch(/Reenviar link/);
  });

  it("devuelve un mensaje genérico si no se reconoce el error", () => {
    expect(mensajeErrorEnvioLink("network")).toMatch(/Probá de nuevo/);
    expect(mensajeErrorEnvioLink(null)).toMatch(/Reenviar link/);
  });
});

describe("avisoTrasInvitar", () => {
  it("confirma el envío del link, también si ya era Admin", () => {
    expect(
      avisoTrasInvitar({
        email: "lucia.fernandez+admin@ejemplo.com",
        aceptadaDeInmediato: false,
        linkEnviado: true,
      }),
    ).toBe("Le mandamos el link a lucia.fernandez+admin@ejemplo.com.");
    expect(
      avisoTrasInvitar({
        email: "lucia@ejemplo.com",
        aceptadaDeInmediato: true,
        linkEnviado: true,
      }),
    ).toMatch(/ya es Admin.*Le mandamos el link/);
  });

  it("mantiene la invitación visible en el aviso si el envío falla", () => {
    const aviso = avisoTrasInvitar({
      email: "lucia@ejemplo.com",
      aceptadaDeInmediato: false,
      linkEnviado: false,
      errorLink: "No se pudo enviar el link. Hay un cupo bajo de correos por hora. Esperá un rato y usá «Reenviar link».",
    });
    expect(aviso).toMatch(/Agregamos a lucia@ejemplo.com/);
    expect(aviso).toMatch(/cupo/);
  });
});
