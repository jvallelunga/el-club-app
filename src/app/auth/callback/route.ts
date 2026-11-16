import { NextResponse } from "next/server";
import { destinoTrasIngreso } from "@/dominio/permisos";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { cargarSesion } from "@/datos/consultas/sesion";
import { supabaseServidor } from "@/datos/supabase-servidor";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origen = url.origin;
  const code = url.searchParams.get("code");
  const siguiente = url.searchParams.get("siguiente");

  if (!hayConfiguracionSupabase()) {
    return NextResponse.redirect(new URL("/ingreso?error=config", origen));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/ingreso?error=google", origen));
  }

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/ingreso?error=google", origen));
  }

  const sesion = await cargarSesion(supabase);
  const destino = destinoTrasIngreso({
    esSuperAdmin: Boolean(sesion?.esSuperAdmin),
    clubes: sesion?.membresias ?? [],
    siguiente,
  });
  return NextResponse.redirect(new URL(destino, origen));
}
