/** Utilidades de paleta del club: normalización HEX, contraste AA y colores derivados. */

export const COLOR_MARCA_VACIO = "#1c1917";
export const COLOR_CLARO_DEFAULT = "#ffffff";

export const ESTADOS_SISTEMA = {
  ok: { etiqueta: "Ok", claro: "#1f4e5a", oscuro: "#8ec8c4" },
  alerta: { etiqueta: "Alerta", claro: "#8a5a00", oscuro: "#e0b04a" },
  error: { etiqueta: "Error", claro: "#8c2f1f", oscuro: "#e8a090" },
  enVivo: { etiqueta: "En vivo", claro: "#a33b2b", oscuro: "#e07a6a" },
} as const;

const HEX = /^#?([0-9a-fA-F]{6})$/;
const HEX_CORTO = /^#?([0-9a-fA-F]{3})$/;

export function normalizarHex(valor: string): string | null {
  const recortado = valor.trim();
  const completo = HEX.exec(recortado);
  if (completo) return `#${completo[1].toLowerCase()}`;
  const corto = HEX_CORTO.exec(recortado);
  if (!corto) return null;
  const [r, g, b] = corto[1];
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
}

export function esHexValido(valor: string): boolean {
  return normalizarHex(valor) !== null;
}

export function hexARgb(hex: string): [number, number, number] | null {
  const normalizado = normalizarHex(hex);
  if (!normalizado) return null;
  return [
    parseInt(normalizado.slice(1, 3), 16),
    parseInt(normalizado.slice(3, 5), 16),
    parseInt(normalizado.slice(5, 7), 16),
  ];
}

