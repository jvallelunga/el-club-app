/**
 * Datos de ejemplo para los mocks de roles y permisos.
 * Los nombres y emails son ficticios y están rotulados como ejemplo.
 * El email real del Super Admin no va en el repo.
 * Ningún club real va hardcodeado: los mocks usan clubes de ejemplo.
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

export const CLUB_NORTE: ClubEjemplo = {
  slug: "club-de-ejemplo-del-norte",
  nombre: "Club de ejemplo del Norte",
  esEjemplo: true,
  escudo: null,
  iniciales: "EN",
};

export const CLUB_SUR: ClubEjemplo = {
  slug: "club-de-ejemplo-del-sur",
  nombre: "Club de ejemplo del Sur",
  esEjemplo: true,
  escudo: null,
  iniciales: "ES",
};

/** @deprecated usá CLUB_SUR. Se deja un alias para no romper imports viejos. */
export const CLUB_EJEMPLO = CLUB_SUR;

export const CLUBES_EJEMPLO: ClubEjemplo[] = [CLUB_NORTE, CLUB_SUR];

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
  [CLUB_NORTE.slug]: [PERSONA_LUCIA, PERSONA_MARTIN],
  [CLUB_SUR.slug]: [PERSONA_MARTIN, PERSONA_SOFIA],
};

export function clubPorSlug(slug: string): ClubEjemplo | undefined {
  return CLUBES_EJEMPLO.find((club) => club.slug === slug);
}

export const RUTAS_MOCK = {
  indice: "/mocks/roles",
  ingreso: "/mocks/roles/ingreso",
  sinAcceso: "/mocks/roles/sin-acceso",
  elegirClub: "/mocks/roles/elegir-club",
  superAdmin: "/mocks/roles/super-admin",
  nuevoClub: "/mocks/roles/super-admin/nuevo-club",
  nuevoClubDatos: "/mocks/roles/super-admin/nuevo-club?datos=1",
  nuevoClubErrores: "/mocks/roles/super-admin/nuevo-club?errores=1",
  nuevoClubCreado: "/mocks/roles/super-admin/nuevo-club/creado",
  admins: (slug: string) => `/mocks/roles/super-admin/clubes/${slug}/admins`,
  inicioClub: (slug: string) => `/mocks/roles/clubes/${slug}`,
  club: (slug: string) => `/mocks/roles/clubes/${slug}/club`,
} as const;

export const CLUB_CREADO_EJEMPLO = {
  nombre: "Club de ejemplo",
  slug: "club-de-ejemplo",
  marca: "#1f4b3a",
  color2: "#c47a2c",
  color3: "#2c4d6e",
  claro: "#ffffff",
  dominioBase: "clubejemplo.com.ar",
} as const;
