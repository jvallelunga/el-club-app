/**
 * Datos de ejemplo para los mocks de roles y permisos.
 * Los nombres y emails son ficticios y están rotulados como ejemplo.
 * El email real del Super Admin no va en el repo.
 */

export type ClubEjemplo = {
  slug: string;
  nombre: string;
  esEjemplo: boolean;
  escudo: string | null;
  iniciales: string;
};

export type PersonaEjemplo = {
  id: string;
  nombre: string;
  email: string;
  esEjemplo: true;
};

export const CLUB_CARDOS: ClubEjemplo = {
  slug: "los-cardos",
  nombre: "Los Cardos Rugby Club",
  esEjemplo: false,
  escudo: "/mocks/roles/los-cardos.png",
  iniciales: "LC",
};

export const CLUB_EJEMPLO: ClubEjemplo = {
  slug: "club-ejemplo-del-sur",
  nombre: "Club Ejemplo del Sur",
  esEjemplo: true,
  escudo: null,
  iniciales: "ES",
};

export const CLUBES_EJEMPLO: ClubEjemplo[] = [CLUB_CARDOS, CLUB_EJEMPLO];

export const PERSONA_LUCIA: PersonaEjemplo = {
  id: "lucia-fernandez",
  nombre: "Lucía Fernández",
  email: "lucia.fernandez@ejemplo.com",
  esEjemplo: true,
};

export const PERSONA_MARTIN: PersonaEjemplo = {
  id: "martin-gomez",
  nombre: "Martín Gómez",
  email: "martin.gomez@ejemplo.com",
  esEjemplo: true,
};

export const PERSONA_SOFIA: PersonaEjemplo = {
  id: "sofia-ruiz",
  nombre: "Sofía Ruiz",
  email: "sofia.ruiz@ejemplo.com",
  esEjemplo: true,
};

export const PERSONA_ANA: PersonaEjemplo = {
  id: "ana-lopez",
  nombre: "Ana López",
  email: "ana.lopez@ejemplo.com",
  esEjemplo: true,
};

export const ADMINS_POR_CLUB: Record<string, PersonaEjemplo[]> = {
  [CLUB_CARDOS.slug]: [PERSONA_LUCIA, PERSONA_MARTIN],
  [CLUB_EJEMPLO.slug]: [PERSONA_MARTIN, PERSONA_SOFIA],
};

export function clubPorSlug(slug: string): ClubEjemplo | undefined {
  return CLUBES_EJEMPLO.find((club) => club.slug === slug);
}

export function slugDesdeNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const RUTAS_MOCK = {
  indice: "/mocks/roles",
  ingreso: "/mocks/roles/ingreso",
  sinAcceso: "/mocks/roles/sin-acceso",
  elegirClub: "/mocks/roles/elegir-club",
  superAdmin: "/mocks/roles/super-admin",
  nuevoClub: "/mocks/roles/super-admin/nuevo-club",
  nuevoClubCreado: "/mocks/roles/super-admin/nuevo-club/creado",
  admins: (slug: string) => `/mocks/roles/super-admin/clubes/${slug}/admins`,
  inicioClub: (slug: string) => `/mocks/roles/clubes/${slug}`,
} as const;
