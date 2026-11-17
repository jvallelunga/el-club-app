/**
 * Datos de ejemplo para los mocks de contacto, sedes e instalaciones.
 * Nombres, direcciones y links son ficticios y están rotulados como ejemplo.
 * Ningún club real —tampoco Los Cardos— aparece acá.
 */

export const REDES_SOCIALES = [
  { id: "instagram", etiqueta: "Instagram" },
  { id: "facebook", etiqueta: "Facebook" },
  { id: "x", etiqueta: "X" },
  { id: "youtube", etiqueta: "YouTube" },
  { id: "tiktok", etiqueta: "TikTok" },
  { id: "whatsapp", etiqueta: "WhatsApp" },
  { id: "linkedin", etiqueta: "LinkedIn" },
  { id: "otra", etiqueta: "Otra" },
] as const;

export type IdRedSocial = (typeof REDES_SOCIALES)[number]["id"];

export type RedSocialEjemplo = {
  id: string;
  red: IdRedSocial;
  etiqueta?: string;
  valor: string;
};

export type ContactoClubEjemplo = {
  telefono: string;
  email: string;
  direccion: string;
  web: string;
  redes: RedSocialEjemplo[];
};

export const TIPOS_INSTALACION_BASE = [
  { id: "cancha-rugby", nombre: "Cancha de rugby", base: true },
  { id: "cancha-hockey", nombre: "Cancha de hockey", base: true },
  { id: "cancha-tenis", nombre: "Cancha de tenis", base: true },
  { id: "cancha-futbol", nombre: "Cancha de fútbol", base: true },
  { id: "house", nombre: "House", base: true },
  { id: "pileta", nombre: "Pileta", base: true },
  { id: "gym", nombre: "Gym", base: true },
  { id: "vestuario", nombre: "Vestuario", base: true },
  { id: "quincho", nombre: "Quincho", base: true },
  { id: "salon", nombre: "Salón", base: true },
  { id: "otra", nombre: "Otra", base: true },
] as const;

export type TipoInstalacionEjemplo = {
  id: string;
  nombre: string;
  base: boolean;
};

export type InstalacionEjemplo = {
  id: string;
  tipoId: string;
  nombre: string;
  notas: string;
};

export type SedeEjemplo = {
  id: string;
  clubSlug: string;
  nombre: string;
  direccion: string;
  mapsUrl: string;
  instalaciones: InstalacionEjemplo[];
};

export const TIPOS_DEL_CLUB_EJEMPLO: TipoInstalacionEjemplo[] = [
  ...TIPOS_INSTALACION_BASE,
  { id: "cantina", nombre: "Cantina", base: false },
];

export const CONTACTO_CLUB_NORTE: ContactoClubEjemplo = {
  telefono: "+54 11 4000-1200",
  email: "contacto@clubejemplo.com.ar",
  direccion: "Av. de los Clubes 1200, Ciudad de ejemplo",
  web: "https://www.clubejemplo.com.ar",
  redes: [
    { id: "r1", red: "instagram", valor: "@clubdeejemplo" },
    { id: "r2", red: "facebook", valor: "https://facebook.com/clubdeejemplo" },
    { id: "r3", red: "whatsapp", valor: "+54 11 4000-1200" },
    {
      id: "r4",
      red: "otra",
      etiqueta: "Canal de videos",
      valor: "https://video.ejemplo.com/clubdeejemplo",
    },
  ],
};

export const CONTACTO_VACIO: ContactoClubEjemplo = {
  telefono: "",
  email: "",
  direccion: "",
  web: "",
  redes: [],
};

export const SEDES_CLUB_NORTE: SedeEjemplo[] = [
  {
    id: "campo-de-deportes",
    clubSlug: "club-de-ejemplo-del-norte",
    nombre: "Campo de deportes",
    direccion: "Av. de los Clubes 1200, Ciudad de ejemplo",
    mapsUrl: "https://www.google.com/maps/@-34.6123,-58.4456,16z",
    instalaciones: [
      {
        id: "cancha-1",
        tipoId: "cancha-rugby",
        nombre: "Cancha 1",
        notas: "Césped natural, con iluminación.",
      },
      {
        id: "cancha-2",
        tipoId: "cancha-rugby",
        nombre: "Cancha 2",
        notas: "Césped sintético.",
      },
      {
        id: "vestuario-principal",
        tipoId: "vestuario",
        nombre: "Vestuario principal",
        notas: "",
      },
      {
        id: "quincho",
        tipoId: "quincho",
        nombre: "Quincho",
        notas: "Junto a la Cancha 1.",
      },
    ],
  },
  {
    id: "sede-social",
    clubSlug: "club-de-ejemplo-del-norte",
    nombre: "Sede social",
    direccion: "Calle del Parque 450, Ciudad de ejemplo",
    mapsUrl: "https://www.google.com/maps?q=-34.5980,-58.4210",
    instalaciones: [
      {
        id: "house",
        tipoId: "house",
        nombre: "House",
        notas: "",
      },
      {
        id: "salon",
        tipoId: "salon",
        nombre: "Salón",
        notas: "Hasta 80 personas.",
      },
      {
        id: "gym",
        tipoId: "gym",
        nombre: "Gym",
        notas: "",
      },
      {
        id: "cantina",
        tipoId: "cantina",
        nombre: "Cantina",
        notas: "Tipo agregado por el club (ejemplo).",
      },
    ],
  },
];

export function sedePorId(id: string): SedeEjemplo | undefined {
  return SEDES_CLUB_NORTE.find((sede) => sede.id === id);
}

export function tipoInstalacionPorId(
  id: string,
): TipoInstalacionEjemplo | undefined {
  return TIPOS_DEL_CLUB_EJEMPLO.find((tipo) => tipo.id === id);
}

export function etiquetaRed(red: RedSocialEjemplo): string {
  if (red.red === "otra" && red.etiqueta) return red.etiqueta;
  return REDES_SOCIALES.find((item) => item.id === red.red)?.etiqueta ?? "Red";
}
