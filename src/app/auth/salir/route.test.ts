import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
const aplicarCookies = vi.fn((respuesta: NextResponse) => respuesta);

vi.mock("@/datos/env-supabase", () => ({
  hayConfiguracionSupabase: vi.fn(() => true),
}));

vi.mock("@/datos/supabase-auth-http", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/datos/supabase-auth-http")>();
  return {
    ...real,
    clienteAuthConCookies: () => ({
      supabase: { auth: { signOut } },
      aplicarCookies,
    }),
  };
});

import { GET, POST } from "./route";

function pedido(method: string) {
  return new NextRequest(new URL("https://preview.example/auth/salir"), {
    method,
  });
}

describe("GET /auth/salir", () => {
  beforeEach(() => {
    signOut.mockReset();
    aplicarCookies.mockClear();
  });

  it("no cierra la sesión (el prefetch de un Link no debe desloguear)", async () => {
    const respuesta = await GET(pedido("GET"));
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso",
    );
    expect(signOut).not.toHaveBeenCalled();
    expect(aplicarCookies).not.toHaveBeenCalled();
  });
});

describe("POST /auth/salir", () => {
  beforeEach(() => {
    signOut.mockReset();
    aplicarCookies.mockClear();
  });

  it("cierra la sesión y redirige con 303 al ingreso", async () => {
    signOut.mockResolvedValue({ error: null });
    const respuesta = await POST(pedido("POST"));
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.get("location")).toBe(
      "https://preview.example/ingreso",
    );
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(aplicarCookies).toHaveBeenCalledTimes(1);
  });
});
