import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./tipos";
import { urlYClaveAnon } from "./env-supabase";

/**
 * Refresca la sesión en el proxy de Next y devuelve la respuesta
 * (hay que devolver esa misma respuesta para no perder las cookies).
 */
export async function actualizarSesionEnProxy(request: NextRequest): Promise<{
  respuesta: NextResponse;
  usuarioId: string | null;
}> {
  let respuesta = NextResponse.next({ request });
  const { url, clave } = urlYClaveAnon();

  const supabase = createServerClient<Database>(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { respuesta, usuarioId: user?.id ?? null };
}

export function conCookies(
  destino: NextResponse,
  origen: NextResponse,
): NextResponse {
  for (const cookie of origen.cookies.getAll()) {
    destino.cookies.set(cookie);
  }
  return destino;
}
