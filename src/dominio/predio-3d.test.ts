import { describe, expect, it } from "vitest";
import { huellaDeInstalacion, type DatosPredio, type InstalacionUbicada } from "./predio";
import { medidasPorDefecto, TIPOS_INSTALACION } from "./tipos-instalacion";
import { COLOR_AGUA, piezasDeInstalacion, predioArmado, predioParaVisor, type Pieza } from "./predio-3d";

const AREA: DatosPredio["area"] = [
  [0, 0],
  [200, 0],
  [200, 150],
  [0, 150],
];

const CANCHA_1: InstalacionUbicada = {
  instalacionId: "cancha-1",
  posicion: [100, 75],
  rotacion: 0,
  medidas: { largo: 100, ancho: 70, ingoal: 10 },
};

function predio(cambios: Partial<DatosPredio> = {}): DatosPredio {
  return {
    origen: { lat: -37.3, lng: -59.1 },
    area: AREA,
    instalaciones: [CANCHA_1],
    ...cambios,
  };
}

describe("predioArmado", () => {
  it("un predio con área y una instalación ubicada está armado", () => {
    expect(predioArmado(predio())).toBe(true);
  });

  it("sin predio guardado no está armado", () => {
    expect(predioArmado(null)).toBe(false);
  });

  it("sin área no está armado, aunque tenga instalaciones", () => {
    expect(predioArmado(predio({ area: [] }))).toBe(false);
  });

  it("con área pero sin instalaciones ubicadas no está armado", () => {
    expect(predioArmado(predio({ instalaciones: [] }))).toBe(false);
  });
});

describe("predioParaVisor", () => {
  const DE_LA_SEDE = [
    { id: "cancha-1", nombre: "Cancha 1", tipo: "cancha_rugby" as const },
    { id: "pileta", nombre: "Pileta", tipo: "pileta" as const },
  ];

  it("trae el área y cada instalación ubicada con su nombre y su tipo", () => {
    expect(predioParaVisor(predio(), DE_LA_SEDE)).toEqual({
      area: AREA,
      instalaciones: [
        {
          id: "cancha-1",
          nombre: "Cancha 1",
          tipo: "cancha_rugby",
          posicion: [100, 75],
          rotacion: 0,
          medidas: { largo: 100, ancho: 70, ingoal: 10 },
        },
      ],
    });
  });

  it("no muestra nada si el predio no está armado", () => {
    expect(predioParaVisor(null, DE_LA_SEDE)).toBeNull();
    expect(predioParaVisor(predio({ area: [] }), DE_LA_SEDE)).toBeNull();
    expect(predioParaVisor(predio({ instalaciones: [] }), DE_LA_SEDE)).toBeNull();
  });

  it("deja afuera una instalación ubicada que ya no es de la sede", () => {
    const pileta: InstalacionUbicada = {
      instalacionId: "pileta",
      posicion: [20, 20],
      rotacion: 90,
      medidas: { largo: 25, ancho: 12 },
    };
    const borrada: InstalacionUbicada = { ...pileta, instalacionId: "borrada" };
    const visor = predioParaVisor(predio({ instalaciones: [borrada, pileta] }), DE_LA_SEDE);
    expect(visor?.instalaciones.map((i) => i.id)).toEqual(["pileta"]);
  });

  it("si ninguna instalación ubicada sigue en la sede, no muestra nada", () => {
    expect(predioParaVisor(predio(), [])).toBeNull();
  });
});

describe("piezasDeInstalacion", () => {
  const cajas = (piezas: Pieza[]) => piezas.filter((p) => p.forma === "caja");
  /** Cuánto ocupan las piezas en el piso: [largo, ancho]. */
  const ocupan = (piezas: Pieza[]) => {
    const hasta = (eje: 0 | 2) =>
      2 * Math.max(...piezas.map((p) => Math.abs(p.centro[eje]) + p.tamano[eje] / 2));
    return [hasta(0), hasta(2)];
  };

  it("un edificio es un cuerpo de largo × alto × ancho apoyado en el piso, con techo encima", () => {
    const piezas = piezasDeInstalacion("house", { largo: 30, ancho: 15, alto: 5 });
    expect(cajas(piezas)).toEqual([
      expect.objectContaining({ centro: [0, 2.5, 0], tamano: [30, 5, 15] }),
    ]);
    const techo = piezas.find((p) => p.forma === "techo");
    expect(techo?.tamano[0]).toBe(30);
    expect(techo?.tamano[2]).toBe(15);
    expect(techo!.centro[1] - techo!.tamano[1] / 2).toBe(5);
  });

  it("«Otra» es un bloque de largo × alto × ancho, sin techo", () => {
    expect(piezasDeInstalacion("otra", { largo: 10, ancho: 6, alto: 3 })).toEqual([
      expect.objectContaining({ forma: "caja", centro: [0, 1.5, 0], tamano: [10, 3, 6] }),
    ]);
  });

  it("la pileta mide largo × ancho en total, con el agua adentro del borde", () => {
    const piezas = piezasDeInstalacion("pileta", { largo: 25, ancho: 12 });
    expect(ocupan(piezas)).toEqual([25, 12]);
    const agua = piezas.find((p) => p.color === COLOR_AGUA);
    expect(agua!.tamano[0]).toBeLessThan(25);
    expect(agua!.tamano[2]).toBeLessThan(12);
  });

  it("la cancha de rugby ocupa el largo más un in-goal en cada punta, con las haches en las líneas de try", () => {
    const piezas = piezasDeInstalacion("cancha_rugby", { largo: 100, ancho: 70, ingoal: 10 });
    expect(ocupan(piezas)).toEqual([120, 70]);
    const palos = cajas(piezas).filter((p) => p.tamano[1] > 5);
    expect(palos).toHaveLength(4);
    expect(new Set(palos.map((p) => Math.abs(p.centro[0])))).toEqual(new Set([50]));
  });

  it.each(TIPOS_INSTALACION.map((t) => [t.nombre, t.clave] as const))(
    "%s ocupa en el piso lo mismo que su huella en el editor",
    (_, clave) => {
      const medidas = medidasPorDefecto(clave);
      const huella = huellaDeInstalacion({ posicion: [0, 0], rotacion: 0, medidas });
      const largo = huella[1][0] - huella[0][0];
      const ancho = huella[3][1] - huella[0][1];
      const [x, z] = ocupan(piezasDeInstalacion(clave, medidas));
      expect(x).toBeCloseTo(largo, 6);
      expect(z).toBeCloseTo(ancho, 6);
    },
  );

  it("con otras medidas, la instalación cambia de tamaño", () => {
    const piezas = piezasDeInstalacion("cancha_hockey", { largo: 80, ancho: 50 });
    expect(ocupan(piezas)).toEqual([80, 50]);
  });
});
