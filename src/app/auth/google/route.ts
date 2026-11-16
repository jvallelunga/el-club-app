import { NextResponse } from "next/server";
import { supabaseServidor } from "@/datos/supabase-servidor";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";

export async function GET(request: Request) {
  const origen = new URL(request.url);
  const siguiente = origen.searchParams.get("siguiente") ?? "";

  if (!hayConfiguracionSupabase()) {
    return NextResponse.redirect(new URL("/ingreso?error=config", origen.origin));
  }

  const supabase = await supabaseServidor();
  const redirectTo = new URL("/auth/callback", origen.origin);
  if (siguiente) redirectTo.searchParams.set("siguiente", siguiente);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo.toString() },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/ingreso?error=google", origen.origin));
  }

  return NextResponse.redirect(data.url);
}
