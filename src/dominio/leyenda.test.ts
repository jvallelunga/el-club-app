import { describe, expect, it } from "vitest";
import {
  cambiarEnLeyenda,
  DESCRIPCION_MAXIMA,
  descripcionLimpia,
  errorDeDescripcion,
  moverEnLeyenda,
  numerosDeLeyenda,
} from "./leyenda";

const elemento = (instalacionId: string, ordenLeyenda: number | null) => ({
  instalacionId,
  ordenLeyenda,
});

describe("numerosDeLeyenda", () => {
  it("numera de 1 en adelante según el orden de la leyenda, no según la lista", () => {
    const numeros = numerosDeLeyenda([
      elemento("pileta", 2),
      elemento("cancha", 1),
      elemento("house", 3),
    ]);
    expect([...numeros]).toEqual([
      ["cancha", 1],
      ["pileta", 2],
      ["house", 3],
    ]);
  });

  it("lo que no entra en la leyenda no lleva número", () => {
    const numeros = numerosDeLeyenda([elemento("cancha", 1), elemento("quincho", null)]);
    expect(numeros.has("quincho")).toBe(false);
    expect(numeros.get("cancha")).toBe(1);
  });

  it("si el orden tiene huecos (se quitó algo), los números siguen corridos", () => {
    const numeros = numerosDeLeyenda([elemento("cancha", 1), elemento("pileta", 4), elemento("house", 7)]);
    expect([...numeros.values()]).toEqual([1, 2, 3]);
    expect(numeros.get("house")).toBe(3);
  });

  it("sin nada en la leyenda, no hay números", () => {
    expect(numerosDeLeyenda([elemento("cancha", null)]).size).toBe(0);
  });
});

const numeros = (elementos: { instalacionId: string; ordenLeyenda: number | null }[]) =>
  Object.fromEntries(numerosDeLeyenda(elementos));

describe("cambiarEnLeyenda", () => {
  const predio = [elemento("cancha", 1), elemento("quincho", null), elemento("pileta", 2)];

  it("lo que entra va al final de la leyenda", () => {
    expect(numeros(cambiarEnLeyenda(predio, "quincho", true))).toEqual({
      cancha: 1,
      pileta: 2,
      quincho: 3,
    });
  });

  it("lo que sale deja de tener número y los que siguen suben uno", () => {
    expect(numeros(cambiarEnLeyenda(predio, "cancha", false))).toEqual({ pileta: 1 });
  });

  it("deja el orden corrido, de 1 en adelante, y no toca la lista original", () => {
    const conHuecos = [elemento("cancha", 3), elemento("pileta", 8), elemento("quincho", null)];
    expect(cambiarEnLeyenda(conHuecos, "quincho", true)).toEqual([
      elemento("cancha", 1),
      elemento("pileta", 2),
      elemento("quincho", 3),
    ]);
    expect(conHuecos[0].ordenLeyenda).toBe(3);
  });

  it("poner lo que ya está no lo mueve", () => {
    expect(numeros(cambiarEnLeyenda(predio, "cancha", true))).toEqual({ cancha: 1, pileta: 2 });
  });
});

describe("moverEnLeyenda", () => {
  const predio = [
    elemento("cancha", 1),
    elemento("pileta", 2),
    elemento("quincho", null),
    elemento("house", 3),
  ];

  it("subir cambia el lugar con el de arriba", () => {
    expect(numeros(moverEnLeyenda(predio, "house", -1))).toEqual({ cancha: 1, house: 2, pileta: 3 });
  });

  it("bajar cambia el lugar con el de abajo, salteando lo que no está en la leyenda", () => {
    expect(numeros(moverEnLeyenda(predio, "pileta", 1))).toEqual({ cancha: 1, house: 2, pileta: 3 });
  });

  it("el primero no sube, el último no baja y lo que no está en la leyenda no se mueve", () => {
    expect(numeros(moverEnLeyenda(predio, "cancha", -1))).toEqual(numeros(predio));
    expect(numeros(moverEnLeyenda(predio, "house", 1))).toEqual(numeros(predio));
    expect(numeros(moverEnLeyenda(predio, "quincho", -1))).toEqual(numeros(predio));
  });
});

describe("descripcionLimpia", () => {
  it("es texto sin formato: junta espacios y saltos de línea, y recorta las puntas", () => {
    expect(descripcionLimpia("  La cancha principal,\n\ndonde juega   el Plantel Superior. ")).toBe(
      "La cancha principal, donde juega el Plantel Superior.",
    );
  });

  it("vacía o solo con espacios es no tener descripción", () => {
    expect(descripcionLimpia("")).toBeNull();
    expect(descripcionLimpia(" \n ")).toBeNull();
    expect(descripcionLimpia(null)).toBeNull();
  });
});

describe("errorDeDescripcion", () => {
  it("el tope es de 280 caracteres", () => {
    expect(DESCRIPCION_MAXIMA).toBe(280);
    expect(errorDeDescripcion("a".repeat(280))).toBeNull();
    expect(errorDeDescripcion("a".repeat(281))).toMatch(/280/);
  });

  it("cuenta lo que queda después de limpiarla", () => {
    expect(errorDeDescripcion(`${"a".repeat(280)}    `)).toBeNull();
  });

  it("un emoji cuenta como un caracter, igual que en la base", () => {
    expect(errorDeDescripcion("🌳".repeat(280))).toBeNull();
  });

  it("acepta no tener descripción y rechaza lo que no es texto", () => {
    expect(errorDeDescripcion(null)).toBeNull();
    expect(errorDeDescripcion(42)).toMatch(/descripción/);
  });
});
