import { describe, expect, it } from "vitest";
import {
  instalacionParaGuardar,
  sedeParaGuardar,
  validarInstalacion,
  validarSede,
} from "./sedes";

describe("validarSede", () => {
  it("exige un nombre y deja el resto opcional", () => {
    expect(validarSede({ nombre: "  ", direccion: "", mapsUrl: "" }).nombre).toBeTruthy();
    expect(validarSede({ nombre: "Campo de deportes", direccion: "", mapsUrl: "" })).toEqual(
      {},
    );
  });

  it("recorta y convierte vacíos en null", () => {
    expect(
      sedeParaGuardar({
        nombre: "  Campo de deportes  ",
        direccion: "  ",
        mapsUrl: " https://www.google.com/maps/@-34.6,-58.4,16z ",
      }),
    ).toEqual({
      nombre: "Campo de deportes",
      direccion: null,
      maps_url: "https://www.google.com/maps/@-34.6,-58.4,16z",
    });
  });
});

describe("validarInstalacion", () => {
  it("exige un nombre", () => {
    expect(
      validarInstalacion({ tipo: "cancha_rugby", nombre: "  ", notas: "" }).nombre,
    ).toBeTruthy();
  });

  it("exige un tipo de la lista en código", () => {
    expect(validarInstalacion({ tipo: "", nombre: "Cancha 1", notas: "" }).tipo).toBeTruthy();
    expect(
      validarInstalacion({ tipo: "cantina", nombre: "Cantina", notas: "" }).tipo,
    ).toBeTruthy();
    expect(validarInstalacion({ tipo: "otra", nombre: "Cantina", notas: "" })).toEqual({});
  });
});

describe("instalacionParaGuardar", () => {
  it("recorta y convierte las notas vacías en null", () => {
    expect(
      instalacionParaGuardar({
        tipo: "otra",
        nombre: "  Cantina principal  ",
        notas: "  ",
      }),
    ).toEqual({ tipo: "otra", nombre: "Cantina principal", notas: null });
  });
});
