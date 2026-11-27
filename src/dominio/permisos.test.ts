import { describe, expect, it } from "vitest";
import {
  destinoTrasIngreso,
  errorAlQuitarAdmin,
  errorSiNoPuedeEliminarClub,
  errorSiNoPuedeAdministrarAdmins,
  errorSiNoPuedeAdministrarDeportes,
  errorSiNoPuedeEditarClub,
  errorSiNoPuedeElegirDeportesDelClub,
  errorSiNoPuedeEditarPredio,
  puedeAdministrarClub,
  puedeEditarRutasDelClub,
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

describe("errorSiNoPuedeAdministrarAdmins", () => {
  it("permite al Super Admin y al Admin de ese club, no al de otro", () => {
    expect(
      errorSiNoPuedeAdministrarAdmins(sesion({ esSuperAdmin: true }), "club-norte"),
    ).toBeNull();
    expect(
      errorSiNoPuedeAdministrarAdmins(sesion({ membresias: [norte] }), "club-norte"),
    ).toBeNull();
    expect(
      errorSiNoPuedeAdministrarAdmins(sesion({ membresias: [norte] }), "club-ejemplo"),
    ).toMatch(/permiso/);
    expect(errorSiNoPuedeAdministrarAdmins(null, "club-norte")).toMatch(/ingresar/);
  });
});

describe("errorAlQuitarAdmin", () => {
  it("un Admin puede quitar a otro Admin, aunque sea el último que queda además de él", () => {
    expect(
      errorAlQuitarAdmin({ actorUsuarioId: "u1", objetivoUsuarioId: "u2", esSuperAdmin: false }),
    ).toBeNull();
  });

  it("un Admin no se puede quitar a sí mismo", () => {
    expect(
      errorAlQuitarAdmin({ actorUsuarioId: "u1", objetivoUsuarioId: "u1", esSuperAdmin: false }),
    ).toBe("No te podés quitar a vos mismo.");
  });

  it("el Super Admin puede quitar a cualquier Admin, también si es el último", () => {
    expect(
      errorAlQuitarAdmin({ actorUsuarioId: "super", objetivoUsuarioId: "u1", esSuperAdmin: true }),
    ).toBeNull();
    expect(
      errorAlQuitarAdmin({ actorUsuarioId: "super", objetivoUsuarioId: "super", esSuperAdmin: true }),
    ).toBeNull();
  });
});

describe("errorSiNoPuedeEditarClub", () => {
  it("permite al Super Admin y al Admin de ese club, no al de otro", () => {
    expect(
      errorSiNoPuedeEditarClub(sesion({ esSuperAdmin: true }), "club-norte"),
    ).toBeNull();
    expect(
      errorSiNoPuedeEditarClub(sesion({ membresias: [norte] }), "club-norte"),
    ).toBeNull();
    expect(
      errorSiNoPuedeEditarClub(sesion({ membresias: [norte] }), "club-ejemplo"),
    ).toMatch(/permiso/);
    expect(errorSiNoPuedeEditarClub(null, "club-norte")).toMatch(/ingresar/);
  });
});

describe("puedeEditarRutasDelClub", () => {
  it("solo el Super Admin puede cambiar identificador o dominio", () => {
    expect(puedeEditarRutasDelClub(sesion({ esSuperAdmin: true }))).toBe(true);
    expect(puedeEditarRutasDelClub(sesion({ membresias: [norte] }))).toBe(false);
  });
});

describe("errorSiNoPuedeEditarPredio", () => {
  it("solo el Super Admin edita el predio", () => {
    expect(errorSiNoPuedeEditarPredio(sesion({ esSuperAdmin: true }))).toBeNull();
  });

  it("un Admin del club no lo edita", () => {
    expect(errorSiNoPuedeEditarPredio(sesion({ membresias: [norte] }))).toMatch(/Super Admin/);
  });

  it("sin sesión pide ingresar", () => {
    expect(errorSiNoPuedeEditarPredio(null)).toMatch(/ingresar/);
  });
});

describe("errorSiNoPuedeAdministrarDeportes", () => {
  it("solo el Super Admin administra el catálogo", () => {
    expect(errorSiNoPuedeAdministrarDeportes(sesion({ esSuperAdmin: true }))).toBeNull();
  });

  it("un Admin de un club no lo administra", () => {
    expect(errorSiNoPuedeAdministrarDeportes(sesion({ membresias: [norte] }))).toMatch(
      /Super Admin/,
    );
  });

  it("sin sesión pide ingresar", () => {
    expect(errorSiNoPuedeAdministrarDeportes(null)).toMatch(/ingresar/);
  });
});

describe("errorSiNoPuedeElegirDeportesDelClub", () => {
  it("el Admin del club y el Super Admin eligen los deportes", () => {
    expect(errorSiNoPuedeElegirDeportesDelClub(sesion({ membresias: [norte] }), norte.clubId)).toBeNull();
    expect(errorSiNoPuedeElegirDeportesDelClub(sesion({ esSuperAdmin: true }), norte.clubId)).toBeNull();
  });

  it("el Admin de otro club no", () => {
    expect(
      errorSiNoPuedeElegirDeportesDelClub(sesion({ membresias: [norte] }), "otro-club"),
    ).toMatch(/permiso/);
  });

  it("sin sesión pide ingresar", () => {
    expect(errorSiNoPuedeElegirDeportesDelClub(null, norte.clubId)).toMatch(/ingresar/);
  });
});

describe("errorSiNoPuedeEliminarClub", () => {
  it("solo el Super Admin elimina o restaura un club", () => {
    expect(errorSiNoPuedeEliminarClub(sesion({ esSuperAdmin: true }))).toBeNull();
    expect(errorSiNoPuedeEliminarClub(sesion({ membresias: [norte] }))).toBe(
      "Solo el Super Admin puede eliminar o restaurar un club.",
    );
    expect(errorSiNoPuedeEliminarClub(null)).toMatch(/ingresar/);
  });
});
