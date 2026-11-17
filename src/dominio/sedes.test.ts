import { describe, expect, it } from "vitest";
import {
  eligeTipoPropio,
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
  it("exige nombre y, si elige Otra, el nombre del tipo", () => {
    expect(
      validarInstalacion({
        tipoId: "abc",
        tipoPropio: "",
        nombre: "",
        notas: "",
      }).nombre,
    ).toBeTruthy();
    expect(
      validarInstalacion({
        tipoId: "otra",
        tipoPropio: "",
        nombre: "Cancha 1",
        notas: "",
      }).tipo,
    ).toBeTruthy();
    expect(
      validarInstalacion({
        tipoId: "tipo-otra-id",
        tipoPropio: "",
        nombre: "Cancha 1",
        notas: "",
        tipoOtraId: "tipo-otra-id",
      }).tipo,
    ).toBeTruthy();
    expect(
      validarInstalacion({
        tipoId: "otra",
        tipoPropio: "Cantina",
        nombre: "Cantina",
        notas: "",
      }),
    ).toEqual({});
  });

  it("marca creaTipoPropio cuando se elige Otra", () => {
    expect(eligeTipoPropio("otra")).toBe(true);
    const guardado = instalacionParaGuardar({
      tipoId: "otra",
      tipoPropio: "  Cantina  ",
      nombre: "  Cantina principal  ",
      notas: "  ",
    });
    expect(guardado).toEqual({
      nombre: "Cantina principal",
      notas: null,
      tipoPropio: "Cantina",
      creaTipoPropio: true,
    });
  });
});
