/**
 * Tokens de tema de El Club.
 * Las variables CSS vivas están en `globals.css` y en `tema.ts`.
 * El default es el tema de producto (naranja del logo). Dentro de un
 * club lo pisa la paleta de ese club.
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

/** Paleta de producto (no es la de un club). */
export const paletaProvisional: PaletaClub = {
  fondo: "#fffaf7",
  fondoForeground: "#1c1917",
  card: "#ffffff",
  cardForeground: "#1c1917",
  primario: "#FF8C42",
  primarioForeground: "#1c1917",
  secundario: "#fff1e8",
  secundarioForeground: "#1c1917",
  muted: "#fff1e8",
  mutedForeground: "#6f675f",
  borde: "#e8e0d8",
  anillo: "#FF8C42",
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
