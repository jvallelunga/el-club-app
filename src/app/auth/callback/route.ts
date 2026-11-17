import { type NextRequest, NextResponse } from "next/server";
import { destinoTrasIngreso } from "@/dominio/permisos";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { cargarSesion } from "@/datos/consultas/sesion";
import {
  clienteAuthConCookies,
  guardarSiguiente,
  leerSiguiente,
} from "@/datos/supabase-auth-http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origen = url.origin;
  const code = url.searchParams.get("code");
  const errorOAuth = url.searchParams.get("error") ?? url.searchParams.get("error_code");

  if (!hayConfiguracionSupabase()) {
    return NextResponse.redirect(new URL("/ingreso?error=config", origen));
  }

  if (errorOAuth || !code) {
    return NextResponse.redirect(new URL("/ingreso?error=google", origen));
  }

  const { supabase, aplicarCookies } = clienteAuthConCookies(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const fallo = NextResponse.redirect(new URL("/ingreso?error=google", origen));
    aplicarCookies(fallo);
    return fallo;
  }

  const sesion = await cargarSesion(supabase);
  const siguiente =
    leerSiguiente(request) ?? url.searchParams.get("siguiente");
  const destino = destinoTrasIngreso({
    esSuperAdmin: Boolean(sesion?.esSuperAdmin),
    clubes: sesion?.membresias ?? [],
    siguiente,
  });
  const respuesta = NextResponse.redirect(new URL(destino, origen));
  aplicarCookies(respuesta);
  guardarSiguiente(respuesta, null, url.protocol === "https:");
  return respuesta;
}
