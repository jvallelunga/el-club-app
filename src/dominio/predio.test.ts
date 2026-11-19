import { describe, expect, it } from "vitest";
import {
  aCoordenadas,
  aMetros,
  coordenadasDesdeNominatim,
  errorDelArea,
  errorDelPredio,
  hayCambiosEnPredio,
  huellaDeInstalacion,
  medidasDelTipo,
  ORIGEN_POR_DEFECTO,
  origenInicial,
  frenteDeGradas,
  huellaDeReferencia,
  medidasDeReferencia,
  NOMBRE_MAXIMO,
  predioParaGuardar,
  type DatosPredio,
  type InstalacionUbicada,
  type ReferenciaUbicada,
} from "./predio";

describe("aMetros y aCoordenadas", () => {
  it("un milésimo de grado al norte son unos 111 m", () => {
    const [este, norte] = aMetros({ lat: -37, lng: -59 }, { lat: -36.999, lng: -59 });
    expect(este).toBeCloseTo(0, 6);
    expect(norte).toBeCloseTo(111.2, 0);
  });

  it("a 60° de latitud, un milésimo de grado al este mide la mitad que en el ecuador", () => {
    const [enEcuador] = aMetros({ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 });
    const [a60] = aMetros({ lat: 60, lng: 0 }, { lat: 60, lng: 0.001 });
    expect(enEcuador).toBeCloseTo(111.2, 0);
    expect(a60).toBeCloseTo(55.6, 0);
  });

  it("ida y vuelta devuelve el mismo punto", () => {
    const origen = { lat: -37.33599, lng: -59.08072 };
    const punto = aCoordenadas(origen, [120.5, -48.25]);
    const [este, norte] = aMetros(origen, punto);
    expect(este).toBeCloseTo(120.5, 6);
    expect(norte).toBeCloseTo(-48.25, 6);
  });
});

describe("errorDelArea", () => {
  it("acepta un predio sin área todavía", () => {
    expect(errorDelArea([])).toBeNull();
  });

  it("acepta un polígono simple", () => {
    expect(errorDelArea([[0, 0], [100, 0], [100, 80], [0, 80]])).toBeNull();
  });

  it("pide al menos tres puntos", () => {
    expect(errorDelArea([[0, 0], [100, 0]])).toMatch(/tres puntos/);
  });

  it("rechaza un área que se cruza consigo misma", () => {
    // Un moño: los lados 0-1 y 2-3 se cruzan.
    expect(errorDelArea([[0, 0], [100, 100], [100, 0], [0, 100]])).toMatch(/cruza/);
  });

  it("rechaza puntos a más de 5 km del origen", () => {
    expect(errorDelArea([[0, 0], [6000, 0], [0, 100]])).toMatch(/lejos/);
  });

  it("rechaza números inválidos", () => {
    expect(errorDelArea([[0, 0], [Number.NaN, 0], [0, 100]])).toBeTruthy();
  });
});

describe("origenInicial", () => {
  const predio = { lat: -37.336, lng: -59.08 };
  const sede = { lat: -37.3, lng: -59.1 };
  const ciudad = { lat: -37.32, lng: -59.13 };

  it("usa el origen guardado del predio", () => {
    expect(origenInicial({ predio, sede, ciudad })).toEqual({ coordenadas: predio, desde: "predio" });
  });

  it("sin predio, arranca en las coordenadas de la sede", () => {
    expect(origenInicial({ predio: null, sede, ciudad })).toEqual({ coordenadas: sede, desde: "sede" });
  });

  it("sin coordenadas de la sede, arranca en la ciudad del club", () => {
    expect(origenInicial({ predio: null, sede: null, ciudad })).toEqual({
      coordenadas: ciudad,
      desde: "ciudad",
    });
  });

  it("sin nada, arranca en Buenos Aires", () => {
    expect(origenInicial({ predio: null, sede: null, ciudad: null })).toEqual({
      coordenadas: ORIGEN_POR_DEFECTO,
      desde: "por-defecto",
    });
    expect(ORIGEN_POR_DEFECTO.lat).toBeCloseTo(-34.6, 1);
    expect(ORIGEN_POR_DEFECTO.lng).toBeCloseTo(-58.4, 1);
  });
});

