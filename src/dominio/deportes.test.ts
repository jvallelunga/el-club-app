import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  deporteParaGuardar,
  esClaveIconoDeporte,
  ICONO_DEPORTE_POR_DEFECTO,
  ICONOS_DEPORTE,
  separarBorrados,
  textoClubes,
  validarDeporte,
  type Deporte,
} from "./deportes";

describe("íconos de deporte", () => {
  it("tiene claves únicas y el ícono por defecto es una de ellas", () => {
    const claves = ICONOS_DEPORTE.map((icono) => icono.clave);
    expect(new Set(claves).size).toBe(claves.length);
    expect(esClaveIconoDeporte(ICONO_DEPORTE_POR_DEFECTO)).toBe(true);
  });

  it("reconoce solo las claves del set", () => {
    expect(esClaveIconoDeporte("rugby")).toBe(true);
    expect(esClaveIconoDeporte("Rugby")).toBe(false);
    expect(esClaveIconoDeporte("pelota")).toBe(false);
  });

  it("coincide con la lista que acepta la base (deporte_icono_check)", () => {
    const carpeta = path.resolve(__dirname, "../../supabase/migrations");
    const ultimaConCheck = readdirSync(carpeta)
      .filter((archivo) => archivo.endsWith(".sql"))
      .sort()
      .map((archivo) => readFileSync(path.join(carpeta, archivo), "utf8"))
      .filter((sql) => sql.includes("add constraint deporte_icono_check"))
      .at(-1);
    expect(ultimaConCheck).toBeDefined();
    const check = ultimaConCheck!.slice(
      ultimaConCheck!.indexOf("add constraint deporte_icono_check"),
    );
    const inicio = check.indexOf("icono in (") + "icono in (".length;
    const lista = check.slice(inicio, check.indexOf(")", inicio));
    const claves = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(claves).toEqual(ICONOS_DEPORTE.map((icono) => icono.clave));
  });
});

describe("validarDeporte", () => {
  const valido = { nombre: "Rugby masculino", icono: "rugby", descripcion: "" };

  it("acepta un deporte con nombre e ícono, sin descripción", () => {
    expect(validarDeporte(valido)).toEqual({});
  });

  it("pide el nombre", () => {
    expect(validarDeporte({ ...valido, nombre: "   " }).nombre).toBeTruthy();
  });

  it("limita el nombre a 60 caracteres y la descripción a 280", () => {
    expect(validarDeporte({ ...valido, nombre: "a".repeat(60) })).toEqual({});
    expect(validarDeporte({ ...valido, nombre: "a".repeat(61) }).nombre).toBeTruthy();
    expect(validarDeporte({ ...valido, descripcion: "a".repeat(280) })).toEqual({});
    expect(
      validarDeporte({ ...valido, descripcion: "a".repeat(281) }).descripcion,
    ).toBeTruthy();
  });

  it("pide un ícono del set", () => {
    expect(validarDeporte({ ...valido, icono: "pelota" }).icono).toBeTruthy();
  });
});

describe("deporteParaGuardar", () => {
  it("recorta el nombre y deja la descripción vacía en null", () => {
    expect(
      deporteParaGuardar({ nombre: "  Hockey  ", icono: "hockey", descripcion: "  " }),
    ).toEqual({ nombre: "Hockey", icono: "hockey", descripcion: null });
  });

  it("no acepta un ícono fuera del set", () => {
    expect(() =>
      deporteParaGuardar({ nombre: "Hockey", icono: "pelota", descripcion: "" }),
    ).toThrow();
  });
});

describe("textoClubes", () => {
  it("usa singular para uno", () => {
    expect(textoClubes(0)).toBe("0 clubes");
    expect(textoClubes(1)).toBe("1 club");
    expect(textoClubes(3)).toBe("3 clubes");
  });
});

describe("separarBorrados", () => {
  const deporte = (nombre: string, borradoEn: string | null = null): Deporte => ({
    id: nombre,
    nombre,
    icono: "trofeo",
    descripcion: "",
    borradoEn,
  });

  it("separa los borrados y ordena cada grupo por nombre, sin importar acentos ni mayúsculas", () => {
    const { activos, borrados } = separarBorrados([
      deporte("Vóley"),
      deporte("rugby"),
      deporte("Hockey", "2026-11-19T12:00:00Z"),
      deporte("Atletismo"),
      deporte("Básquet", "2026-11-18T12:00:00Z"),
    ]);
    expect(activos.map((d) => d.nombre)).toEqual(["Atletismo", "rugby", "Vóley"]);
    expect(borrados.map((d) => d.nombre)).toEqual(["Básquet", "Hockey"]);
  });
});
