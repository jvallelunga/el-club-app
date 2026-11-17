import { type NextRequest, NextResponse } from "next/server";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import {
  clienteAuthConCookies,
  guardarSiguiente,
} from "@/datos/supabase-auth-http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origen = request.nextUrl.origin;
  const seguro = request.nextUrl.protocol === "https:";
  const respuesta = NextResponse.redirect(new URL("/ingreso", origen));

  if (hayConfiguracionSupabase()) {
    const { supabase, aplicarCookies } = clienteAuthConCookies(request);
    await supabase.auth.signOut();
    aplicarCookies(respuesta);
  }
  guardarSiguiente(respuesta, null, seguro);
  return respuesta;
}
