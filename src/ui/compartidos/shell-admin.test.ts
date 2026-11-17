import { describe, expect, it } from "vitest";
import { itemsNav, RUTAS_SHELL_APP } from "./shell-admin";

const CLUB = {
  slug: "club-de-ejemplo-del-norte",
  nombre: "Club de ejemplo del Norte",
  iniciales: "EN",
};

describe("itemsNav", () => {
  it("en Super Admin sin club solo muestra Clubes", () => {
    expect(
      itemsNav({
        rol: "super-admin",
        activo: "clubes",
        rutas: RUTAS_SHELL_APP,
      }),
    ).toEqual([
      { etiqueta: "Clubes", href: "/super-admin", activo: true },
    ]);
  });

  it("en Super Admin dentro de un club muestra Inicio, Clubes, Club, Sedes y Admins", () => {
    expect(
      itemsNav({
        club: CLUB,
        rol: "super-admin",
        activo: "inicio",
        rutas: RUTAS_SHELL_APP,
      }),
    ).toEqual([
      {
        etiqueta: "Inicio",
        href: "/c/club-de-ejemplo-del-norte/admin",
        activo: true,
      },
      { etiqueta: "Clubes", href: "/super-admin", activo: false },
      {
        etiqueta: "Club",
        href: "/c/club-de-ejemplo-del-norte/admin/club",
        activo: false,
      },
      {
        etiqueta: "Sedes",
        href: "/c/club-de-ejemplo-del-norte/admin/sedes",
        activo: false,
      },
      {
        etiqueta: "Admins",
        href: "/c/club-de-ejemplo-del-norte/admin/admins",
        activo: false,
      },
    ]);
  });

  it("en Admin de un solo club muestra Inicio, Club, Sedes y Admins, sin Clubes", () => {
    expect(
      itemsNav({
        club: CLUB,
        rol: "admin",
        activo: "admins",
        rutas: RUTAS_SHELL_APP,
      }),
    ).toEqual([
      {
        etiqueta: "Inicio",
        href: "/c/club-de-ejemplo-del-norte/admin",
        activo: false,
      },
      {
        etiqueta: "Club",
        href: "/c/club-de-ejemplo-del-norte/admin/club",
        activo: false,
      },
      {
        etiqueta: "Sedes",
        href: "/c/club-de-ejemplo-del-norte/admin/sedes",
        activo: false,
      },
      {
        etiqueta: "Admins",
        href: "/c/club-de-ejemplo-del-norte/admin/admins",
        activo: true,
      },
    ]);
  });

  it("en Admin de más de un club suma Clubes al selector", () => {
    const items = itemsNav({
      club: CLUB,
      rol: "admin",
      esMultiClub: true,
      rutas: RUTAS_SHELL_APP,
    });
    expect(items.map((item) => item.etiqueta)).toEqual([
      "Inicio",
      "Clubes",
      "Club",
      "Sedes",
      "Admins",
    ]);
    expect(items[1]).toEqual({
      etiqueta: "Clubes",
      href: "/elegir-club",
      activo: false,
    });
  });

  it("marca Sedes como activo con la ruta real", () => {
    const items = itemsNav({
      club: CLUB,
      rol: "admin",
      activo: "sedes",
      rutas: RUTAS_SHELL_APP,
    });
    expect(items.map((item) => item.etiqueta)).toEqual([
      "Inicio",
      "Club",
      "Sedes",
      "Admins",
    ]);
    expect(items[2]).toEqual({
      etiqueta: "Sedes",
      href: "/c/club-de-ejemplo-del-norte/admin/sedes",
      activo: true,
    });
  });
});
