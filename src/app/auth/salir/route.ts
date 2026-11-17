import { type NextRequest, NextResponse } from "next/server";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import {
  clienteAuthConCookies,
  guardarSiguiente,
} from "@/datos/supabase-auth-http";

export const dynamic = "force-dynamic";

async function salir(request: NextRequest) {
  const origen = request.nextUrl.origin;
  const seguro = request.nextUrl.protocol === "https:";
  // 303 por si el cierre de sesión llega por POST (un 307 reenviaría el POST).
  const respuesta = NextResponse.redirect(new URL("/ingreso", origen), 303);

  if (hayConfiguracionSupabase()) {
    const { supabase, aplicarCookies } = clienteAuthConCookies(request);
    await supabase.auth.signOut();
    aplicarCookies(respuesta);
  }
  guardarSiguiente(respuesta, null, seguro);
  return respuesta;
}

export async function GET(request: NextRequest) {
  return salir(request);
}

export async function POST(request: NextRequest) {
  return salir(request);
}
