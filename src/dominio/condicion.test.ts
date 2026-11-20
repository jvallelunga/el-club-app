import { describe, expect, it } from "vitest";
import {
  agregarChequeo,
  agregarSubgrupo,
  cambiarCampo,
  cambiarChequeo,
  cambiarConector,
  CONDICION_VACIA,
  condicionEfectiva,
  cumpleCondicion,
  cumpleCondicionEfectiva,
  describirCondicion,
  describirCondicionEfectiva,
  edadEnElAnio,
  quitarItem,
  TEXTO_SIN_CONDICION,
  validarCondicion,
  type Condicion,
  type Persona,
} from "./condicion";

const masculino16: Condicion = {
  conector: "Y",
  items: [
    { campo: "sexo", valor: "M" },
    { campo: "edad", desde: 16 },
  ],
};

const natacionMaster: Condicion = {
  conector: "O",
  items: [
    { campo: "edad", desde: 25 },
    {
      conector: "Y",
      items: [
        { campo: "sexo", valor: "F" },
        { campo: "edad", desde: 20 },
      ],
    },
  ],
};

const persona = (sexo: "M" | "F", fechaNacimiento: string): Persona => ({
  sexo,
  fechaNacimiento,
});

describe("validarCondicion", () => {
  it("acepta la condición vacía, chequeos sueltos y un subgrupo", () => {
    expect(validarCondicion(CONDICION_VACIA)).toEqual({ ok: true, condicion: CONDICION_VACIA });
    expect(validarCondicion(masculino16)).toEqual({ ok: true, condicion: masculino16 });
    expect(validarCondicion(natacionMaster)).toEqual({ ok: true, condicion: natacionMaster });
  });

  it("no acepta más de un subnivel", () => {
    const resultado = validarCondicion({
      conector: "Y",
      items: [
        {
          conector: "O",
          items: [{ conector: "Y", items: [{ campo: "sexo", valor: "M" }] }],
        },
      ],
    });
    expect(resultado.ok).toBe(false);
  });

  it("no acepta más de un grupo", () => {
    const grupo = { conector: "O", items: [{ campo: "sexo", valor: "M" }] };
    expect(validarCondicion({ conector: "Y", items: [grupo, grupo] }).ok).toBe(false);
  });

  it("un grupo nuevo ya se puede guardar", () => {
    expect(validarCondicion(agregarSubgrupo(masculino16)).ok).toBe(true);
  });

  it("no acepta un grupo vacío", () => {
    expect(validarCondicion({ conector: "Y", items: [{ conector: "O", items: [] }] }).ok).toBe(
      false,
    );
  });

  it("pide desde o hasta, enteros y en orden", () => {
    const con = (chequeo: unknown) => validarCondicion({ conector: "Y", items: [chequeo] });
    expect(con({ campo: "edad" }).ok).toBe(false);
    expect(con({ campo: "edad", desde: 16.5 }).ok).toBe(false);
    expect(con({ campo: "edad", desde: 20, hasta: 10 }).ok).toBe(false);
    expect(con({ campo: "edad", desde: 10, hasta: 10 }).ok).toBe(true);
    expect(con({ campo: "anio", hasta: 1986 }).ok).toBe(true);
    expect(con({ campo: "edad", desde: -1 }).ok).toBe(false);
    expect(con({ campo: "anio", desde: 1800 }).ok).toBe(false);
  });

  it("no acepta datos con otra forma", () => {
    expect(validarCondicion(null).ok).toBe(false);
    expect(validarCondicion("Y").ok).toBe(false);
    expect(validarCondicion({ conector: "Z", items: [] }).ok).toBe(false);
    expect(validarCondicion({ conector: "Y" }).ok).toBe(false);
    expect(validarCondicion({ conector: "Y", items: [{ campo: "sexo", valor: "X" }] }).ok).toBe(
      false,
    );
    expect(validarCondicion({ conector: "Y", items: [{ campo: "altura", desde: 1 }] }).ok).toBe(
      false,
    );
    expect(
      validarCondicion({ conector: "Y", items: [{ campo: "edad", desde: 1, extra: true }] }).ok,
    ).toBe(false);
  });

  it("devuelve la condición limpia, sin claves vacías", () => {
    const resultado = validarCondicion({
      conector: "Y",
      items: [{ campo: "edad", desde: 16, hasta: undefined }],
    });
    expect(resultado).toEqual({
      ok: true,
      condicion: { conector: "Y", items: [{ campo: "edad", desde: 16 }] },
    });
  });
});

describe("edadEnElAnio", () => {
  it("es el año actual menos el año de nacimiento, sin importar el día", () => {
    expect(edadEnElAnio("2010-12-31", 2026)).toBe(16);
    expect(edadEnElAnio("2010-01-01", 2026)).toBe(16);
  });
});

