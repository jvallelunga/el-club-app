import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./tipos";
import { urlYClaveAnon } from "./env-supabase";

export async function supabaseServidor() {
  const { url, clave } = urlYClaveAnon();
  const jar = await cookies();

  return createServerClient<Database>(url, clave, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, options);
          }
        } catch {
          // Llamado desde un Server Component: el proxy ya refrescó la sesión.
        }
      },
    },
  });
}
