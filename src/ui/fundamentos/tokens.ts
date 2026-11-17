/**
 * Tokens de tema de El Club.
 * La paleta de cada club se carga en el ítem 2 (personalización).
 * Estos valores son un neutro provisional para que la app renderice,
 * no son la marca de ningún club.
 */

export type PaletaClub = {
  fondo: string;
  fondoForeground: string;
  card: string;
  cardForeground: string;
  primario: string;
  primarioForeground: string;
  secundario: string;
  secundarioForeground: string;
  muted: string;
  mutedForeground: string;
  borde: string;
  anillo: string;
};

/** Paleta vacía / provisional, lista para reemplazar en el ítem 2. */
export const paletaProvisional: PaletaClub = {
  fondo: "#fafafa",
  fondoForeground: "#171717",
  card: "#ffffff",
  cardForeground: "#171717",
  primario: "#171717",
  primarioForeground: "#fafafa",
  secundario: "#f5f5f5",
  secundarioForeground: "#171717",
  muted: "#f5f5f5",
  mutedForeground: "#737373",
  borde: "#e5e5e5",
  anillo: "#171717",
};

export const tipografia = {
  ui: "Inter",
} as const;

export const escalaTipo = {
  ui: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.3125rem",
    "2xl": "1.625rem",
    "3xl": "2rem",
  },
} as const;

export const espaciado = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

export const radios = {
  none: "0",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;