describe("hayCambiosEnPredio", () => {
  const cancha: InstalacionUbicada = {
    instalacionId: "cancha",
    posicion: [40, -60] as [number, number],
    rotacion: 47,
    medidas: { largo: 100, ancho: 70, ingoal: 10 },
    descripcion: "La cancha principal.",
    ordenLeyenda: 1,
  };
  const pileta: InstalacionUbicada = {
    instalacionId: "pileta",
    posicion: [-20, 15] as [number, number],
    rotacion: 0,
    medidas: { largo: 25, ancho: 12 },
    descripcion: null,
    ordenLeyenda: 2,
  };
  const guardado = {
    origen: { lat: -37.336, lng: -59.08 },
    area: [[0, 0], [10, 0], [10, 10]] as [number, number][],
    instalaciones: [cancha, pileta],
    referencias: [],
  };

  it("no ve cambios por ruido de menos de un centímetro", () => {
    expect(
      hayCambiosEnPredio(guardado, {
        origen: { lat: -37.33600000001, lng: -59.08 },
        area: [[0.001, 0], [10, 0.002], [10, 10]],
        instalaciones: [
          // Otro orden, y ruido en la posición, la rotación y las medidas.
          // Otro orden de la lista, el orden de la leyenda con huecos y la
          // descripción con espacios de más tampoco son cambios.
          { ...pileta, posicion: [-20.004, 15], rotacion: 360, ordenLeyenda: 7, descripcion: " " },
          {
            ...cancha,
            rotacion: 47.01,
            medidas: { largo: 100.001, ancho: 70, ingoal: 10 },
            ordenLeyenda: 3,
            descripcion: " La cancha  principal. ",
          },
        ],
        referencias: [],
      }),
    ).toBe(false);
  });

  it("ve un vértice movido", () => {
    expect(hayCambiosEnPredio(guardado, { ...guardado, area: [[0, 0], [12, 0], [10, 10]] })).toBe(true);
  });

  it("ve un vértice agregado o el área borrada", () => {
    expect(hayCambiosEnPredio(guardado, { ...guardado, area: [[0, 0], [5, -1], [10, 0], [10, 10]] })).toBe(true);
    expect(hayCambiosEnPredio(guardado, { ...guardado, area: [] })).toBe(true);
  });

  it("ve el origen movido", () => {
    expect(hayCambiosEnPredio(guardado, { ...guardado, origen: { lat: -37.337, lng: -59.08 } })).toBe(true);
  });

  it("ve una instalación movida, girada o con otra medida", () => {
    const con = (cambio: Partial<typeof cancha>) => ({
      ...guardado,
      instalaciones: [{ ...cancha, ...cambio }, pileta],
    });
    expect(hayCambiosEnPredio(guardado, con({ posicion: [41, -60] }))).toBe(true);
    expect(hayCambiosEnPredio(guardado, con({ rotacion: 50 }))).toBe(true);
    expect(hayCambiosEnPredio(guardado, con({ medidas: { largo: 100, ancho: 68, ingoal: 10 } }))).toBe(true);
  });

  it("ve otra descripción, algo que entra o sale de la leyenda y la leyenda reordenada", () => {
    const con = (cambioCancha: Partial<typeof cancha>, cambioPileta: Partial<typeof pileta> = {}) => ({
      ...guardado,
      instalaciones: [{ ...cancha, ...cambioCancha }, { ...pileta, ...cambioPileta }],
    });
    expect(hayCambiosEnPredio(guardado, con({ descripcion: "Otra cosa." }))).toBe(true);
    expect(hayCambiosEnPredio(guardado, con({ descripcion: null }))).toBe(true);
    expect(hayCambiosEnPredio(guardado, con({ ordenLeyenda: null }))).toBe(true);
    expect(hayCambiosEnPredio(guardado, con({ ordenLeyenda: 2 }, { ordenLeyenda: 1 }))).toBe(true);
  });

  it("ve una instalación ubicada o quitada del predio", () => {
    expect(hayCambiosEnPredio(guardado, { ...guardado, instalaciones: [cancha] })).toBe(true);
    expect(
      hayCambiosEnPredio(guardado, {
        ...guardado,
        instalaciones: [cancha, { ...pileta, instalacionId: "gym" }],
      }),
    ).toBe(true);
  });

  it("sin predio guardado, cualquier predio es un cambio", () => {
    expect(hayCambiosEnPredio(null, guardado)).toBe(true);
  });
});

