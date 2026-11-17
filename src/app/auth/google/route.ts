import { type NextRequest, NextResponse } from "next/server";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import {
  clienteAuthConCookies,
  guardarSiguiente,
} from "@/datos/supabase-auth-http";

export const dynamic = "force-dynamic";

/**
 * El inicio de Google tiene que ser POST. Un GET (por ejemplo el prefetch
 * de un <Link>) disparaba el flujo de OAuth de fondo, pisaba el state y
 * terminaba en el site_url con bad_oauth_state.
 */
export async function GET(request: NextRequest) {
  const ingreso = new URL("/ingreso", request.url);
  const siguiente = request.nextUrl.searchParams.get("siguiente");
  if (siguiente) ingreso.searchParams.set("siguiente", siguiente);
  return NextResponse.redirect(ingreso, 303);
}

export async function POST(request: NextRequest) {
  const origen = request.nextUrl.origin;
  const seguro = request.nextUrl.protocol === "https:";

  let siguiente = request.nextUrl.searchParams.get("siguiente") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("form") || contentType.includes("multipart")) {
    const form = await request.formData();
    siguiente = String(form.get("siguiente") ?? siguiente);
  }

  if (!hayConfiguracionSupabase()) {
    return NextResponse.redirect(new URL("/ingreso?error=config", origen));
  }

  const { supabase, aplicarCookies } = clienteAuthConCookies(request);

  // redirect_to limpio, sin query: así matchea la uri_allow_list.
  // El destino interno va en una cookie, no en la URL de OAuth.
  const redirectTo = new URL("/auth/callback", origen).toString();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error || !data.url) {
    const fallo = NextResponse.redirect(new URL("/ingreso?error=google", origen));
    aplicarCookies(fallo);
    return fallo;
  }

  const respuesta = NextResponse.redirect(data.url);
  aplicarCookies(respuesta);
  guardarSiguiente(respuesta, siguiente, seguro);
  return respuesta;
}
