import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOtp = vi.fn();
const rpc = vi.fn();
const aplicarCookies = vi.fn((respuesta: NextResponse) => {
  respuesta.cookies.set("sb-test-auth-code-verifier", "pkce-de-prueba", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  return respuesta;
});

vi.mock("@/datos/env-supabase", () => ({
  hayConfiguracionSupabase: vi.fn(() => true),
}));

vi.mock("@/datos/supabase-auth-http", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/datos/supabase-auth-http")>();
  return {
    ...real,
    clienteAuthConCookies: () => ({
      supabase: { auth: { signInWithOtp }, rpc },
      aplicarCookies,
    }),
  };
});

import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { GET, POST } from "./route";

function pedido(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url), init);
}

function formPost(url: string, fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return pedido(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
}

describe("POST /auth/email", () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    rpc.mockReset();
    aplicarCookies.mockClear();
    vi.mocked(hayConfiguracionSupabase).mockReturnValue(true);
  });

  it("envía el magic link si el email está invitado y redirige con 303, conservando PKCE", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const respuesta = await POST(
      formPost("https://preview.example/auth/email", {
        email: "  Lucia.Fernandez+Admin@Ejemplo.com  ",
        siguiente: "/c/club-norte/admin",
      }),
    );

    expect(rpc).toHaveBeenCalledWith("puede_solicitar_ingreso_email", {
      p_email: "lucia.fernandez+admin@ejemplo.com",
    });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "lucia.fernandez+admin@ejemplo.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://preview.example/auth/callback",
      },
    });
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?enviado=1&email=lucia.fernandez%2Badmin%40ejemplo.com&siguiente=%2Fc%2Fclub-norte%2Fadmin",
    );
    expect(aplicarCookies).toHaveBeenCalledTimes(1);
    expect(respuesta.cookies.get("sb-test-auth-code-verifier")?.value).toBe(
      "pkce-de-prueba",
    );
    expect(respuesta.cookies.get("el_club_siguiente")?.value).toBe(
      "/c/club-norte/admin",
    );
  });

  it("no envía el link si el email no está invitado, pero muestra el mismo mensaje", async () => {
    rpc.mockResolvedValue({ data: false, error: null });

    const respuesta = await POST(
      formPost("https://preview.example/auth/email", {
        email: "nadie@ejemplo.com",
      }),
    );

    expect(signInWithOtp).not.toHaveBeenCalled();
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?enviado=1&email=nadie%40ejemplo.com",
    );
  });

  it("redirige con error=link si falla el envío, sin revelar el motivo", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    signInWithOtp.mockResolvedValue({ data: {}, error: { message: "rate" } });

    const respuesta = await POST(
      formPost("https://preview.example/auth/email", {
        email: "lucia.fernandez+admin@ejemplo.com",
      }),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=link",
    );
  });

  it("redirige con error=email si el formato no es válido, sin llamar a Auth", async () => {
    const respuesta = await POST(
      formPost("https://preview.example/auth/email", { email: "hola" }),
    );

    expect(rpc).not.toHaveBeenCalled();
    expect(signInWithOtp).not.toHaveBeenCalled();
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=email",
    );
  });

  it("redirige con 303 a ingreso si falta la configuración", async () => {
    vi.mocked(hayConfiguracionSupabase).mockReturnValue(false);

    const respuesta = await POST(
      formPost("https://preview.example/auth/email", {
        email: "lucia@ejemplo.com",
      }),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=config",
    );
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
});

describe("GET /auth/email", () => {
  it("no envía correo: redirige con 303 al ingreso", async () => {
    const respuesta = await GET(
      pedido("https://preview.example/auth/email?siguiente=/super-admin"),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?siguiente=%2Fsuper-admin",
    );
  });
});
