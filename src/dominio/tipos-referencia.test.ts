import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  esClaveTipoReferencia,
  medidasPorDefectoDeReferencia,
  TIPOS_REFERENCIA,
  tipoReferencia,
} from "./tipos-referencia";

const claves = (clave: Parameters<typeof tipoReferencia>[0]) =>
  tipoReferencia(clave).medidas.map((m) => m.clave);

describe("tipos de elemento de referencia", () => {
  it("son árbol, piedra, bebedero, gradas y tribuna, en ese orden", () => {
    expect(TIPOS_REFERENCIA.map((t) => t.nombre)).toEqual([
      "Árbol",
      "Piedra",
      "Bebedero",
      "Gradas",
      "Tribuna",
    ]);
  });

  it("caminos y vallas no van acá: se dibujan punto a punto (#47)", () => {
    expect(esClaveTipoReferencia("camino")).toBe(false);
    expect(esClaveTipoReferencia("valla")).toBe(false);
    expect(esClaveTipoReferencia("arbol")).toBe(true);
  });

  it("el árbol se configura con altura y diámetro de copa", () => {
    expect(claves("arbol")).toEqual(["alto", "copa"]);
    expect(tipoReferencia("arbol").medidas.map((m) => m.etiqueta)).toEqual([
      "Altura",
      "Diámetro de copa",
    ]);
    expect(medidasPorDefectoDeReferencia("arbol")).toEqual({ alto: 10, copa: 7 });
  });

  it("la piedra, con diámetro y alto", () => {
    expect(medidasPorDefectoDeReferencia("piedra")).toEqual({ diametro: 1.5, alto: 1 });
  });

  it("el bebedero, con largo, ancho y alto", () => {
    expect(medidasPorDefectoDeReferencia("bebedero")).toEqual({ largo: 1, ancho: 0.5, alto: 1 });
  });

  it("gradas y tribuna tienen las mismas medidas: largo, ancho y alto", () => {
    expect(claves("gradas")).toEqual(["largo", "ancho", "alto"]);
    expect(claves("tribuna")).toEqual(claves("gradas"));
    expect(medidasPorDefectoDeReferencia("gradas")).toEqual({ largo: 20, ancho: 4, alto: 2 });
    expect(medidasPorDefectoDeReferencia("tribuna")).toEqual({ largo: 30, ancho: 6, alto: 3 });
  });

  it("cada medida por defecto está entre 0,5 y 300 m (lo que acepta la base)", () => {
    for (const tipo of TIPOS_REFERENCIA) {
      for (const medida of tipo.medidas) {
        expect(medida.porDefecto).toBeGreaterThanOrEqual(0.5);
        expect(medida.porDefecto).toBeLessThanOrEqual(300);
      }
    }
  });

  it("la última migración acepta en la base las mismas claves que el código", () => {
    const carpeta = path.join(__dirname, "../../supabase/migrations");
    const ultima = readdirSync(carpeta)
      .filter((archivo) => readFileSync(path.join(carpeta, archivo), "utf8").includes("elemento_predio_tipo_referencia_check"))
      .sort()
      .at(-1)!;
    const sql = readFileSync(path.join(carpeta, ultima), "utf8");
    const lista = sql.match(/tipo_referencia in \(([^)]*)\)/)![1];
    const enLaBase = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(enLaBase).toEqual(TIPOS_REFERENCIA.map((t) => t.clave));
  });
});
