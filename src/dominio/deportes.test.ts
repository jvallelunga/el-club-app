import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONDICION_VACIA, type Condicion } from "./condicion";
import {
  deporteParaGuardar,
  esClaveIconoDeporte,
  ICONO_DEPORTE_POR_DEFECTO,
  condicionEfectivaEnElClub,
  deportesDelClub,
  textoCondicionEnElClub,
  ICONOS_DEPORTE,
  separarBorrados,
  textoClubes,
  textoUso,
  validarDeporte,
  type Deporte,
  type DeporteElegido,
} from "./deportes";

describe("íconos de deporte", () => {
  it("tiene claves únicas y el ícono por defecto es una de ellas", () => {
    const claves = ICONOS_DEPORTE.map((icono) => icono.clave);
    expect(new Set(claves).size).toBe(claves.length);
    expect(esClaveIconoDeporte(ICONO_DEPORTE_POR_DEFECTO)).toBe(true);
  });

  it("reconoce solo las claves del set", () => {
    expect(esClaveIconoDeporte("rugby")).toBe(true);
    expect(esClaveIconoDeporte("Rugby")).toBe(false);
    expect(esClaveIconoDeporte("pelota")).toBe(false);
  });

  it("coincide con la lista que acepta la base (deporte_icono_check)", () => {
    const carpeta = path.resolve(__dirname, "../../supabase/migrations");
    const ultimaConCheck = readdirSync(carpeta)
      .filter((archivo) => archivo.endsWith(".sql"))
      .sort()
      .map((archivo) => readFileSync(path.join(carpeta, archivo), "utf8"))
      .filter((sql) => sql.includes("add constraint deporte_icono_check"))
      .at(-1);
    expect(ultimaConCheck).toBeDefined();
    const check = ultimaConCheck!.slice(
      ultimaConCheck!.indexOf("add constraint deporte_icono_check"),
    );
    const inicio = check.indexOf("icono in (") + "icono in (".length;
    const lista = check.slice(inicio, check.indexOf(")", inicio));
    const claves = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(claves).toEqual(ICONOS_DEPORTE.map((icono) => icono.clave));
  });
});

describe("validarDeporte", () => {
  const valido = {
    nombre: "Rugby masculino",
    icono: "rugby",
    descripcion: "",
    condicion: CONDICION_VACIA,
  };

  it("acepta un deporte con nombre e ícono, sin descripción", () => {
    expect(validarDeporte(valido)).toEqual({});
  });

  it("pide el nombre", () => {
    expect(validarDeporte({ ...valido, nombre: "   " }).nombre).toBeTruthy();
  });

  it("limita el nombre a 60 caracteres y la descripción a 280", () => {
    expect(validarDeporte({ ...valido, nombre: "a".repeat(60) })).toEqual({});
    expect(validarDeporte({ ...valido, nombre: "a".repeat(61) }).nombre).toBeTruthy();
    expect(validarDeporte({ ...valido, descripcion: "a".repeat(280) })).toEqual({});
    expect(
      validarDeporte({ ...valido, descripcion: "a".repeat(281) }).descripcion,
    ).toBeTruthy();
  });

  it("pide un ícono del set", () => {
    expect(validarDeporte({ ...valido, icono: "pelota" }).icono).toBeTruthy();
  });

  it("no acepta una condición con más de un subnivel", () => {
    const dosSubniveles = {
      conector: "Y",
      items: [{ conector: "O", items: [{ conector: "Y", items: [{ campo: "sexo", valor: "M" }] }] }],
    };
    expect(validarDeporte({ ...valido, condicion: dosSubniveles }).condicion).toBeTruthy();
    expect(validarDeporte({ ...valido, condicion: "no es una condición" }).condicion).toBeTruthy();
  });
});

describe("deporteParaGuardar", () => {
  const condicion = { conector: "Y", items: [{ campo: "sexo", valor: "F" }] };

  it("recorta el nombre, deja la descripción vacía en null y guarda la condición leída", () => {
    expect(
      deporteParaGuardar({ nombre: "  Hockey  ", icono: "hockey", descripcion: "  ", condicion }),
    ).toEqual({ nombre: "Hockey", icono: "hockey", descripcion: null, condicion });
  });

  it("no acepta un ícono fuera del set ni una condición mal formada", () => {
    expect(() =>
      deporteParaGuardar({ nombre: "Hockey", icono: "pelota", descripcion: "", condicion }),
    ).toThrow();
    expect(() =>
      deporteParaGuardar({ nombre: "Hockey", icono: "hockey", descripcion: "", condicion: {} }),
    ).toThrow();
  });
});

describe("textoClubes", () => {
  it("usa singular para uno", () => {
    expect(textoClubes(0)).toBe("0 clubes");
    expect(textoClubes(1)).toBe("1 club");
    expect(textoClubes(3)).toBe("3 clubes");
  });
});