function rgbAHex(r: number, g: number, b: number): string {
  const canal = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

function canalLineal(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminanciaRelativa(hex: string): number {
  const rgb = hexARgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(canalLineal) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG 2.1 entre dos colores. */
export function ratioContraste(a: string, b: string): number {
  const l1 = luminanciaRelativa(a);
  const l2 = luminanciaRelativa(b);
  const claro = Math.max(l1, l2);
  const oscuro = Math.min(l1, l2);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Texto negro o blanco, el que mejor contraste (objetivo AA 4,5:1). */
export function textoConContrasteAA(fondo: string): "#ffffff" | "#000000" {
  const blanco = ratioContraste(fondo, "#ffffff");
  const negro = ratioContraste(fondo, "#000000");
  return blanco >= negro ? "#ffffff" : "#000000";
}

export function mezclarHex(hex: string, con: string, t: number): string {
  const a = hexARgb(hex);
  const b = hexARgb(con);
  if (!a || !b) return normalizarHex(hex) ?? COLOR_MARCA_VACIO;
  const mezcla = (x: number, y: number) => x + (y - x) * t;
  return rgbAHex(mezcla(a[0], b[0]), mezcla(a[1], b[1]), mezcla(a[2], b[2]));
}

export function colorHover(marca: string): string {
  const origen = normalizarHex(marca) ?? COLOR_MARCA_VACIO;
  return luminanciaRelativa(origen) < 0.2
    ? mezclarHex(origen, "#ffffff", 0.16)
    : mezclarHex(origen, "#000000", 0.14);
}

export function colorPressed(marca: string): string {
  const origen = normalizarHex(marca) ?? COLOR_MARCA_VACIO;
  return luminanciaRelativa(origen) < 0.2
    ? mezclarHex(origen, "#ffffff", 0.28)
    : mezclarHex(origen, "#000000", 0.28);
}

/** Fondo oscuro derivado del color de marca, con un toque de la marca. */
export function fondoOscuro(marca: string): string {
  const origen = normalizarHex(marca) ?? COLOR_MARCA_VACIO;
  // Siempre se oscurece, aunque la marca ya sea oscura, para diferenciar el header del fondo.
  let actual = mezclarHex(origen, "#000000", 0.65);
  for (let i = 0; i < 6 && luminanciaRelativa(actual) > 0.06; i += 1) {
    actual = mezclarHex(actual, "#000000", 0.25);
  }
  return actual;
}

export function hexAHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexARgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hueARgb(p: number, q: number, t: number): number {
  let tono = t;
  if (tono < 0) tono += 1;
  if (tono > 1) tono -= 1;
  if (tono < 1 / 6) return p + (q - p) * 6 * tono;
  if (tono < 1 / 2) return q;
  if (tono < 2 / 3) return p + (q - p) * (2 / 3 - tono) * 6;
  return p;
}

export function hslAHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(1, s));
  const ll = Math.max(0, Math.min(1, l));
  if (ss === 0) {
    const v = Math.round(ll * 255);
    return rgbAHex(v, v, v);
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hk = hh / 360;
  const r = Math.round(hueARgb(p, q, hk + 1 / 3) * 255);
  const g = Math.round(hueARgb(p, q, hk) * 255);
  const b = Math.round(hueARgb(p, q, hk - 1 / 3) * 255);
  return rgbAHex(r, g, b);
}

/** Alternativas 2 y 3 cuando el usuario no las carga: se derivan del color principal. */
export function colorAlternativoDesdeMarca(
  marca: string,
  indice: 2 | 3,
): string {
  const origen = normalizarHex(marca) ?? COLOR_MARCA_VACIO;
  const hsl = hexAHsl(origen) ?? { h: 150, s: 0.25, l: 0.18 };
  const giro = indice === 2 ? 38 : 210;
  const s = Math.min(0.85, Math.max(0.35, hsl.s * 1.12 + 0.08));
  const l =
    indice === 2
      ? hsl.l < 0.4
        ? Math.min(0.55, hsl.l + 0.22)
        : Math.max(0.32, hsl.l - 0.08)
      : hsl.l < 0.45
        ? Math.min(0.5, hsl.l + 0.16)
        : Math.max(0.3, hsl.l - 0.12);
  return hslAHex(hsl.h + giro, s, l);
}

/** Ajusta un acento para que se lea sobre un fondo (objetivo ~3:1, piezas de UI). */
export function acentoVisible(color: string, fondo: string): string {
  const origen = normalizarHex(color) ?? COLOR_MARCA_VACIO;
  if (ratioContraste(origen, fondo) >= 3) return origen;
  const hacia = luminanciaRelativa(fondo) < 0.25 ? "#ffffff" : "#000000";
  let actual = origen;
  for (let i = 0; i < 6 && ratioContraste(actual, fondo) < 3; i += 1) {
    actual = mezclarHex(actual, hacia, 0.18);
  }
  return actual;
}

export type PaletaDerivada = {
  marca: string;
  claro: string;
  colores: [string, string, string];
  explicitos: [boolean, boolean, boolean];
  hover: string;
  pressed: string;
  oscuro: string;
  textoSobreMarca: "#ffffff" | "#000000";
  textoSobreClaro: "#ffffff" | "#000000";
  textoSobreOscuro: "#ffffff" | "#000000";
};

export function derivarPaleta(
  marca: string,
  claro: string,
  extras: Array<string | undefined> = [],
): PaletaDerivada {
  const marcaOk = normalizarHex(marca) ?? COLOR_MARCA_VACIO;
  const claroOk = normalizarHex(claro) ?? COLOR_CLARO_DEFAULT;
  const oscuro = fondoOscuro(marcaOk);
  const extra2 = normalizarHex(extras[0] ?? "");
  const extra3 = normalizarHex(extras[1] ?? "");
  const colores: [string, string, string] = [
    marcaOk,
    extra2 ?? colorAlternativoDesdeMarca(marcaOk, 2),
    extra3 ?? colorAlternativoDesdeMarca(marcaOk, 3),
  ];
  return {
    marca: marcaOk,
    claro: claroOk,
    colores,
    explicitos: [true, Boolean(extra2), Boolean(extra3)],
    hover: colorHover(marcaOk),
    pressed: colorPressed(marcaOk),
    oscuro,
    textoSobreMarca: textoConContrasteAA(marcaOk),
    textoSobreClaro: textoConContrasteAA(claroOk),
    textoSobreOscuro: textoConContrasteAA(oscuro),
  };
}

/**
 * Color de enlace o texto-sobre-claro a partir de la marca.
 * Si la marca no llega a AA (4,5:1) sobre el fondo, se oscurece o aclara
 * hasta cumplirlo. `#FF8C42` sobre blanco no alcanza: el enlace queda más oscuro.
 */
export function colorEnlace(marca: string, fondo: string): string {
  const origen = normalizarHex(marca) ?? COLOR_MARCA_VACIO;
  const fondoOk = normalizarHex(fondo) ?? COLOR_CLARO_DEFAULT;
  if (ratioContraste(origen, fondoOk) >= 4.5) return origen;
  const hacia = luminanciaRelativa(fondoOk) < 0.25 ? "#ffffff" : "#000000";
  let actual = origen;
  for (let i = 0; i < 12 && ratioContraste(actual, fondoOk) < 4.5; i += 1) {
    actual = mezclarHex(actual, hacia, 0.12);
  }
  return actual;
}
