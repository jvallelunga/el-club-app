/** Redes sociales y validación del contacto del club. */

import { emailValido, normalizarEmail } from "./email";

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

export const IDS_RED_SOCIAL: readonly IdRedSocial[] = REDES_SOCIALES.map(
  (item) => item.id,
);

export type RedSocialInput = {
  red: string;
  etiqueta?: string | null;
  valor: string;
};

export type ContactoInput = {
  telefono: string;
  email: string;
  direccion: string;
  web: string;
  redes: RedSocialInput[];
};

export type ErroresContacto = {
  telefono?: string;
  email?: string;
  direccion?: string;
  web?: string;
  redes?: string;
};

export function esIdRedSocial(valor: string): valor is IdRedSocial {
  return (IDS_RED_SOCIAL as readonly string[]).includes(valor);
}

export function etiquetaRed(red: RedSocialInput): string {
  if (red.red === "otra" && red.etiqueta?.trim()) return red.etiqueta.trim();
  return REDES_SOCIALES.find((item) => item.id === red.red)?.etiqueta ?? "Red";
}

export function textoOpcional(valor: string): string | null {
  const limpio = valor.trim();
  return limpio ? limpio : null;
}

/** Acepta http(s) o un dominio; si no hay esquema, se antepone https://. */
export function normalizarWeb(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (/^https?:\/\//i.test(limpio)) return limpio;
  return `https://${limpio}`;
}

export function webValida(valor: string): boolean {
  const normalizada = normalizarWeb(valor);
  if (!normalizada) return false;
  try {
    const url = new URL(normalizada);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function validarContacto(input: ContactoInput): ErroresContacto {
  const errores: ErroresContacto = {};
  const email = input.email.trim();
  if (email && !emailValido(email)) {
    errores.email = "Revisá el email, no parece válido.";
  }
  const web = input.web.trim();
  if (web && !webValida(web)) {
    errores.web = "Revisá la web, no parece un link válido.";
  }

  const redesConValor = input.redes.filter((red) => red.valor.trim());
  for (const red of redesConValor) {
    if (!esIdRedSocial(red.red)) {
      errores.redes = "Hay una red que no está en la lista.";
      break;
    }
    if (red.red === "otra" && !red.etiqueta?.trim()) {
      errores.redes = "Poné el nombre de la red cuando elegís «Otra».";
      break;
    }
  }
  return errores;
}

export function contactoParaGuardar(input: ContactoInput): {
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  web: string | null;
  redes: { red: IdRedSocial; etiqueta: string | null; valor: string; orden: number }[];
} {
  const email = textoOpcional(input.email);
  const web = textoOpcional(input.web);
  return {
    telefono: textoOpcional(input.telefono),
    email: email ? normalizarEmail(email) : null,
    direccion: textoOpcional(input.direccion),
    web: web ? normalizarWeb(web) : null,
    redes: input.redes
      .filter((red) => red.valor.trim() && esIdRedSocial(red.red))
      .map((red, orden) => ({
        red: red.red as IdRedSocial,
        etiqueta:
          red.red === "otra" ? (textoOpcional(red.etiqueta ?? "") ?? null) : null,
        valor: red.valor.trim(),
        orden,
      })),
  };
}
