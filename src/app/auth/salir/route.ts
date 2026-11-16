import { NextResponse } from "next/server";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { supabaseServidor } from "@/datos/supabase-servidor";

export async function GET(request: Request) {
  const origen = new URL(request.url).origin;
  if (hayConfiguracionSupabase()) {
    const supabase = await supabaseServidor();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/ingreso", origen));
}
