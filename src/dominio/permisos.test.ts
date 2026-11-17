import { describe, expect, it } from "vitest";
import {
  destinoTrasIngreso,
  puedeAdministrarClub,
  siguienteSeguro,
  tieneAccesoApp,
  type SesionApp,
} from "./permisos";

const norte = {
  clubId: "club-norte",
  slug: "club-de-ejemplo-del-norte",
  nombre: "Club de ejemplo del Norte",
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
    expect(puedeAdministrarClub(superAdmin, "club-norte")).toBe(true);
  });

  it("deja al Admin entrar solo a su club", () => {
    const admin = sesion({ membresias: [norte] });
    expect(puedeAdministrarClub(admin, "club-norte")).toBe(true);
    expect(puedeAdministrarClub(admin, "club-ejemplo")).toBe(false);
  });

  it("niega el acceso si no hay rol", () => {
    expect(puedeAdministrarClub(sesion({}), "club-norte")).toBe(false);
  });
});

describe("destinoTrasIngreso", () => {
  it("manda al Super Admin a la lista de clubes", () => {
    expect(
      destinoTrasIngreso({ esSuperAdmin: true, clubes: [norte] }),
    ).toBe("/super-admin");
  });

  it("manda al Admin de un club directo a su admin", () => {
    expect(
      destinoTrasIngreso({ esSuperAdmin: false, clubes: [norte] }),
    ).toBe("/c/club-de-ejemplo-del-norte/admin");
  });

  it("manda a elegir club si es Admin de más de uno", () => {
    expect(
      destinoTrasIngreso({
        esSuperAdmin: false,
        clubes: [norte, ejemplo],
      }),
    ).toBe("/elegir-club");
  });

  it("manda a sin acceso si no tiene rol", () => {
    expect(destinoTrasIngreso({ esSuperAdmin: false, clubes: [] })).toBe(
      "/sin-acceso",
    );
  });

  it("ignora el destino siguiente si entró sin invitación", () => {
    expect(
      destinoTrasIngreso({
        esSuperAdmin: false,
        clubes: [],
        siguiente: "/super-admin/nuevo-club",
      }),
    ).toBe("/sin-acceso");
    expect(
      tieneAccesoApp({ esSuperAdmin: false, clubes: [] }),
    ).toBe(false);
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
    expect(siguienteSeguro("/c/club-de-ejemplo-del-norte/admin")).toBe(
      "/c/club-de-ejemplo-del-norte/admin",
    );
    expect(siguienteSeguro("https://evil.example/x")).toBe(null);
    expect(siguienteSeguro("//evil.example")).toBe(null);
    expect(siguienteSeguro("/ingreso")).toBe(null);
  });
});
