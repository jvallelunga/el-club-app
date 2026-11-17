import { describe, expect, it } from "vitest";
import { inicialesDesdeNombre, slugDesdeNombre } from "./slug";

describe("slugDesdeNombre", () => {
  it("arma un identificador en minúsculas, sin acentos", () => {
    expect(slugDesdeNombre("Club de Ejemplo del Norte")).toBe(
      "club-de-ejemplo-del-norte",
    );
    expect(slugDesdeNombre("  Club Ejemplo del Sur  ")).toBe("club-ejemplo-del-sur");
    expect(slugDesdeNombre("Ñandú Fútbol")).toBe("nandu-futbol");
  });

  it("saca signos y guiones de más", () => {
    expect(slugDesdeNombre("A -- B!! C")).toBe("a-b-c");
  });
});

describe("inicialesDesdeNombre", () => {
  it("toma hasta dos iniciales", () => {
    expect(inicialesDesdeNombre("Club Ejemplo")).toBe("CE");
    expect(inicialesDesdeNombre("Centro")).toBe("C");
  });
});
