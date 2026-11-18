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

export function tieneAccesoApp(params: {
  esSuperAdmin: boolean;
  clubes: { slug: string }[];
}): boolean {
  return params.esSuperAdmin || params.clubes.length > 0;
}

export function destinoTrasIngreso(params: {
  esSuperAdmin: boolean;
  clubes: { slug: string }[];
  siguiente?: string | null;
}): string {
  // Sin invitación (ni Super Admin ni Admin) no se entra a ningún destino.
  if (!tieneAccesoApp(params)) return "/sin-acceso";
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

/** Mensaje si no puede editar los datos de ese club, o null si está habilitado. */
export function errorSiNoPuedeEditarClub(
  sesion: SesionApp | null,
  clubId: string,
): string | null {
  if (!sesion) return "Tenés que ingresar de nuevo.";
  if (!puedeAdministrarClub(sesion, clubId)) {
    return "No tenés permiso para editar los datos de este club.";
  }
  return null;
}

/** Solo el Super Admin puede cambiar identificador o dominio (rutas de acceso). */
export function puedeEditarRutasDelClub(sesion: SesionApp): boolean {
  return sesion.esSuperAdmin;
}

/** Mensaje si no puede gestionar Admins de ese club, o null si está habilitado. */
export function errorSiNoPuedeAdministrarAdmins(
  sesion: SesionApp | null,
  clubId: string,
): string | null {
  if (!sesion) return "Tenés que ingresar de nuevo.";
  if (!puedeAdministrarClub(sesion, clubId)) {
    return "No tenés permiso para administrar los Admins de este club.";
  }
  return null;
}

/** Mensaje si no se puede quitar a ese Admin, o null si se puede. */
export function errorAlQuitarAdmin(params: {
  actorUsuarioId: string;
  objetivoUsuarioId: string;
  cantidadAdmins: number;
}): string | null {
  if (params.cantidadAdmins > 1) return null;
  if (params.actorUsuarioId === params.objetivoUsuarioId) {
    return "No podés quitarte: sos el último Admin de este club.";
  }
  return "No se puede quitar al último Admin del club.";
}

/** Mensaje si no puede administrar sedes o instalaciones de ese club. */
export function errorSiNoPuedeAdministrarSedes(
  sesion: SesionApp | null,
  clubId: string,
): string | null {
  if (!sesion) return "Tenés que ingresar de nuevo.";
  if (!puedeAdministrarClub(sesion, clubId)) {
    return "No tenés permiso para administrar las sedes de este club.";
  }
  return null;
}

/** Mensaje si no puede editar el predio de una sede: solo el Super Admin. */
export function errorSiNoPuedeEditarPredio(sesion: SesionApp | null): string | null {
  if (!sesion) return "Tenés que ingresar de nuevo.";
  if (!sesion.esSuperAdmin) return "Solo el Super Admin puede editar el predio.";
  return null;
}
