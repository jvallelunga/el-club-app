import { type NextRequest, NextResponse } from "next/server";
import { emailValido, normalizarEmail } from "@/dominio/email";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import {
  clienteAuthConCookies,
  guardarSiguiente,
} from "@/datos/supabase-auth-http";

export const dynamic = "force-dynamic";

/**
 * El envío del magic link es POST. Un GET (prefetch) no manda ningún correo.
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
  let emailCrudo = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("form") || contentType.includes("multipart")) {
    const form = await request.formData();
    siguiente = String(form.get("siguiente") ?? siguiente);
    emailCrudo = String(form.get("email") ?? "");
  }

  function redirigir(path: string): NextResponse {
    return NextResponse.redirect(new URL(path, origen), 303);
  }

  if (!hayConfiguracionSupabase()) {
    return redirigir("/ingreso?error=config");
  }

  const email = normalizarEmail(emailCrudo);
  if (!emailValido(email)) {
    const ingreso = new URL("/ingreso", origen);
    ingreso.searchParams.set("error", "email");
    if (siguiente) ingreso.searchParams.set("siguiente", siguiente);
    return NextResponse.redirect(ingreso, 303);
  }

  const { supabase, aplicarCookies } = clienteAuthConCookies(request);

  const { data: permitido, error: errorPermiso } = await supabase.rpc(
    "puede_solicitar_ingreso_email",
    { p_email: email },
  );

  let errorEnvio = Boolean(errorPermiso);
  if (!errorPermiso && permitido) {
    const redirectTo = new URL("/auth/callback", origen).toString();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });
    if (error) errorEnvio = true;
  }

  // Mismo mensaje de “lo enviamos” si el email no está invitado.
  // Si falló el envío (SMTP, red, RPC), sí avisamos para que reintente.
  const ingreso = new URL("/ingreso", origen);
  if (errorEnvio) {
    ingreso.searchParams.set("error", "link");
  } else {
    ingreso.searchParams.set("enviado", "1");
    ingreso.searchParams.set("email", email);
  }
  if (siguiente) ingreso.searchParams.set("siguiente", siguiente);

  const respuesta = NextResponse.redirect(ingreso, 303);
  aplicarCookies(respuesta);
  guardarSiguiente(respuesta, siguiente, seguro);
  return respuesta;
}
