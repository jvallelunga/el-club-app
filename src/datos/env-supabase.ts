import "server-only";

export function urlYClaveAnon(): { url: string; clave: string } {
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

export function hayConfiguracionSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && clave);
}

export function dominiosProducto(): string[] {
  const extra = process.env.NEXT_PUBLIC_DOMINIOS_PRODUCTO ?? "";
  const desdeEnv = extra
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(
    new Set([
      "localhost",
      "127.0.0.1",
      "el-club-app-dev.vercel.app",
      "el-club-app.vercel.app",
      ...desdeEnv,
    ]),
  );
}
