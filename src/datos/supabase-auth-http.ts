import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./tipos";
import { urlYClaveAnon } from "./env-supabase";
import { siguienteSeguro } from "@/dominio/permisos";

/** Dónde volver después del login. Cookie, no query en redirect_to de OAuth. */
export const COOKIE_SIGUIENTE = "el_club_siguiente";

type CookieParaSetear = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export function clienteAuthConCookies(request: NextRequest): {
  supabase: ReturnType<typeof createServerClient<Database>>;
  aplicarCookies: (respuesta: NextResponse) => NextResponse;
} {
  const { url, clave } = urlYClaveAnon();
  const pendientes: CookieParaSetear[] = [];

  const supabase = createServerClient<Database>(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          pendientes.push(cookie);
        }
      },
    },
  });

  function aplicarCookies(respuesta: NextResponse): NextResponse {
    for (const { name, value, options } of pendientes) {
      respuesta.cookies.set(name, value, options);
    }
    return respuesta;
  }

  return { supabase, aplicarCookies };
}

export function guardarSiguiente(
  respuesta: NextResponse,
  siguiente: string | null,
  seguro: boolean,
): void {
  const valor = siguienteSeguro(siguiente);
  if (!valor) {
    respuesta.cookies.set(COOKIE_SIGUIENTE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: seguro,
      httpOnly: true,
    });
    return;
  }
  respuesta.cookies.set(COOKIE_SIGUIENTE, valor, {
    path: "/",
    maxAge: 60 * 10,
    sameSite: "lax",
    secure: seguro,
    httpOnly: true,
  });
}

export function leerSiguiente(request: NextRequest): string | null {
  return siguienteSeguro(request.cookies.get(COOKIE_SIGUIENTE)?.value ?? null);
}
