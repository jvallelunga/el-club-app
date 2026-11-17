import { describe, expect, it } from "vitest";
import {
  hostSuperficie,
  resolverHost,
  rutaFallbackClub,
  validarDominioBase,
} from "./host";

const PRODUCTO = [
  "localhost",
  "el-club-app-dev.vercel.app",
];

describe("resolverHost", () => {
  it("mapea un subdominio de superficie al club y a la superficie", () => {
    expect(resolverHost("admin.clubejemplo.com.ar", PRODUCTO)).toEqual({
      tipo: "superficie",
      superficie: "admin",
      dominioBase: "clubejemplo.com.ar",
    });
    expect(resolverHost("VIVO.ClubEjemplo.com.ar:443", PRODUCTO)).toEqual({
      tipo: "superficie",
      superficie: "vivo",
      dominioBase: "clubejemplo.com.ar",
    });
  });

  it("no toma el dominio raíz ni www como app: ese es el sitio del club", () => {
    expect(resolverHost("clubejemplo.com.ar", PRODUCTO)).toEqual({
      tipo: "sitio_o_desconocido",
    });
    expect(resolverHost("www.clubejemplo.com.ar", PRODUCTO)).toEqual({
      tipo: "sitio_o_desconocido",
    });
  });

  it("no interpreta un host de la app (Vercel, localhost) como club", () => {
    expect(resolverHost("localhost:3000", PRODUCTO)).toEqual({
      tipo: "producto",
    });
    expect(resolverHost("el-club-app-dev.vercel.app", PRODUCTO)).toEqual({
      tipo: "producto",
    });
    expect(
      resolverHost("admin.el-club-app-dev.vercel.app", PRODUCTO),
    ).toEqual({ tipo: "producto" });
  });

  it("deja como desconocida una superficie que todavía no existe", () => {
    expect(resolverHost("socios.clubejemplo.com.ar", PRODUCTO)).toEqual({
      tipo: "sitio_o_desconocido",
    });
  });
});

describe("rutas de fallback", () => {
  it("arma /c/<slug>/<superficie>", () => {
    expect(rutaFallbackClub("club-de-ejemplo", "admin")).toBe(
      "/c/club-de-ejemplo/admin",
    );
    expect(rutaFallbackClub("club-de-ejemplo", "vivo")).toBe("/c/club-de-ejemplo/vivo");
  });

  it("arma el host de una superficie a partir del dominio base", () => {
    expect(hostSuperficie("clubejemplo.com.ar", "admin")).toBe(
      "admin.clubejemplo.com.ar",
    );
  });
});

describe("validarDominioBase", () => {
  it("acepta vacío y un dominio en minúsculas, sin www", () => {
    expect(validarDominioBase("")).toBe(null);
    expect(validarDominioBase("  ")).toBe(null);
    expect(validarDominioBase("clubejemplo.com.ar")).toBe(null);
  });

  it("rechaza www, mayúsculas y un valor que no es un dominio", () => {
    expect(validarDominioBase("www.clubejemplo.com.ar")).toMatch(/www/);
    expect(validarDominioBase("ClubEjemplo.com.ar")).toMatch(/minúsculas/);
    expect(validarDominioBase("no es un dominio")).not.toBe(null);
  });
});
