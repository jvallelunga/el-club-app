import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();
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
      supabase: { auth: { signInWithOAuth } },
      aplicarCookies,
    }),
  };
});

import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { GET, POST } from "./route";

const AUTHORIZE =
  "https://paacpcdurdcmbamdhcmt.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fpreview.example%2Fauth%2Fcallback";

function pedido(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(new URL(url), init);
}

describe("POST /auth/google", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    aplicarCookies.mockClear();
    vi.mocked(hayConfiguracionSupabase).mockReturnValue(true);
  });

  it("redirige con 303 a /authorize y conserva las cookies de PKCE", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: AUTHORIZE, provider: "google" },
      error: null,
    });

    const respuesta = await POST(
      pedido("https://preview.example/auth/google", { method: "POST" }),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(AUTHORIZE);
    expect(aplicarCookies).toHaveBeenCalledTimes(1);
    expect(respuesta.cookies.get("sb-test-auth-code-verifier")?.value).toBe(
      "pkce-de-prueba",
    );
  });

  it("también usa 303 si falla el inicio de OAuth", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: null, provider: "google" },
      error: { message: "falló" },
    });

    const respuesta = await POST(
      pedido("https://preview.example/auth/google", { method: "POST" }),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=google",
    );
  });

  it("redirige con 303 a ingreso si falta la configuración", async () => {
    vi.mocked(hayConfiguracionSupabase).mockReturnValue(false);

    const respuesta = await POST(
      pedido("https://preview.example/auth/google", { method: "POST" }),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=config",
    );
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });
});

describe("GET /auth/google", () => {
  it("no arranca OAuth: redirige con 303 al ingreso", async () => {
    const respuesta = await GET(
      pedido("https://preview.example/auth/google?siguiente=/super-admin"),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?siguiente=%2Fsuper-admin",
    );
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });
});
