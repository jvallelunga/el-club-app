import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const aplicarCookies = vi.fn((respuesta: NextResponse) => respuesta);
const cargarSesion = vi.fn();

vi.mock("@/datos/env-supabase", () => ({
  hayConfiguracionSupabase: vi.fn(() => true),
}));

vi.mock("@/datos/consultas/sesion", () => ({
  cargarSesion: (...args: unknown[]) => cargarSesion(...args),
}));

vi.mock("@/datos/supabase-auth-http", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/datos/supabase-auth-http")>();
  return {
    ...real,
    clienteAuthConCookies: () => ({
      supabase: { auth: { exchangeCodeForSession, verifyOtp } },
      aplicarCookies,
    }),
  };
});

import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { GET } from "./route";

function pedido(url: string) {
  return new NextRequest(new URL(url));
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    verifyOtp.mockReset();
    aplicarCookies.mockClear();
    cargarSesion.mockReset();
    vi.mocked(hayConfiguracionSupabase).mockReturnValue(true);
    cargarSesion.mockResolvedValue({
      esSuperAdmin: false,
      membresias: [{ slug: "club-norte", clubId: "1", nombre: "Norte", rol: "admin" }],
    });
  });

  it("intercambia el code de PKCE y redirige con 303 al destino", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const respuesta = await GET(
      pedido("https://preview.example/auth/callback?code=abc"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/c/club-norte/admin",
    );
  });

  it("verifica token_hash con verifyOtp cuando no hay code", async () => {
    verifyOtp.mockResolvedValue({ error: null });

    const respuesta = await GET(
      pedido(
        "https://preview.example/auth/callback?token_hash=otp-hash&type=email",
      ),
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "otp-hash",
      type: "email",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/c/club-norte/admin",
    );
  });

  it("sin sesión de app (sin invitación) va a /sin-acceso", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    cargarSesion.mockResolvedValue({ esSuperAdmin: false, membresias: [] });

    const respuesta = await GET(
      pedido("https://preview.example/auth/callback?code=abc"),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/sin-acceso",
    );
  });

  it("si falla el code, redirige a ingreso con error=ingreso", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "bad" } });

    const respuesta = await GET(
      pedido("https://preview.example/auth/callback?code=abc"),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=ingreso",
    );
  });

  it("si falla el token_hash, redirige a ingreso con error=link", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "expired" } });

    const respuesta = await GET(
      pedido("https://preview.example/auth/callback?token_hash=otp-hash"),
    );

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=link",
    );
  });

  it("un error de OAuth vuelve a ingreso con error=google", async () => {
    const respuesta = await GET(
      pedido("https://preview.example/auth/callback?error=access_denied"),
    );

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso?error=google",
    );
  });
});