describe("coordenadasDesdeNominatim", () => {
  it("toma el primer resultado", () => {
    expect(
      coordenadasDesdeNominatim([
        { lat: "-37.3217", lon: "-59.1332", display_name: "Tandil" },
        { lat: "1", lon: "1" },
      ]),
    ).toEqual({ lat: -37.3217, lng: -59.1332 });
  });

  it("sin resultados o con datos raros, devuelve null", () => {
    expect(coordenadasDesdeNominatim([])).toBeNull();
    expect(coordenadasDesdeNominatim({ error: "x" })).toBeNull();
    expect(coordenadasDesdeNominatim([{ lat: "abc", lon: "1" }])).toBeNull();
    expect(coordenadasDesdeNominatim([{ lat: "95", lon: "1" }])).toBeNull();
  });
});

describe("predioParaGuardar", () => {
  it("redondea el área al centímetro y el origen a 7 decimales", () => {
    expect(
      predioParaGuardar({
        origen: { lat: -37.336001234567, lng: -59.08 },
        area: [[1.23456, -7.891], [10, 0], [10, 10.005001]],
        instalaciones: [],
        referencias: [],
      }),
    ).toEqual({
      origen: { lat: -37.3360012, lng: -59.08 },
      area: [[1.23, -7.89], [10, 0], [10, 10.01]],
      instalaciones: [],
      referencias: [],
    });
  });
});

describe("predioParaGuardar con instalaciones", () => {
  it("redondea la posición y las medidas al centímetro, y la rotación a la décima entre 0° y 360°", () => {
    const origen = { lat: -37.3, lng: -59.1 };
    const guardar = (rotacion: number) =>
      predioParaGuardar({
        origen,
        area: [],
        instalaciones: [
          {
            instalacionId: "cancha",
            posicion: [12.3456, -0.004],
            rotacion,
            medidas: { largo: 100.004, ancho: 69.996 },
            descripcion: null,
            ordenLeyenda: null,
          },
        ],
        referencias: [],
      }).instalaciones[0];
    expect(guardar(47.26)).toEqual({
      instalacionId: "cancha",
      posicion: [12.35, 0],
      rotacion: 47.3,
      medidas: { largo: 100, ancho: 70 },
      descripcion: null,
      ordenLeyenda: null,
    });
    expect(guardar(-90).rotacion).toBe(270);
    expect(guardar(450).rotacion).toBe(90);
    expect(guardar(359.97).rotacion).toBe(0);
  });
});

describe("predioParaGuardar con la leyenda", () => {
  it("limpia la descripción y deja el orden de la leyenda corrido desde 1", () => {
    const ubicada = (instalacionId: string, ordenLeyenda: number | null, descripcion: string | null) => ({
      instalacionId,
      posicion: [0, 0] as [number, number],
      rotacion: 0,
      medidas: { largo: 25, ancho: 12 },
      descripcion,
      ordenLeyenda,
    });
    const { instalaciones } = predioParaGuardar({
      origen: { lat: -37.3, lng: -59.1 },
      area: [],
      instalaciones: [
        ubicada("pileta", 5, "  Pileta \n climatizada "),
        ubicada("quincho", null, "   "),
        ubicada("cancha", 2, null),
      ],
      referencias: [],
    });
    expect(instalaciones.map((i) => [i.instalacionId, i.ordenLeyenda, i.descripcion])).toEqual([
      ["pileta", 2, "Pileta climatizada"],
      ["quincho", null, null],
      ["cancha", 1, null],
    ]);
  });
});

