import { describe, expect, it } from "vitest";
import {
  COLOR_CLARO_DEFAULT,
  colorHover,
  colorPressed,
  derivarPaleta,
  esHexValido,
  fondoOscuro,
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
