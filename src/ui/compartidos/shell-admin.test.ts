import { describe, expect, it } from "vitest";
import { itemsNav, opcionesSelector, RUTAS_SHELL_APP } from "./shell-admin";

const CLUB = {
  slug: "club-de-ejemplo-del-norte",
  nombre: "Club de ejemplo del Norte",
  iniciales: "EN",
};

describe("itemsNav", () => {
  it("sin club muestra el Panel del Super Admin: Clubes y Deportes", () => {
    expect(
      itemsNav({
        activo: "clubes",
        rutas: RUTAS_SHELL_APP,
      }),
    ).toEqual([
      { etiqueta: "Clubes", href: "/super-admin", activo: true },
      { etiqueta: "Deportes", href: "/super-admin/deportes", activo: false },
    ]);
  });

  it("marca Deportes como activo en el catálogo", () => {
    const items = itemsNav({
      activo: "deportes",
      rutas: RUTAS_SHELL_APP,
    });
    expect(items.filter((item) => item.activo).map((item) => item.etiqueta)).toEqual([
      "Deportes",
    ]);
  });

  it("dentro de un club muestra el Panel del club, igual para el Super Admin y el Admin", () => {
    expect(
      itemsNav({
        club: CLUB,
        activo: "inicio",
        rutas: RUTAS_SHELL_APP,
      }).map((item) => item.etiqueta),
    ).toEqual(["Inicio", "Club", "Sedes", "Deportes", "Admins"]);
  });

  it("en Admin de un solo club muestra Inicio, Club, Sedes, Deportes y Admins, sin Clubes", () => {
    expect(
      itemsNav({
        club: CLUB,
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
        etiqueta: "Deportes",
        href: "/c/club-de-ejemplo-del-norte/admin/deportes",
        activo: false,
      },
      {
        etiqueta: "Admins",
        href: "/c/club-de-ejemplo-del-norte/admin/admins",
        activo: true,
      },
    ]);
  });

  it("el menú del Panel del club nunca lleva Clubes ni el catálogo de deportes", () => {
    for (const activo of ["inicio", "sedes", "deportes-club"] as const) {
      const etiquetas = itemsNav({ club: CLUB, activo, rutas: RUTAS_SHELL_APP }).map((item) => item.etiqueta);
      expect(etiquetas).not.toContain("Clubes");
      expect(etiquetas).not.toContain("Deportes del club");
    }
  });

  it("marca Sedes como activo con la ruta real", () => {
    const items = itemsNav({
      club: CLUB,
      activo: "sedes",
      rutas: RUTAS_SHELL_APP,
    });
    expect(items.map((item) => item.etiqueta)).toEqual([
      "Inicio",
      "Club",
      "Sedes",
      "Deportes",
      "Admins",
    ]);
    expect(items[2]).toEqual({
      etiqueta: "Sedes",
      href: "/c/club-de-ejemplo-del-norte/admin/sedes",
      activo: true,
    });
  });

  it("marca los deportes del club como activos, con la etiqueta Deportes", () => {
    const items = itemsNav({
      club: CLUB,
      activo: "deportes-club",
      rutas: RUTAS_SHELL_APP,
    });
    expect(items.filter((item) => item.activo)).toEqual([
      {
        etiqueta: "Deportes",
        href: "/c/club-de-ejemplo-del-norte/admin/deportes",
        activo: true,
      },
    ]);
  });
});

const clubDeEjemplo = (n: number) => ({
  slug: `club-${n}`,
  nombre: `Club ${n}`,
  iniciales: `C${n}`,
  escudo: null as string | null,
});

describe("opcionesSelector", () => {
  it("el Admin de un solo club no tiene selector: tiene un solo panel", () => {
    expect(
      opcionesSelector({
        paneles: { esSuperAdmin: false, clubes: [clubDeEjemplo(1)] },
        clubActual: "club-1",
        rutas: RUTAS_SHELL_APP,
      }),
    ).toBeNull();
  });

  it("al Super Admin en un club le lista su panel y los clubes, con el club actual marcado", () => {
    expect(
      opcionesSelector({
        paneles: { esSuperAdmin: true, clubes: [clubDeEjemplo(1), clubDeEjemplo(2)] },
        clubActual: "club-2",
        rutas: RUTAS_SHELL_APP,
      }),
    ).toEqual({
      panelSuperAdmin: { href: "/super-admin", activo: false },
      clubes: [
        { ...clubDeEjemplo(1), href: "/c/club-1/admin", activo: false },
        { ...clubDeEjemplo(2), href: "/c/club-2/admin", activo: true },
      ],
      conBuscador: false,
    });
  });

  it("en el Panel del Super Admin marca ese panel y ningún club", () => {
    const opciones = opcionesSelector({
      paneles: { esSuperAdmin: true, clubes: [clubDeEjemplo(1)] },
      rutas: RUTAS_SHELL_APP,
    });
    expect(opciones?.panelSuperAdmin).toEqual({ href: "/super-admin", activo: true });
    expect(opciones?.clubes.map((club) => club.activo)).toEqual([false]);
  });

  it("al Admin de varios clubes le lista sus clubes, sin el Panel del Super Admin", () => {
    const opciones = opcionesSelector({
      paneles: { esSuperAdmin: false, clubes: [clubDeEjemplo(1), clubDeEjemplo(2)] },
      clubActual: "club-1",
      rutas: RUTAS_SHELL_APP,
    });
    expect(opciones?.panelSuperAdmin).toBeNull();
    expect(opciones?.clubes.map((club) => [club.slug, club.activo])).toEqual([
      ["club-1", true],
      ["club-2", false],
    ]);
  });

  it("suma el buscador a partir de 8 clubes", () => {
    const conClubes = (cantidad: number) =>
      opcionesSelector({
        paneles: {
          esSuperAdmin: true,
          clubes: Array.from({ length: cantidad }, (_, i) => clubDeEjemplo(i + 1)),
        },
        rutas: RUTAS_SHELL_APP,
      })?.conBuscador;
    expect(conClubes(7)).toBe(false);
    expect(conClubes(8)).toBe(true);
  });
});
