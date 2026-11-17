import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  mensajeErrorEnvioLink,
  urlCallbackIngreso,
} from "@/dominio/ingreso-email";
import { hayConfiguracionSupabase, urlYClaveAnon } from "./env-supabase";

export type ResultadoEnvioLink =
  | { ok: true }
  | { ok: false; error: string };

type ClienteOtp = {
  auth: {
    signInWithOtp: (params: {
      email: string;
      options: { shouldCreateUser: boolean; emailRedirectTo: string };
    }) => Promise<{ error: { message: string } | null }>;
  };
};

/**
 * Manda el mismo magic link que «Enviarme el link» en /ingreso.
 * Usa un cliente anon sin cookies, para no pisar la sesión de quien invita.
 */
export async function enviarMagicLinkIngreso(
  email: string,
  opciones: { origen: string; siguiente?: string | null },
  cliente?: ClienteOtp,
): Promise<ResultadoEnvioLink> {
  if (!hayConfiguracionSupabase()) {
    return { ok: false, error: "El ingreso todavía no está configurado." };
  }
  const emailRedirectTo = urlCallbackIngreso(opciones.origen, opciones.siguiente);
  if (!emailRedirectTo) {
    return { ok: false, error: mensajeErrorEnvioLink() };
  }

  const supabase =
    cliente ??
    (() => {
      const { url, clave } = urlYClaveAnon();
      return createClient(url, clave, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    })();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo,
    },
  });
  if (error) {
    return { ok: false, error: mensajeErrorEnvioLink(error.message) };
  }
  return { ok: true };
}
