import { describe, expect, it } from "vitest";
import {
  aCoordenadas,
  aMetros,
  coordenadasDesdeNominatim,
  errorDelArea,
  errorDelPredio,
  hayCambiosEnPredio,
  ORIGEN_POR_DEFECTO,
  origenInicial,
  predioParaGuardar,
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
  const guardado = { origen: { lat: -37.336, lng: -59.08 }, area: [[0, 0], [10, 0], [10, 10]] as [number, number][] };

  it("no ve cambios por ruido de menos de un centímetro", () => {
    expect(
      hayCambiosEnPredio(guardado, {
        origen: { lat: -37.33600000001, lng: -59.08 },
        area: [[0.001, 0], [10, 0.002], [10, 10]],
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
      }),
    ).toEqual({
      origen: { lat: -37.3360012, lng: -59.08 },
      area: [[1.23, -7.89], [10, 0], [10, 10.01]],
    });
  });
});

describe("errorDelPredio", () => {
  it("acepta un origen válido con o sin área", () => {
    expect(errorDelPredio({ origen: { lat: -37.3, lng: -59.1 }, area: [] })).toBeNull();
    expect(
      errorDelPredio({ origen: { lat: -37.3, lng: -59.1 }, area: [[0, 0], [10, 0], [0, 10]] }),
    ).toBeNull();
  });

  it("rechaza un origen fuera del mapa o que no es número", () => {
    expect(errorDelPredio({ origen: { lat: 91, lng: 0 }, area: [] })).toMatch(/origen/);
    expect(errorDelPredio({ origen: { lat: "x", lng: 0 }, area: [] })).toMatch(/origen/);
    expect(errorDelPredio({ area: [] })).toMatch(/origen/);
    expect(errorDelPredio(null)).toBeTruthy();
  });

  it("trae el error del área", () => {
    expect(errorDelPredio({ origen: { lat: 0, lng: 0 }, area: [[0, 0]] })).toMatch(/tres puntos/);
  });
});
