import { describe, expect, it } from "vitest";
import {
  destinoTrasIngreso,
  puedeAdministrarClub,
  siguienteSeguro,
  type SesionApp,
} from "./permisos";

const cardos = {
  clubId: "club-cardos",
  slug: "los-cardos",
  nombre: "Los Cardos Rugby Club",
  rol: "admin" as const,
};

const ejemplo = {
  clubId: "club-ejemplo",
  slug: "club-ejemplo-del-sur",
  nombre: "Club Ejemplo del Sur",
  rol: "admin" as const,
};

function sesion(parcial: Partial<SesionApp>): SesionApp {
  return {
    usuarioId: "u1",
    email: "persona@ejemplo.com",
    nombre: "Persona",
    esSuperAdmin: false,
    membresias: [],
    ...parcial,
  };
}

describe("puedeAdministrarClub", () => {
  it("deja al Super Admin entrar a cualquier club", () => {
    const superAdmin = sesion({ esSuperAdmin: true });
    expect(puedeAdministrarClub(superAdmin, "club-cardos")).toBe(true);
  });

  it("deja al Admin entrar solo a su club", () => {
    const admin = sesion({ membresias: [cardos] });
    expect(puedeAdministrarClub(admin, "club-cardos")).toBe(true);
    expect(puedeAdministrarClub(admin, "club-ejemplo")).toBe(false);
  });

  it("niega el acceso si no hay rol", () => {
    expect(puedeAdministrarClub(sesion({}), "club-cardos")).toBe(false);
  });
});

describe("destinoTrasIngreso", () => {
  it("manda al Super Admin a la lista de clubes", () => {
    expect(
      destinoTrasIngreso({ esSuperAdmin: true, clubes: [cardos] }),
    ).toBe("/super-admin");
  });

  it("manda al Admin de un club directo a su admin", () => {
    expect(
      destinoTrasIngreso({ esSuperAdmin: false, clubes: [cardos] }),
    ).toBe("/c/los-cardos/admin");
  });

  it("manda a elegir club si es Admin de más de uno", () => {
    expect(
      destinoTrasIngreso({
        esSuperAdmin: false,
        clubes: [cardos, ejemplo],
      }),
    ).toBe("/elegir-club");
  });

  it("manda a sin acceso si no tiene rol", () => {
    expect(destinoTrasIngreso({ esSuperAdmin: false, clubes: [] })).toBe(
      "/sin-acceso",
    );
  });

  it("respeta un destino siguiente seguro", () => {
    expect(
      destinoTrasIngreso({
        esSuperAdmin: true,
        clubes: [],
        siguiente: "/super-admin/nuevo-club",
      }),
    ).toBe("/super-admin/nuevo-club");
  });
});

describe("siguienteSeguro", () => {
  it("acepta solo rutas internas", () => {
    expect(siguienteSeguro("/c/los-cardos/admin")).toBe(
      "/c/los-cardos/admin",
    );
    expect(siguienteSeguro("https://evil.example/x")).toBe(null);
    expect(siguienteSeguro("//evil.example")).toBe(null);
    expect(siguienteSeguro("/ingreso")).toBe(null);
  });
});