describe("cumpleCondicion", () => {
  it("sin chequeos, la cumple cualquiera", () => {
    expect(cumpleCondicion(CONDICION_VACIA, persona("F", "2020-05-01"), 2026)).toBe(true);
  });

  it("con Y, tiene que cumplir todos los chequeos", () => {
    expect(cumpleCondicion(masculino16, persona("M", "2010-12-31"), 2026)).toBe(true);
    expect(cumpleCondicion(masculino16, persona("M", "2011-01-01"), 2026)).toBe(false);
    expect(cumpleCondicion(masculino16, persona("F", "2000-01-01"), 2026)).toBe(false);
  });

  it("con O y un subgrupo, alcanza con uno de los dos", () => {
    expect(cumpleCondicion(natacionMaster, persona("M", "2001-03-01"), 2026)).toBe(true);
    expect(cumpleCondicion(natacionMaster, persona("F", "2006-03-01"), 2026)).toBe(true);
    expect(cumpleCondicion(natacionMaster, persona("M", "2006-03-01"), 2026)).toBe(false);
    expect(cumpleCondicion(natacionMaster, persona("F", "2007-03-01"), 2026)).toBe(false);
  });

  it("la edad depende del año actual", () => {
    const hasta12: Condicion = { conector: "Y", items: [{ campo: "edad", hasta: 12 }] };
    const nacido2014 = persona("M", "2014-06-01");
    expect(cumpleCondicion(hasta12, nacido2014, 2026)).toBe(true);
    expect(cumpleCondicion(hasta12, nacido2014, 2027)).toBe(false);
  });

  it("el año de nacimiento incluye los extremos", () => {
    const veteranos: Condicion = {
      conector: "Y",
      items: [{ campo: "anio", desde: 1980, hasta: 1986 }],
    };
    expect(cumpleCondicion(veteranos, persona("M", "1986-12-31"), 2026)).toBe(true);
    expect(cumpleCondicion(veteranos, persona("M", "1980-01-01"), 2026)).toBe(true);
    expect(cumpleCondicion(veteranos, persona("M", "1987-01-01"), 2026)).toBe(false);
  });
});

describe("describirCondicion", () => {
  it("sin chequeos dice que puede anotarse cualquier socio", () => {
    expect(describirCondicion(CONDICION_VACIA)).toBe(TEXTO_SIN_CONDICION);
  });

  it("une los chequeos con y / o y pone el subgrupo entre paréntesis", () => {
    expect(describirCondicion(masculino16)).toBe("Masculino y 16 años o más");
    expect(describirCondicion(natacionMaster)).toBe(
      "25 años o más o (femenino y 20 años o más)",
    );
  });

  it("describe cada rango", () => {
    const texto = (chequeo: Condicion["items"][number]) =>
      describirCondicion({ conector: "Y", items: [chequeo] });
    expect(texto({ campo: "edad", hasta: 12 })).toBe("Hasta 12 años");
    expect(texto({ campo: "edad", desde: 6, hasta: 12 })).toBe("De 6 a 12 años");
    expect(texto({ campo: "anio", hasta: 1986 })).toBe("Nacidos en 1986 o antes");
    expect(texto({ campo: "anio", desde: 2010 })).toBe("Nacidos en 2010 o después");
    expect(texto({ campo: "anio", desde: 2010, hasta: 2012 })).toBe("Nacidos de 2010 a 2012");
    expect(texto({ campo: "anio", desde: 2010, hasta: 2010 })).toBe("Nacidos en 2010");
    expect(texto({ campo: "sexo", valor: "F" })).toBe("Femenino");
  });
});