describe("errorDelPredio", () => {
  const origen = { lat: -37.3, lng: -59.1 };
  const tipos = new Map([
    ["cancha", "cancha_rugby" as const],
    ["pileta", "pileta" as const],
  ]);
  const cancha = {
    instalacionId: "cancha",
    posicion: [40, -60],
    rotacion: 47,
    medidas: { largo: 100, ancho: 70, ingoal: 10 },
    descripcion: null,
    ordenLeyenda: 1,
  };
  const conInstalaciones = (instalaciones: unknown[]) =>
    errorDelPredio({ origen, area: [], instalaciones, referencias: [] }, tipos);

  it("acepta un origen válido con o sin área", () => {
    expect(errorDelPredio({ origen, area: [], instalaciones: [], referencias: [] }, tipos)).toBeNull();
    expect(
      errorDelPredio({ origen, area: [[0, 0], [10, 0], [0, 10]], instalaciones: [], referencias: [] }, tipos),
    ).toBeNull();
  });

  it("rechaza un origen fuera del mapa o que no es número", () => {
    const sinInstalaciones = (datos: object) => errorDelPredio({ ...datos, instalaciones: [], referencias: [] }, tipos);
    expect(sinInstalaciones({ origen: { lat: 91, lng: 0 }, area: [] })).toMatch(/origen/);
    expect(sinInstalaciones({ origen: { lat: "x", lng: 0 }, area: [] })).toMatch(/origen/);
    expect(sinInstalaciones({ area: [] })).toMatch(/origen/);
    expect(errorDelPredio(null, tipos)).toBeTruthy();
  });

  it("trae el error del área", () => {
    expect(
      errorDelPredio({ origen: { lat: 0, lng: 0 }, area: [[0, 0]], instalaciones: [], referencias: [] }, tipos),
    ).toMatch(/tres puntos/);
  });

  it("acepta instalaciones de la sede ubicadas con las medidas de su tipo", () => {
    expect(
      conInstalaciones([
        cancha,
        {
          instalacionId: "pileta",
          posicion: [0, 0],
          rotacion: 0,
          medidas: { largo: 25, ancho: 12 },
          descripcion: "Climatizada.",
          ordenLeyenda: null,
        },
      ]),
    ).toBeNull();
  });

  it("rechaza una instalación que no es de la sede o que está ubicada dos veces", () => {
    expect(conInstalaciones([{ ...cancha, instalacionId: "de-otra-sede" }])).toMatch(/sede/);
    expect(conInstalaciones([cancha, { ...cancha, posicion: [0, 0] }])).toMatch(/dos veces/);
    expect(errorDelPredio({ origen, area: [], referencias: [] }, tipos)).toMatch(/instalaciones/);
  });

  it("rechaza una posición inválida o a más de 5 km del origen, y una rotación que no es número", () => {
    expect(conInstalaciones([{ ...cancha, posicion: [0, "x"] }])).toMatch(/posición/);
    expect(conInstalaciones([{ ...cancha, posicion: [4000, 4000] }])).toMatch(/lejos/);
    expect(conInstalaciones([{ ...cancha, rotacion: Number.NaN }])).toMatch(/rotación/);
  });

  it("rechaza una descripción de más de 280 caracteres o que no es texto", () => {
    expect(conInstalaciones([{ ...cancha, descripcion: "a".repeat(281) }])).toMatch(/280/);
    expect(conInstalaciones([{ ...cancha, descripcion: 7 }])).toMatch(/descripción/);
  });

  it("rechaza un lugar en la leyenda que no es un entero desde 1", () => {
    expect(conInstalaciones([{ ...cancha, ordenLeyenda: 0 }])).toMatch(/leyenda/);
    expect(conInstalaciones([{ ...cancha, ordenLeyenda: 1.5 }])).toMatch(/leyenda/);
    expect(conInstalaciones([{ ...cancha, ordenLeyenda: "1" }])).toMatch(/leyenda/);
    expect(conInstalaciones([{ ...cancha, ordenLeyenda: undefined }])).toMatch(/leyenda/);
  });

  it("pide exactamente las medidas del tipo, cada una entre 0,5 y 300 m", () => {
    const conMedidas = (medidas: unknown) => conInstalaciones([{ ...cancha, medidas }]);
    expect(conMedidas({ largo: 100, ancho: 70 })).toMatch(/medidas/);
    expect(conMedidas({ largo: 100, ancho: 70, ingoal: 10, alto: 3 })).toMatch(/medidas/);
    expect(conMedidas({ largo: 100, ancho: 0.2, ingoal: 10 })).toMatch(/0,5 y 300/);
    expect(conMedidas({ largo: 301, ancho: 70, ingoal: 10 })).toMatch(/0,5 y 300/);
    expect(conMedidas(null)).toMatch(/medidas/);
  });
});
function redondeadas(puntos: [number, number][]) {
  return puntos.map(([e, n]) => [Number(e.toFixed(6)) + 0, Number(n.toFixed(6)) + 0]);
}

