import { type NextRequest, NextResponse } from "next/server";
import { destinoTrasIngreso } from "@/dominio/permisos";
import { parametrosCallbackAuth } from "@/dominio/ingreso-email";
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
  const seguro = url.protocol === "https:";
  const params = parametrosCallbackAuth(url.searchParams);

  const redirigir = (path: string, aplicar?: (r: NextResponse) => NextResponse) => {
    const respuesta = NextResponse.redirect(new URL(path, origen), 303);
    return aplicar ? aplicar(respuesta) : respuesta;
  };

  if (!hayConfiguracionSupabase()) {
    return redirigir("/ingreso?error=config");
  }

  if (params.clase === "error") {
    const errorIngreso =
      params.codigo.includes("otp") || params.codigo.includes("magic")
        ? "link"
        : "google";
    return redirigir(`/ingreso?error=${errorIngreso}`);
  }

  if (params.clase === "vacio") {
    return redirigir("/ingreso?error=link");
  }

  const { supabase, aplicarCookies } = clienteAuthConCookies(request);

  if (params.clase === "codigo") {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      return redirigir("/ingreso?error=ingreso", aplicarCookies);
    }
  } else {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: params.tipo,
    });
    if (error) {
      return redirigir("/ingreso?error=link", aplicarCookies);
    }
  }

  const sesion = await cargarSesion(supabase);
  const siguiente =
    leerSiguiente(request) ?? url.searchParams.get("siguiente");
  const destino = destinoTrasIngreso({
    esSuperAdmin: Boolean(sesion?.esSuperAdmin),
    clubes: sesion?.membresias ?? [],
    siguiente,
  });
  const respuesta = NextResponse.redirect(new URL(destino, origen), 303);
  aplicarCookies(respuesta);
  guardarSiguiente(respuesta, null, seguro);
  return respuesta;
}
