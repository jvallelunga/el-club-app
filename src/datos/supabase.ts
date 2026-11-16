import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./tipos";
import { urlYClaveAnon } from "./env-supabase";

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