describe("huellaDeInstalacion", () => {
  it("sin rotación, el largo va de oeste a este, centrado en la posición", () => {
    const huella = huellaDeInstalacion({
      posicion: [10, 20],
      rotacion: 0,
      medidas: { largo: 36, ancho: 18 },
    });
    expect(redondeadas(huella)).toEqual([
      [-8, 11],
      [28, 11],
      [28, 29],
      [-8, 29],
    ]);
  });

  it("girada 90° en sentido horario, el largo va de norte a sur", () => {
    const huella = huellaDeInstalacion({
      posicion: [10, 20],
      rotacion: 90,
      medidas: { largo: 36, ancho: 18 },
    });
    // La esquina oeste-sur sin girar termina al noroeste.
    expect(redondeadas(huella)).toEqual([
      [1, 38],
      [1, 2],
      [19, 2],
      [19, 38],
    ]);
  });

  it("la cancha de rugby suma un in-goal en cada punta del largo", () => {
    const huella = huellaDeInstalacion({
      posicion: [0, 0],
      rotacion: 0,
      medidas: { largo: 100, ancho: 70, ingoal: 10 },
    });
    expect(redondeadas(huella)).toEqual([
      [-60, -35],
      [60, -35],
      [60, 35],
      [-60, 35],
    ]);
  });
});

describe("medidasDelTipo", () => {
  it("sin medidas guardadas, usa las del tipo por defecto", () => {
    expect(medidasDelTipo("pileta", null)).toEqual({ largo: 25, ancho: 12 });
  });

  it("si cambió el tipo, conserva las medidas que coinciden y completa o descarta el resto", () => {
    // Era una «Otra» (largo, ancho, alto) y ahora es una cancha de rugby.
    expect(medidasDelTipo("cancha_rugby", { largo: 90, ancho: 60, alto: 3 })).toEqual({
      largo: 90,
      ancho: 60,
      ingoal: 10,
    });
  });

  it("cambia una medida guardada que no es un número positivo por la del tipo", () => {
    expect(medidasDelTipo("pileta", { largo: -4, ancho: "x" })).toEqual({ largo: 25, ancho: 12 });
  });
});

// ---------------------------------------------------------------------------
// Elementos de referencia (#46)
// ---------------------------------------------------------------------------

const OMBU_ID = "6f1c1f7e-0d7a-4c43-9d3e-1a2b3c4d5e6f";
const GRADAS_ID = "0b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

