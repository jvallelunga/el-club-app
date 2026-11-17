import { type NextRequest, NextResponse } from "next/server";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import {
  clienteAuthConCookies,
  guardarSiguiente,
} from "@/datos/supabase-auth-http";

export const dynamic = "force-dynamic";

/**
 * El cierre de sesión tiene que ser POST. Un GET (el prefetch de un
 * <Link href="/auth/salir">) cerraba la sesión apenas entrabas al admin.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/ingreso", request.nextUrl.origin), 303);
}

export async function POST(request: NextRequest) {
  const origen = request.nextUrl.origin;
  const seguro = request.nextUrl.protocol === "https:";
  const respuesta = NextResponse.redirect(new URL("/ingreso", origen), 303);

  if (hayConfiguracionSupabase()) {
    const { supabase, aplicarCookies } = clienteAuthConCookies(request);
    await supabase.auth.signOut();
    aplicarCookies(respuesta);
  }
  guardarSiguiente(respuesta, null, seguro);
  return respuesta;
}
