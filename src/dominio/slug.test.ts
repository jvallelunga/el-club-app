import { describe, expect, it } from "vitest";
import { inicialesDesdeNombre, slugDesdeNombre } from "./slug";

describe("slugDesdeNombre", () => {
  it("arma un identificador en minúsculas, sin acentos", () => {
    expect(slugDesdeNombre("Los Cardos Rugby Club")).toBe("los-cardos-rugby-club");
    expect(slugDesdeNombre("  Club Ejemplo del Sur  ")).toBe("club-ejemplo-del-sur");
    expect(slugDesdeNombre("Ñandú Fútbol")).toBe("nandu-futbol");
  });

  it("saca signos y guiones de más", () => {
    expect(slugDesdeNombre("A -- B!! C")).toBe("a-b-c");
  });
});

describe("inicialesDesdeNombre", () => {
  it("toma hasta dos iniciales", () => {
    expect(inicialesDesdeNombre("Los Cardos Rugby Club")).toBe("LC");
    expect(inicialesDesdeNombre("Tandil")).toBe("T");
  });
});