describe("condición efectiva", () => {
  const hasta12: Condicion = { conector: "Y", items: [{ campo: "edad", hasta: 12 }] };
  const desde6: Condicion = { conector: "Y", items: [{ campo: "edad", desde: 6 }] };

  it("pide cumplir todas las condiciones: la del deporte y la del club", () => {
    const efectiva = condicionEfectiva(hasta12, desde6);
    expect(cumpleCondicionEfectiva(efectiva, persona("M", "2016-01-01"), 2026)).toBe(true);
    // Cumple la del deporte, no la del club.
    expect(cumpleCondicionEfectiva(efectiva, persona("M", "2021-01-01"), 2026)).toBe(false);
    // Cumple la del club, no la del deporte.
    expect(cumpleCondicionEfectiva(efectiva, persona("M", "2010-01-01"), 2026)).toBe(false);
  });

  it("no afloja una condición con O: cada una se cumple por separado", () => {
    // Con un solo «O» arriba, un varón de 30 cumpliría; juntas con Y, no.
    const efectiva = condicionEfectiva(natacionMaster, {
      conector: "Y",
      items: [{ campo: "sexo", valor: "F" }],
    });
    expect(cumpleCondicionEfectiva(efectiva, persona("M", "1996-01-01"), 2026)).toBe(false);
    expect(cumpleCondicionEfectiva(efectiva, persona("F", "1996-01-01"), 2026)).toBe(true);
  });

  it("sin condición del club, queda la del deporte", () => {
    const efectiva = condicionEfectiva(hasta12, CONDICION_VACIA);
    expect(efectiva).toEqual([hasta12]);
    expect(cumpleCondicionEfectiva(efectiva, persona("F", "2010-01-01"), 2026)).toBe(false);
    expect(describirCondicionEfectiva(efectiva)).toBe("Hasta 12 años");
  });

  it("sin condición del deporte, queda la del club", () => {
    const efectiva = condicionEfectiva(CONDICION_VACIA, desde6);
    expect(efectiva).toEqual([desde6]);
    expect(cumpleCondicionEfectiva(efectiva, persona("F", "2021-01-01"), 2026)).toBe(false);
    expect(describirCondicionEfectiva(efectiva)).toBe("6 años o más");
  });

  it("sin ninguna, puede anotarse cualquier socio", () => {
    const efectiva = condicionEfectiva(CONDICION_VACIA, CONDICION_VACIA);
    expect(efectiva).toEqual([]);
    expect(cumpleCondicionEfectiva(efectiva, persona("F", "1950-01-01"), 2026)).toBe(true);
    expect(describirCondicionEfectiva(efectiva)).toBe(TEXTO_SIN_CONDICION);
  });

  it("se lee como la primera «y además» las siguientes", () => {
    expect(describirCondicionEfectiva(condicionEfectiva(hasta12, desde6))).toBe(
      "Hasta 12 años, y además 6 años o más",
    );
    expect(describirCondicionEfectiva(condicionEfectiva(masculino16, natacionMaster))).toBe(
      "Masculino y 16 años o más, y además 25 años o más o (femenino y 20 años o más)",
    );
  });

  it("suma más de dos condiciones (la de la categoría, #57)", () => {
    const masculino: Condicion = { conector: "Y", items: [{ campo: "sexo", valor: "M" }] };
    const efectiva = condicionEfectiva(hasta12, desde6, masculino);
    expect(cumpleCondicionEfectiva(efectiva, persona("M", "2016-01-01"), 2026)).toBe(true);
    expect(cumpleCondicionEfectiva(efectiva, persona("F", "2016-01-01"), 2026)).toBe(false);
    expect(describirCondicionEfectiva(efectiva)).toBe(
      "Hasta 12 años, y además 6 años o más, y además masculino",
    );
  });
});

describe("edición", () => {
  it("agrega chequeos arriba y en el subgrupo", () => {
    let condicion = agregarChequeo(CONDICION_VACIA);
    expect(condicion.items).toEqual([{ campo: "sexo", valor: "M" }]);
    condicion = agregarSubgrupo(condicion);
    expect(condicion.items).toHaveLength(2);
    condicion = agregarChequeo(condicion, 1);
    const grupo = condicion.items[1];
    expect("items" in grupo && grupo.items).toHaveLength(2);
  });

  it("el subgrupo nuevo arranca con el conector contrario y no se suma un segundo", () => {
    const conGrupo = agregarSubgrupo(CONDICION_VACIA);
    expect(conGrupo.items[0]).toMatchObject({ conector: "O" });
    expect(agregarSubgrupo(conGrupo)).toBe(conGrupo);
  });

  it("cambia el conector de arriba y el del subgrupo", () => {
    const conGrupo = agregarSubgrupo(CONDICION_VACIA);
    expect(cambiarConector(conGrupo, "O").conector).toBe("O");
    expect(cambiarConector(conGrupo, "Y", 0).items[0]).toMatchObject({ conector: "Y" });
  });

  it("cambia un chequeo y su campo", () => {
    const base = agregarChequeo(CONDICION_VACIA);
    const conEdad = cambiarCampo(base, [0], "edad");
    expect(conEdad.items).toEqual([{ campo: "edad" }]);
    expect(cambiarChequeo(conEdad, [0], { campo: "edad", desde: 6 }).items).toEqual([
      { campo: "edad", desde: 6 },
    ]);
  });

  it("al quitar el último chequeo de un grupo, se va el grupo", () => {
    let condicion = agregarChequeo(agregarSubgrupo(masculino16), 2);
    condicion = quitarItem(condicion, [2, 0]);
    expect(condicion.items).toHaveLength(3);
    condicion = quitarItem(condicion, [2, 0]);
    expect(condicion).toEqual(masculino16);
    expect(quitarItem(masculino16, [0]).items).toEqual([{ campo: "edad", desde: 16 }]);
  });

  it("no cambia la condición original", () => {
    const copia = structuredClone(masculino16);
    agregarChequeo(masculino16);
    quitarItem(masculino16, [0]);
    cambiarConector(masculino16, "O");
    expect(masculino16).toEqual(copia);
  });
});
