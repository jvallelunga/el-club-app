import { rutaFallbackClub, type SuperficieApp } from "./host";

export type RolClub = "admin";

export type MembresiaClub = {
  clubId: string;
  slug: string;
  nombre: string;
  rol: RolClub;
};

export type SesionApp = {
  usuarioId: string;
  email: string;
  nombre: string;
  esSuperAdmin: boolean;
  membresias: MembresiaClub[];
};

export function puedeAdministrarClub(
  sesion: SesionApp,
  clubId: string,
): boolean {
  if (sesion.esSuperAdmin) return true;
  return sesion.membresias.some(
    (membresia) => membresia.clubId === clubId && membresia.rol === "admin",
  );
}

export function clubesAdministrables(sesion: SesionApp): MembresiaClub[] {
  if (sesion.esSuperAdmin) return sesion.membresias;
  return sesion.membresias.filter((membresia) => membresia.rol === "admin");
}

export function siguienteSeguro(valor?: string | null): string | null {
  if (!valor) return null;
  if (!valor.startsWith("/")) return null;
  if (valor.startsWith("//") || valor.startsWith("/\\")) return null;
  if (valor.includes("://")) return null;
  if (valor.startsWith("/ingreso") || valor.startsWith("/auth/")) return null;
  return valor;
}

export function destinoTrasIngreso(params: {
  esSuperAdmin: boolean;
  clubes: { slug: string }[];
  siguiente?: string | null;
}): string {
  const siguiente = siguienteSeguro(params.siguiente);
  if (siguiente) return siguiente;
  if (params.esSuperAdmin) return "/super-admin";
  if (params.clubes.length === 1) {
    const slug = params.clubes[0]?.slug;
    if (slug) return rutaFallbackClub(slug, "admin");
  }
  if (params.clubes.length > 1) return "/elegir-club";
  return "/sin-acceso";
}

export function rutaClub(slug: string, superficie: SuperficieApp = "admin"): string {
  return rutaFallbackClub(slug, superficie);
}
