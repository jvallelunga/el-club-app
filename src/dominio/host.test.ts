import { describe, expect, it } from "vitest";
import {
  hostSuperficie,
  resolverHost,
  rutaFallbackClub,
} from "./host";

const PRODUCTO = [
  "localhost",
  "el-club-app-dev.vercel.app",
];

describe("resolverHost", () => {
  it("mapea un subdominio de superficie al club y a la superficie", () => {
    expect(resolverHost("admin.loscardosrc.com.ar", PRODUCTO)).toEqual({
      tipo: "superficie",
      superficie: "admin",
      dominioBase: "loscardosrc.com.ar",
    });
    expect(resolverHost("VIVO.LosCardosRC.com.ar:443", PRODUCTO)).toEqual({
      tipo: "superficie",
      superficie: "vivo",
      dominioBase: "loscardosrc.com.ar",
    });
  });

  it("no toma el dominio raíz ni www como app: ese es el sitio del club", () => {
    expect(resolverHost("loscardosrc.com.ar", PRODUCTO)).toEqual({
      tipo: "sitio_o_desconocido",
    });
    expect(resolverHost("www.loscardosrc.com.ar", PRODUCTO)).toEqual({
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
    expect(resolverHost("socios.loscardosrc.com.ar", PRODUCTO)).toEqual({
      tipo: "sitio_o_desconocido",
    });
  });
});

describe("rutas de fallback", () => {
  it("arma /c/<slug>/<superficie>", () => {
    expect(rutaFallbackClub("los-cardos", "admin")).toBe(
      "/c/los-cardos/admin",
    );
    expect(rutaFallbackClub("los-cardos", "vivo")).toBe("/c/los-cardos/vivo");
  });

  it("arma el host de una superficie a partir del dominio base", () => {
    expect(hostSuperficie("loscardosrc.com.ar", "admin")).toBe(
      "admin.loscardosrc.com.ar",
    );
  });
});
