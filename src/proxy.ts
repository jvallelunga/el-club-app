import { type NextRequest, NextResponse } from "next/server";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import {
  actualizarSesionEnProxy,
  conCookies,
} from "@/datos/supabase-proxy";

function codigoRedireccion(request: NextRequest): 303 | 307 {
  // Tras un POST/PUT/PATCH/DELETE, 303 fuerza un GET al destino.
  // En GET/HEAD se mantiene 307.
  const metodo = request.method.toUpperCase();
  if (metodo === "GET" || metodo === "HEAD") return 307;
  return 303;
}

function esRutaPublica(pathname: string): boolean {
  if (pathname === "/" || pathname === "/ingreso") return true;
  if (pathname.startsWith("/auth/")) return true;
  // Worker de MapLibre (archivo estático de la librería).
  if (pathname.startsWith("/maplibre/")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const publica = esRutaPublica(pathname);

  if (!hayConfiguracionSupabase()) {
    if (publica) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = "/ingreso";
    url.search = "";
    return NextResponse.redirect(url, codigoRedireccion(request));
  }

  const { respuesta, usuarioId } = await actualizarSesionEnProxy(request);

  if (!usuarioId && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingreso";
    url.search = "";
    const siguiente = `${pathname}${search}`;
    if (siguiente && siguiente !== "/ingreso") {
      url.searchParams.set("siguiente", siguiente);
    }
    return conCookies(NextResponse.redirect(url, codigoRedireccion(request)), respuesta);
  }

  return respuesta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
