/** Utilidades de paleta para el mock de crear club. No es la implementación real. */

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

export type PaletaDerivada = {
  marca: string;
  claro: string;
  hover: string;
  pressed: string;
  oscuro: string;
  textoSobreMarca: "#ffffff" | "#000000";
  textoSobreClaro: "#ffffff" | "#000000";
  textoSobreOscuro: "#ffffff" | "#000000";
};

export function derivarPaleta(marca: string, claro: string): PaletaDerivada {
  const marcaOk = normalizarHex(marca) ?? COLOR_MARCA_VACIO;
  const claroOk = normalizarHex(claro) ?? COLOR_CLARO_DEFAULT;
  const oscuro = fondoOscuro(marcaOk);
  return {
    marca: marcaOk,
    claro: claroOk,
    hover: colorHover(marcaOk),
    pressed: colorPressed(marcaOk),
    oscuro,
    textoSobreMarca: textoConContrasteAA(marcaOk),
    textoSobreClaro: textoConContrasteAA(claroOk),
    textoSobreOscuro: textoConContrasteAA(oscuro),
  };
}
