import { describe, expect, it } from "vitest";
import { ratioContraste } from "@/dominio/paleta";
import {
  COLOR_PRODUCTO,
  paletaProducto,
  variablesCssTema,
} from "./tema";

describe("tema de producto", () => {
  it("usa el naranja del logo con texto oscuro que cumple AA", () => {
    expect(COLOR_PRODUCTO).toBe("#FF8C42");
    const vars = variablesCssTema(paletaProducto) as Record<string, string>;
    expect(vars["--primary"].toLowerCase()).toBe("#ff8c42");
    expect(
      ratioContraste(vars["--primary"], vars["--primary-foreground"]),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      ratioContraste(vars["--enlace"], vars["--card"]),
    ).toBeGreaterThanOrEqual(4.5);
    expect(ratioContraste("#ffffff", COLOR_PRODUCTO)).toBeLessThan(4.5);
  });
});
