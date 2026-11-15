import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./tipos";

function urlYClaveAnon(): { url: string; clave: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (o PUBLISHABLE_KEY).",
    );
  }
  return { url, clave };
}

export function supabaseAnon(): SupabaseClient<Database> {
  const { url, clave } = urlYClaveAnon();
  return createClient<Database>(url, clave);
}

export function supabaseService(): SupabaseClient<Database> {
  const { url } = urlYClaveAnon();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient<Database>(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
