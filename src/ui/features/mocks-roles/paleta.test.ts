import { describe, expect, it } from "vitest";
import {
  COLOR_CLARO_DEFAULT,
  acentoVisible,
  colorAlternativoDesdeMarca,
  colorHover,
  colorPressed,
  derivarPaleta,
  esHexValido,
  fondoOscuro,
  hexAHsl,
  hslAHex,
  luminanciaRelativa,
  normalizarHex,
  ratioContraste,
  textoConContrasteAA,
} from "./paleta";

describe("normalizarHex", () => {
  it("acepta #RGB y #RRGGBB", () => {
    expect(normalizarHex("#1f4b3a")).toBe("#1f4b3a");
    expect(normalizarHex("1F4B3A")).toBe("#1f4b3a");
    expect(normalizarHex("#fff")).toBe("#ffffff");
    expect(esHexValido("no")).toBe(false);
  });
});

describe("contraste AA", () => {
  it("elige blanco sobre un verde oscuro y negro sobre blanco", () => {
    expect(textoConContrasteAA("#1f4b3a")).toBe("#ffffff");
    expect(textoConContrasteAA(COLOR_CLARO_DEFAULT)).toBe("#000000");
    expect(ratioContraste("#1f4b3a", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratioContraste("#ffffff", "#000000")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("derivados", () => {
  it("arma hover, pressed y un fondo más oscuro que la marca", () => {
    const paleta = derivarPaleta("#1f4b3a", "#ffffff");
    expect(paleta.hover).not.toBe(paleta.marca);
    expect(paleta.pressed).not.toBe(paleta.marca);
    expect(luminanciaRelativa(paleta.oscuro)).toBeLessThan(
      luminanciaRelativa(paleta.marca),
    );
    expect(luminanciaRelativa(fondoOscuro("#1f4b3a"))).toBeLessThanOrEqual(0.08);
    expect(colorHover("#1f4b3a")).toBe(paleta.hover);
    expect(colorPressed("#1f4b3a")).toBe(paleta.pressed);
    expect(ratioContraste(paleta.marca, paleta.textoSobreMarca)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

describe("paleta de hasta 4 colores", () => {
  it("deriva 2, 3 y 4 desde el principal si no se cargan", () => {
    const paleta = derivarPaleta("#1f4b3a", "#ffffff");
    expect(paleta.colores[0]).toBe("#1f4b3a");
    expect(paleta.explicitos).toEqual([true, false, false, false]);
    expect(new Set(paleta.colores).size).toBe(4);
    expect(paleta.colores[1]).toBe(colorAlternativoDesdeMarca("#1f4b3a", 2));
  });

  it("respeta los colores opcionales que sí se cargaron", () => {
    const paleta = derivarPaleta("#1f4b3a", "#ffffff", ["#c47a2c", "", "#6a4a78"]);
    expect(paleta.colores[1]).toBe("#c47a2c");
    expect(paleta.colores[3]).toBe("#6a4a78");
    expect(paleta.explicitos).toEqual([true, true, false, true]);
    expect(paleta.colores[2]).toBe(colorAlternativoDesdeMarca("#1f4b3a", 3));
  });

  it("ajusta un acento para que se lea sobre un fondo oscuro", () => {
    const visible = acentoVisible("#1f4b3a", "#0a0a0a");
    expect(ratioContraste(visible, "#0a0a0a")).toBeGreaterThanOrEqual(3);
    expect(hslAHex(0, 0, 1)).toBe("#ffffff");
    expect(hexAHsl("#ffffff")?.l).toBeCloseTo(1, 2);
  });
});
