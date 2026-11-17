import { describe, expect, it } from "vitest";
import {
  contactoParaGuardar,
  esIdRedSocial,
  etiquetaRed,
  normalizarWeb,
  validarContacto,
  webValida,
} from "./contacto";

describe("validarContacto", () => {
  it("acepta todo vacío", () => {
    expect(
      validarContacto({
        telefono: "",
        email: "",
        direccion: "",
        web: "",
        redes: [],
      }),
    ).toEqual({});
  });

  it("rechaza un email inválido y una web sin dominio", () => {
    const errores = validarContacto({
      telefono: "",
      email: "no-es-un-email",
      direccion: "",
      web: "hola",
      redes: [],
    });
    expect(errores.email).toBeTruthy();
    expect(errores.web).toBeTruthy();
  });

  it("pide nombre cuando la red es otra", () => {
    const errores = validarContacto({
      telefono: "",
      email: "",
      direccion: "",
      web: "",
      redes: [{ red: "otra", valor: "https://video.ejemplo.com/club", etiqueta: "" }],
    });
    expect(errores.redes).toMatch(/Otra/);
  });

  it("normaliza email, web y el orden de las redes", () => {
    const guardado = contactoParaGuardar({
      telefono: "  +54 11 4000-1200  ",
      email: "  Contacto@ClubEjemplo.com.ar ",
      direccion: " Av. de los Clubes 1200 ",
      web: "www.clubejemplo.com.ar",
      redes: [
        { red: "instagram", valor: "@clubdeejemplo" },
        { red: "otra", valor: "  https://video.ejemplo.com/club  ", etiqueta: "Canal de videos" },
        { red: "facebook", valor: "   " },
      ],
    });
    expect(guardado.email).toBe("contacto@clubejemplo.com.ar");
    expect(guardado.web).toBe("https://www.clubejemplo.com.ar");
    expect(guardado.redes).toEqual([
      { red: "instagram", etiqueta: null, valor: "@clubdeejemplo", orden: 0 },
      {
        red: "otra",
        etiqueta: "Canal de videos",
        valor: "https://video.ejemplo.com/club",
        orden: 1,
      },
    ]);
  });
});

describe("web y redes", () => {
  it("acepta un link https y un dominio suelto", () => {
    expect(webValida("https://www.clubejemplo.com.ar")).toBe(true);
    expect(webValida("www.clubejemplo.com.ar")).toBe(true);
    expect(webValida("nope")).toBe(false);
    expect(normalizarWeb("")).toBeNull();
  });

  it("reconoce las redes de la lista", () => {
    expect(esIdRedSocial("instagram")).toBe(true);
    expect(esIdRedSocial("otra")).toBe(true);
    expect(esIdRedSocial("snapchat")).toBe(false);
    expect(etiquetaRed({ red: "otra", etiqueta: "Canal de videos", valor: "x" })).toBe(
      "Canal de videos",
    );
  });
});
