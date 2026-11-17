import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOtp = vi.fn();

vi.mock("./env-supabase", () => ({
  hayConfiguracionSupabase: vi.fn(() => true),
  urlYClaveAnon: vi.fn(() => ({
    url: "https://ejemplo.supabase.co",
    clave: "anon",
  })),
}));

import { hayConfiguracionSupabase } from "./env-supabase";
import { enviarMagicLinkIngreso } from "./enviar-link-ingreso";

describe("enviarMagicLinkIngreso", () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    vi.mocked(hayConfiguracionSupabase).mockReturnValue(true);
  });

  it("envía el OTP con shouldCreateUser y el callback del club", async () => {
    signInWithOtp.mockResolvedValue({ error: null });

    const resultado = await enviarMagicLinkIngreso(
      "lucia.fernandez+admin@ejemplo.com",
      {
        origen: "https://preview.example",
        siguiente: "/c/club-norte/admin",
      },
      { auth: { signInWithOtp } },
    );

    expect(resultado).toEqual({ ok: true });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "lucia.fernandez+admin@ejemplo.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo:
          "https://preview.example/auth/callback?siguiente=%2Fc%2Fclub-norte%2Fadmin",
      },
    });
  });

  it("no crea un usuario de Auth si falta la configuración, y traduce el rate limit", async () => {
    vi.mocked(hayConfiguracionSupabase).mockReturnValue(false);
    await expect(
      enviarMagicLinkIngreso(
        "lucia@ejemplo.com",
        { origen: "https://preview.example" },
        { auth: { signInWithOtp } },
      ),
    ).resolves.toEqual({
      ok: false,
      error: "El ingreso todavía no está configurado.",
    });
    expect(signInWithOtp).not.toHaveBeenCalled();

    vi.mocked(hayConfiguracionSupabase).mockReturnValue(true);
    signInWithOtp.mockResolvedValue({
      error: { message: "email rate limit exceeded" },
    });
    const fallo = await enviarMagicLinkIngreso(
      "lucia@ejemplo.com",
      { origen: "https://preview.example" },
      { auth: { signInWithOtp } },
    );
    expect(fallo.ok).toBe(false);
    if (!fallo.ok) expect(fallo.error).toMatch(/cupo/);
  });
});
