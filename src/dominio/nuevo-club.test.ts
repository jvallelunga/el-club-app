import { describe, expect, it } from "vitest";
import {
  BUCKET_ESCUDOS,
  ESCUDO_TAMANIO_MAX,
  coloresParaGuardar,
  primerError,
  rutaEscudo,
  rutaEscudoObsoleta,
  urlEscudoPublico,
  validarArchivoEscudo,
  validarDatosNuevoClub,
  validarSlug,
} from "./nuevo-club";

describe("validarSlug", () => {
  it("acepta identificadores en minúsculas con guiones internos", () => {
    expect(validarSlug("club-de-ejemplo")).toBeNull();
    expect(validarSlug("abc")).toBeNull();
  });

  it("rechaza vacío, mayúsculas, espacios y guiones al borde", () => {
    expect(validarSlug("")).toMatch(/identificador/i);
    expect(validarSlug("Club-Ejemplo")).toMatch(/minúsculas/);
    expect(validarSlug("-club")).toMatch(/guiones/);
    expect(validarSlug("club-")).toMatch(/guiones/);
    expect(validarSlug("club ejemplo")).toMatch(/guiones/);
  });
});

describe("validarDatosNuevoClub", () => {
  const base = {
    nombre: "Club de ejemplo",
    slug: "club-de-ejemplo",
    slugManual: true,
    marca: "#1f4b3a",
    claro: "#ffffff",
    extras: ["", ""] as string[],
    dominioBase: "",
  };

  it("acepta un alta mínima válida", () => {
    expect(validarDatosNuevoClub(base)).toEqual({});
  });

  it("pide el nombre y un identificador válido", () => {
    const errores = validarDatosNuevoClub({
      ...base,
      nombre: "   ",
      slug: "",
      slugManual: true,
    });
    expect(errores.nombre).toMatch(/nombre/i);
    expect(errores.slug).toMatch(/identificador/i);
  });

  it("arma el identificador desde el nombre si no se editó a mano", () => {
    expect(
      validarDatosNuevoClub({
        ...base,
        slug: "",
        slugManual: false,
      }),
    ).toEqual({});
  });

  it("exige un HEX en el color principal y en el claro", () => {
    const errores = validarDatosNuevoClub({
      ...base,
      marca: "verde",
      claro: "blanco",
    });
    expect(errores.marca).toMatch(/hexadecimal/);
    expect(errores.claro).toMatch(/hexadecimal/);
  });

  it("acepta colores opcionales vacíos y rechaza un HEX inválido", () => {
    expect(
      validarDatosNuevoClub({ ...base, extras: ["", ""] }),
    ).toEqual({});
    const errores = validarDatosNuevoClub({
      ...base,
      extras: ["#c47a2c", "naranja"],
    });
    expect(errores.extras).toMatch(/opcionales/);
  });

  it("reusa la validación del dominio base", () => {
    const errores = validarDatosNuevoClub({
      ...base,
      dominioBase: "www.ejemplo.com",
    });
    expect(errores.dominioBase).toMatch(/www/i);
  });

  it("devuelve el primer mensaje útil", () => {
    expect(primerError({ nombre: "Escribí el nombre del club." })).toBe(
      "Escribí el nombre del club.",
    );
  });
});

describe("coloresParaGuardar", () => {
  it("normaliza el principal y el claro, y deja null los opcionales vacíos", () => {
    expect(coloresParaGuardar("#1F4B3A", "FFF", ["", ""])).toEqual({
      colorPrincipal: "#1f4b3a",
      colorClaro: "#ffffff",
      color2: null,
      color3: null,
    });
  });

  it("guarda los opcionales solo si son HEX válidos", () => {
    expect(coloresParaGuardar("#1f4b3a", "#ffffff", ["#C47A2C", "#72368a"])).toEqual(
      {
        colorPrincipal: "#1f4b3a",
        colorClaro: "#ffffff",
        color2: "#c47a2c",
        color3: "#72368a",
      },
    );
  });
});

describe("escudo", () => {
  it("acepta tipos y tamaños válidos", () => {
    expect(validarArchivoEscudo("image/png", 1024)).toBeNull();
    expect(validarArchivoEscudo("image/svg+xml", 1024)).toMatch(/PNG/);
    expect(
      validarArchivoEscudo("image/png", ESCUDO_TAMANIO_MAX + 1),
    ).toMatch(/2 MB/);
  });

  it("arma la ruta y la URL pública del bucket", () => {
    expect(rutaEscudo("abc-id", "image/png")).toBe("abc-id/escudo.png");
    expect(
      urlEscudoPublico("https://ejemplo.supabase.co/", "abc-id/escudo.png"),
    ).toBe(
      "https://ejemplo.supabase.co/storage/v1/object/public/escudos/abc-id/escudo.png",
    );
    expect(urlEscudoPublico("https://ejemplo.supabase.co", null)).toBeNull();
    expect(BUCKET_ESCUDOS).toBe("escudos");
  });
});

describe("rutaEscudoObsoleta", () => {
  it("no borra nada si no había escudo o si la ruta no cambia", () => {
    expect(rutaEscudoObsoleta(null, "abc/escudo.jpg")).toBeNull();
    expect(rutaEscudoObsoleta(undefined, "abc/escudo.jpg")).toBeNull();
    expect(rutaEscudoObsoleta("abc/escudo.jpg", "abc/escudo.jpg")).toBeNull();
  });

  it("devuelve la ruta anterior si el archivo nuevo va a otra extensión", () => {
    expect(rutaEscudoObsoleta("abc/escudo.jpg", "abc/escudo.png")).toBe(
      "abc/escudo.jpg",
    );
  });
});