const ombu: ReferenciaUbicada = {
  id: OMBU_ID,
  tipo: "arbol",
  nombre: "El ombú",
  posicion: [-78, -18],
  rotacion: 0,
  medidas: { alto: 12, copa: 14 },
  descripcion: "Al lado de la cancha principal.",
  ordenLeyenda: 2,
};
const gradas: ReferenciaUbicada = {
  id: GRADAS_ID,
  tipo: "gradas",
  nombre: null,
  posicion: [8, -40],
  rotacion: 137,
  medidas: { largo: 20, ancho: 4, alto: 2 },
  descripcion: null,
  ordenLeyenda: null,
};
const canchaConNumero: InstalacionUbicada = {
  instalacionId: "cancha",
  posicion: [40, -60],
  rotacion: 47,
  medidas: { largo: 100, ancho: 70, ingoal: 10 },
  descripcion: null,
  ordenLeyenda: 1,
};
const conReferencias: DatosPredio = {
  origen: { lat: -37.336, lng: -59.08 },
  area: [],
  instalaciones: [canchaConNumero],
  referencias: [ombu, gradas],
};

describe("errorDelPredio con elementos de referencia", () => {
  const tipos = new Map([["cancha", "cancha_rugby" as const]]);
  const con = (referencias: unknown) => errorDelPredio({ ...conReferencias, referencias }, tipos);

  it("acepta árboles, gradas y demás con las medidas de su tipo, con nombre o sin él", () => {
    expect(con([ombu, gradas])).toBeNull();
    expect(
      con([
        { ...ombu, id: "a6b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d", tipo: "piedra", nombre: null, medidas: { diametro: 1.5, alto: 1 }, ordenLeyenda: null },
        { ...gradas, id: "b7c2d3e4-f5a6-4b7c-9d8e-0f1a2b3c4d5e", tipo: "tribuna" },
        { ...gradas, id: "c8d3e4f5-a6b7-4c8d-8e9f-1a2b3c4d5e6f", tipo: "bebedero", medidas: { largo: 1, ancho: 0.5, alto: 1 } },
      ]),
    ).toBeNull();
  });

  it("rechaza un tipo que no está en código (los caminos van aparte)", () => {
    expect(con([{ ...gradas, tipo: "camino" }])).toMatch(/tipo/);
  });

  it("pide exactamente las medidas del tipo", () => {
    expect(con([{ ...ombu, medidas: { alto: 12 } }])).toMatch(/medidas/);
    expect(con([{ ...ombu, medidas: { largo: 20, ancho: 4, alto: 2 } }])).toMatch(/medidas/);
    expect(con([{ ...ombu, medidas: { alto: 400, copa: 14 } }])).toMatch(/0,5 y 300/);
  });

  it(`acepta un nombre de hasta ${NOMBRE_MAXIMO} caracteres`, () => {
    expect(con([{ ...ombu, nombre: "a".repeat(NOMBRE_MAXIMO) }])).toBeNull();
    expect(con([{ ...ombu, nombre: "a".repeat(NOMBRE_MAXIMO + 1) }])).toMatch(/nombre/);
    expect(con([{ ...ombu, nombre: 7 }])).toMatch(/nombre/);
  });

  it("pide un id propio para cada uno", () => {
    expect(con([{ ...ombu, id: "ombu" }])).toMatch(/no es válido/);
    expect(con([ombu, { ...gradas, id: OMBU_ID }])).toMatch(/dos veces/);
  });

  it("valida posición, rotación, descripción y lugar en la leyenda como en una instalación", () => {
    expect(con([{ ...ombu, posicion: [6000, 0] }])).toMatch(/lejos/);
    expect(con([{ ...ombu, rotacion: "0" }])).toMatch(/rotación/);
    expect(con([{ ...ombu, descripcion: "a".repeat(281) }])).toMatch(/280/);
    expect(con([{ ...ombu, ordenLeyenda: 0 }])).toMatch(/leyenda/);
  });

  it("pide la lista de elementos de referencia", () => {
    expect(con(undefined)).toMatch(/referencia/);
  });
});

