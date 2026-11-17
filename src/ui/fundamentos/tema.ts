import type { CSSProperties } from "react";
import {
  colorEnlace,
  derivarPaleta,
  luminanciaRelativa,
  mezclarHex,
  type PaletaDerivada,
} from "@/dominio/paleta";

/** Naranja del logo de El Club App. Solo en superficies de producto. */
export const COLOR_PRODUCTO = "#FF8C42";
/** Fondo claro cálido de las superficies de producto. */
export const COLOR_PRODUCTO_CLARO = "#fffaf7";

export const paletaProducto: PaletaDerivada = derivarPaleta(
  COLOR_PRODUCTO,
  COLOR_PRODUCTO_CLARO,
);

function textoCuerpo(sobreClaro: "#ffffff" | "#000000"): string {
  return sobreClaro === "#ffffff" ? "#fafafa" : "#1c1917";
}

function enlaceSobreFondos(marca: string, fondos: string[]): string {
  const masClaro = fondos.reduce((a, b) =>
    luminanciaRelativa(a) >= luminanciaRelativa(b) ? a : b,
  );
  return colorEnlace(marca, masClaro);
}

/**
 * Variables CSS de shadcn/Tailwind a partir de una paleta derivada.
 * En producto se usa la paleta naranja; dentro de un club, la del club.
 */
export function variablesCssTema(paleta: PaletaDerivada): CSSProperties {
  const fondo = paleta.claro;
  const frente = textoCuerpo(paleta.textoSobreClaro);
  const tinta = mezclarHex(paleta.marca, fondo, 0.88);
  const borde = mezclarHex(frente, fondo, 0.88);
  const mutedFrente = mezclarHex(frente, fondo, 0.45);
  const superficie =
    paleta.textoSobreClaro === "#ffffff"
      ? mezclarHex(fondo, "#ffffff", 0.08)
      : "#ffffff";

  return {
    "--background": fondo,
    "--foreground": frente,
    "--card": superficie,
    "--card-foreground": frente,
    "--popover": superficie,
    "--popover-foreground": frente,
    "--primary": paleta.marca,
    "--primary-foreground":
      paleta.textoSobreMarca === "#ffffff" ? "#ffffff" : "#1c1917",
    "--primary-hover": paleta.hover,
    "--primary-active": paleta.pressed,
    "--secondary": tinta,
    "--secondary-foreground": frente,
    "--muted": tinta,
    "--muted-foreground": mutedFrente,
    "--accent": tinta,
    "--accent-foreground": frente,
    "--border": borde,
    "--input": borde,
    "--ring": paleta.marca,
    "--enlace": enlaceSobreFondos(paleta.marca, [superficie, fondo]),
    "--sidebar": superficie,
    "--sidebar-foreground": frente,
    "--sidebar-primary": paleta.marca,
    "--sidebar-primary-foreground":
      paleta.textoSobreMarca === "#ffffff" ? "#ffffff" : "#1c1917",
    "--sidebar-accent": tinta,
    "--sidebar-accent-foreground": frente,
    "--sidebar-border": borde,
    "--sidebar-ring": paleta.marca,
  } as CSSProperties;
}
