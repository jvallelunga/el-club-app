import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLAVE_TIPO_OTRA,
  esClaveTipoInstalacion,
  medidasPorDefecto,
  TIPOS_INSTALACION,
  tipoInstalacion,
} from "./tipos-instalacion";

describe("tipos de instalación", () => {
  it("lista los tipos en el orden en que se ofrecen, con «Otra» al final", () => {
    expect(TIPOS_INSTALACION.map((tipo) => tipo.nombre)).toEqual([
      "Cancha de rugby",
      "Cancha de hockey",
      "Cancha de tenis",
      "Cancha de fútbol",
      "House",
      "Pileta",
      "Gym",
      "Vestuario",
      "Quincho",
      "Salón",
      "Otra",
    ]);
    expect(TIPOS_INSTALACION.at(-1)?.clave).toBe(CLAVE_TIPO_OTRA);
  });

  it("tiene claves únicas", () => {
    const claves = TIPOS_INSTALACION.map((tipo) => tipo.clave);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("cada tipo tiene forma y medidas con clave única y valor por defecto positivo", () => {
    for (const tipo of TIPOS_INSTALACION) {
      expect(tipo.forma).toBeTruthy();
      expect(tipo.medidas.length).toBeGreaterThan(0);
      const claves = tipo.medidas.map((medida) => medida.clave);
      expect(new Set(claves).size).toBe(claves.length);
      for (const medida of tipo.medidas) {
        expect(medida.etiqueta).toBeTruthy();
        expect(medida.porDefecto).toBeGreaterThan(0);
      }
    }
  });

  it("la cancha de rugby se configura con largo, ancho e in-goal", () => {
    expect(tipoInstalacion("cancha_rugby").medidas.map((m) => m.clave)).toEqual([
      "largo",
      "ancho",
      "ingoal",
    ]);
    expect(medidasPorDefecto("cancha_rugby")).toEqual({
      largo: 100,
      ancho: 70,
      ingoal: 10,
    });
  });

  it("las canchas y la pileta tienen largo y ancho; los edificios y «Otra», además alto", () => {
    for (const clave of ["cancha_hockey", "cancha_tenis", "cancha_futbol", "pileta"] as const) {
      expect(tipoInstalacion(clave).medidas.map((m) => m.clave)).toEqual(["largo", "ancho"]);
    }
    for (const clave of ["house", "vestuario", "quincho", "gym", "salon", "otra"] as const) {
      expect(tipoInstalacion(clave).medidas.map((m) => m.clave)).toEqual([
        "largo",
        "ancho",
        "alto",
      ]);
    }
  });

  it("«Otra» es un bloque genérico", () => {
    expect(tipoInstalacion(CLAVE_TIPO_OTRA)).toMatchObject({
      nombre: "Otra",
      forma: "bloque",
    });
  });

  it("reconoce solo las claves en código", () => {
    expect(esClaveTipoInstalacion("pileta")).toBe(true);
    expect(esClaveTipoInstalacion("otra")).toBe(true);
    expect(esClaveTipoInstalacion("Pileta")).toBe(false);
    expect(esClaveTipoInstalacion("cantina")).toBe(false);
    expect(esClaveTipoInstalacion("")).toBe(false);
  });

  it("coincide con las claves que acepta la base (instalacion_tipo_check)", () => {
    const carpeta = path.resolve(__dirname, "../../supabase/migrations");
    const ultimaConCheck = readdirSync(carpeta)
      .filter((archivo) => archivo.endsWith(".sql"))
      .sort()
      .map((archivo) => readFileSync(path.join(carpeta, archivo), "utf8"))
      .filter((sql) => sql.includes("add constraint instalacion_tipo_check"))
      .at(-1);
    expect(ultimaConCheck).toBeDefined();
    const check = ultimaConCheck!.slice(
      ultimaConCheck!.indexOf("add constraint instalacion_tipo_check"),
    );
    const inicio = check.indexOf("tipo in (") + "tipo in (".length;
    const lista = check.slice(inicio, check.indexOf(")", inicio));
    const claves = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(claves).toEqual(TIPOS_INSTALACION.map((tipo) => tipo.clave));
  });
});