describe("hayCambiosEnPredio con elementos de referencia", () => {
  const con = (referencias: ReferenciaUbicada[], instalaciones = conReferencias.instalaciones) => ({
    ...conReferencias,
    instalaciones,
    referencias,
  });

  it("no ve cambios por ruido ni por otro orden de la lista", () => {
    expect(
      hayCambiosEnPredio(conReferencias, con([gradas, { ...ombu, posicion: [-78.004, -18], nombre: " El  ombú " }])),
    ).toBe(false);
  });

  it("ve uno agregado, borrado, movido, renombrado o con otra medida", () => {
    expect(hayCambiosEnPredio(conReferencias, con([ombu]))).toBe(true);
    expect(hayCambiosEnPredio(conReferencias, con([ombu, gradas, { ...gradas, id: "otro" }]))).toBe(true);
    expect(hayCambiosEnPredio(conReferencias, con([{ ...ombu, posicion: [-70, -18] }, gradas]))).toBe(true);
    expect(hayCambiosEnPredio(conReferencias, con([{ ...ombu, nombre: "El ombú viejo" }, gradas]))).toBe(true);
    expect(hayCambiosEnPredio(conReferencias, con([{ ...ombu, nombre: null }, gradas]))).toBe(true);
    expect(hayCambiosEnPredio(conReferencias, con([{ ...ombu, medidas: { alto: 12, copa: 10 } }, gradas]))).toBe(true);
  });

  it("la leyenda es una sola: ve un elemento de referencia que pasa adelante de una instalación", () => {
    expect(
      hayCambiosEnPredio(
        conReferencias,
        con([{ ...ombu, ordenLeyenda: 1 }, gradas], [{ ...canchaConNumero, ordenLeyenda: 2 }]),
      ),
    ).toBe(true);
  });
});

describe("predioParaGuardar con elementos de referencia", () => {
  it("limpia el nombre, redondea y numera la leyenda junto con las instalaciones", () => {
    const guardado = predioParaGuardar({
      ...conReferencias,
      instalaciones: [{ ...canchaConNumero, ordenLeyenda: 4 }],
      referencias: [
        { ...ombu, nombre: "  El   ombú ", posicion: [-78.004, -18.123], ordenLeyenda: 9 },
        { ...gradas, nombre: "   ", rotacion: -90 },
      ],
    });
    expect(guardado.instalaciones[0].ordenLeyenda).toBe(1);
    expect(guardado.referencias).toEqual([
      { ...ombu, nombre: "El ombú", posicion: [-78, -18.12], ordenLeyenda: 2 },
      { ...gradas, nombre: null, rotacion: 270 },
    ]);
  });
});

describe("medidasDeReferencia", () => {
  it("sin medidas guardadas, usa las del tipo", () => {
    expect(medidasDeReferencia("arbol", null)).toEqual({ alto: 10, copa: 7 });
  });

  it("conserva las guardadas que sirven y completa el resto", () => {
    expect(medidasDeReferencia("arbol", { alto: 15, copa: -1, largo: 3 })).toEqual({ alto: 15, copa: 7 });
  });
});

describe("huellaDeReferencia", () => {
  it("el árbol ocupa un círculo del diámetro de su copa", () => {
    const huella = huellaDeReferencia({ tipo: "arbol", posicion: [10, 20], rotacion: 0, medidas: { alto: 12, copa: 14 } });
    expect(huella.length).toBeGreaterThanOrEqual(12);
    for (const [e, n] of huella) expect(Math.hypot(e - 10, n - 20)).toBeCloseTo(7, 6);
  });

  it("las gradas ocupan un rectángulo de largo por ancho, girado como una instalación", () => {
    const huella = huellaDeReferencia({ tipo: "gradas", posicion: [0, 0], rotacion: 90, medidas: { largo: 20, ancho: 4, alto: 2 } });
    expect(redondeadas(huella)).toEqual([
      [-2, 10],
      [-2, -10],
      [2, -10],
      [2, 10],
    ]);
  });

  it("con 0°, el frente de las gradas (el escalón más bajo) mira al sur", () => {
    const frente = frenteDeGradas({ posicion: [0, 0], rotacion: 0, medidas: { largo: 20, ancho: 4, alto: 2 } });
    expect(redondeadas(frente)).toEqual([
      [-10, -2],
      [10, -2],
    ]);
  });
});