describe("separarBorrados", () => {
  const deporte = (nombre: string, borradoEn: string | null = null): Deporte => ({
    id: nombre,
    nombre,
    icono: "trofeo",
    descripcion: "",
    condicion: CONDICION_VACIA,
    borradoEn,
  });

  it("separa los borrados y ordena cada grupo por nombre, sin importar acentos ni mayúsculas", () => {
    const { activos, borrados } = separarBorrados([
      deporte("Vóley"),
      deporte("rugby"),
      deporte("Hockey", "2026-11-19T12:00:00Z"),
      deporte("Atletismo"),
      deporte("Básquet", "2026-11-18T12:00:00Z"),
    ]);
    expect(activos.map((d) => d.nombre)).toEqual(["Atletismo", "rugby", "Vóley"]);
    expect(borrados.map((d) => d.nombre)).toEqual(["Básquet", "Hockey"]);
  });
});

const deporte = (
  nombre: string,
  borradoEn: string | null = null,
  condicion: Condicion = CONDICION_VACIA,
): Deporte => ({
  id: nombre,
  nombre,
  icono: "trofeo",
  descripcion: "",
  condicion,
  borradoEn,
});

const elegido = (deporteId: string, condicion: Condicion = CONDICION_VACIA): DeporteElegido => ({
  deporteId,
  condicion,
});

const hasta12: Condicion = { conector: "Y", items: [{ campo: "edad", hasta: 12 }] };
const desde6: Condicion = { conector: "Y", items: [{ campo: "edad", desde: 6 }] };

describe("deportesDelClub", () => {

  it("ofrece todo el catálogo activo, marcando los que el club ya tiene", () => {
    const lista = deportesDelClub(
      [deporte("Rugby"), deporte("Hockey"), deporte("Atletismo")],
      [elegido("Hockey")],
    );
    expect(lista.map((d) => [d.nombre, d.enClub])).toEqual([
      ["Atletismo", false],
      ["Hockey", true],
      ["Rugby", false],
    ]);
  });

  it("deja al final los borrados que el club tenía y descarta los que no tenía", () => {
    const lista = deportesDelClub(
      [
        deporte("Vóley", "2026-11-19T12:00:00Z"),
        deporte("Rugby"),
        deporte("Básquet", "2026-11-18T12:00:00Z"),
      ],
      [elegido("Vóley")],
    );
    expect(lista.map((d) => [d.nombre, d.enClub, d.borradoEn !== null])).toEqual([
      ["Rugby", false, false],
      ["Vóley", true, true],
    ]);
  });

  it("trae la condición del club de cada deporte elegido", () => {
    const lista = deportesDelClub(
      [deporte("Rugby", null, hasta12), deporte("Hockey")],
      [elegido("Rugby", desde6)],
    );
    expect(lista.map((d) => [d.nombre, d.condicionClub])).toEqual([
      ["Hockey", CONDICION_VACIA],
      ["Rugby", desde6],
    ]);
  });

  it("ignora ids del club que no están en el catálogo", () => {
    expect(deportesDelClub([deporte("Rugby")], [elegido("Fantasma")]).map((d) => d.nombre)).toEqual([
      "Rugby",
    ]);
  });
});

const delClub = (condicionDeporte: Condicion, condicionClub: Condicion) =>
  deportesDelClub([deporte("Rugby", null, condicionDeporte)], [elegido("Rugby", condicionClub)])[0];

describe("condicionEfectivaEnElClub", () => {
  it("es la del deporte y después la del club", () => {
    expect(condicionEfectivaEnElClub(delClub(hasta12, desde6))).toEqual([hasta12, desde6]);
  });

  it("sin condición del club, es solo la del deporte", () => {
    expect(condicionEfectivaEnElClub(delClub(hasta12, CONDICION_VACIA))).toEqual([hasta12]);
  });
});

describe("textoCondicionEnElClub", () => {
  it("muestra la del deporte y, si el club sumó una, «· Club: …»", () => {
    expect(textoCondicionEnElClub(delClub(hasta12, desde6))).toBe(
      "Hasta 12 años · Club: 6 años o más",
    );
  });

  it("sin condición del club, solo la del deporte", () => {
    expect(textoCondicionEnElClub(delClub(hasta12, CONDICION_VACIA))).toBe("Hasta 12 años");
  });

  it("sin condición del deporte, dice que es cualquier socio", () => {
    expect(textoCondicionEnElClub(delClub(CONDICION_VACIA, desde6))).toBe(
      "Cualquier socio · Club: 6 años o más",
    );
  });
});

describe("textoUso", () => {
  it("concuerda el verbo con la cantidad", () => {
    expect(textoUso(0)).toBe("Lo usan 0 clubes.");
    expect(textoUso(1)).toBe("Lo usa 1 club.");
    expect(textoUso(3)).toBe("Lo usan 3 clubes.");
  });
});
