import { describe, expect, it } from "vitest";
import {
  huellaDeInstalacion,
  huellaDeReferencia,
  type DatosPredio,
  type InstalacionUbicada,
  type ReferenciaUbicada,
} from "./predio";
import { medidasPorDefecto, TIPOS_INSTALACION } from "./tipos-instalacion";
import { medidasPorDefectoDeReferencia, TIPOS_REFERENCIA } from "./tipos-referencia";
import {
  COLOR_AGUA,
  escalonesDeGradas,
  piezasDeInstalacion,
  piezasDeReferencia,
  predioArmado,
  predioParaVisor,
  type Pieza,
} from "./predio-3d";

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
  descripcion: "La cancha principal.",
  ordenLeyenda: 1,
};

function predio(cambios: Partial<DatosPredio> = {}): DatosPredio {
  return {
    origen: { lat: -37.3, lng: -59.1 },
    area: AREA,
    instalaciones: [CANCHA_1],
    referencias: [],
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
          descripcion: "La cancha principal.",
          numero: 1,
        },
      ],
      referencias: [],
      leyenda: [
        { id: "cancha-1", numero: 1, nombre: "Cancha 1", descripcion: "La cancha principal." },
      ],
    });
  });

  const OMBU: ReferenciaUbicada = {
    id: "ombu",
    tipo: "arbol",
    nombre: "El ombú",
    posicion: [20, 30],
    rotacion: 0,
    medidas: { alto: 12, copa: 14 },
    descripcion: "Al lado de la cancha principal.",
    ordenLeyenda: 1,
  };
  const GRADAS: ReferenciaUbicada = {
    id: "gradas",
    tipo: "gradas",
    nombre: null,
    posicion: [100, 20],
    rotacion: 180,
    medidas: { largo: 20, ancho: 4, alto: 2 },
    descripcion: null,
    ordenLeyenda: 3,
  };

  it("trae los elementos de referencia; sin nombre propio, se llaman como su tipo", () => {
    const visor = predioParaVisor(
      predio({ instalaciones: [{ ...CANCHA_1, ordenLeyenda: 2 }], referencias: [OMBU, GRADAS] }),
      DE_LA_SEDE,
    );
    expect(visor?.referencias).toEqual([
      {
        id: "ombu",
        tipo: "arbol",
        nombre: "El ombú",
        posicion: [20, 30],
        rotacion: 0,
        medidas: { alto: 12, copa: 14 },
        descripcion: "Al lado de la cancha principal.",
        numero: 1,
      },
      expect.objectContaining({ id: "gradas", nombre: "Gradas", numero: 3 }),
    ]);
  });

  it("instalaciones y elementos de referencia comparten la leyenda", () => {
    const visor = predioParaVisor(
      predio({ instalaciones: [{ ...CANCHA_1, ordenLeyenda: 2 }], referencias: [OMBU, GRADAS] }),
      DE_LA_SEDE,
    );
    expect(visor?.leyenda.map((e) => [e.numero, e.nombre])).toEqual([
      [1, "El ombú"],
      [2, "Cancha 1"],
      [3, "Gradas"],
    ]);
  });

  it("los elementos de referencia solos no arman el predio", () => {
    expect(predioArmado(predio({ instalaciones: [], referencias: [OMBU] }))).toBe(false);
    expect(predioParaVisor(predio({ instalaciones: [], referencias: [OMBU] }), DE_LA_SEDE)).toBeNull();
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
      descripcion: null,
      ordenLeyenda: null,
    };
    const borrada: InstalacionUbicada = { ...pileta, instalacionId: "borrada" };
    const visor = predioParaVisor(predio({ instalaciones: [borrada, pileta] }), DE_LA_SEDE);
    expect(visor?.instalaciones.map((i) => i.id)).toEqual(["pileta"]);
  });

  it("numera según el orden de la leyenda y la lista en ese orden; lo demás va sin número", () => {
    const enLaSede = [
      ...DE_LA_SEDE,
      { id: "house", nombre: "House", tipo: "house" as const },
    ];
    const ubicada = (instalacionId: string, ordenLeyenda: number | null): InstalacionUbicada => ({
      ...CANCHA_1,
      instalacionId,
      descripcion: null,
      ordenLeyenda,
    });
    const visor = predioParaVisor(
      predio({ instalaciones: [ubicada("cancha-1", 2), ubicada("pileta", null), ubicada("house", 1)] }),
      enLaSede,
    );
    expect(visor?.instalaciones.map((i) => [i.id, i.numero])).toEqual([
      ["cancha-1", 2],
      ["pileta", null],
      ["house", 1],
    ]);
    expect(visor?.leyenda.map((e) => [e.numero, e.nombre])).toEqual([
      [1, "House"],
      [2, "Cancha 1"],
    ]);
  });

  it("si una instalación de la leyenda ya no es de la sede, los números no saltan", () => {
    const ubicada = (instalacionId: string, ordenLeyenda: number): InstalacionUbicada => ({
      ...CANCHA_1,
      instalacionId,
      ordenLeyenda,
    });
    const visor = predioParaVisor(
      predio({ instalaciones: [ubicada("borrada", 1), ubicada("cancha-1", 2), ubicada("pileta", 3)] }),
      DE_LA_SEDE,
    );
    expect(visor?.leyenda.map((e) => [e.numero, e.id])).toEqual([
      [1, "cancha-1"],
      [2, "pileta"],
    ]);
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

describe("piezasDeReferencia", () => {
  /** Cuánto ocupan las piezas: [largo (x), alto (y, desde el piso), ancho (z)]. */
  const ocupan = (piezas: Pieza[]) => {
    const hasta = (eje: 0 | 2) =>
      2 * Math.max(...piezas.map((p) => Math.abs(p.centro[eje]) + p.tamano[eje] / 2));
    const arriba = Math.max(...piezas.map((p) => p.centro[1] + p.tamano[1] / 2));
    return [hasta(0), arriba, hasta(2)];
  };

  it("el árbol tiene la altura y el diámetro de copa de sus medidas", () => {
    const piezas = piezasDeReferencia("arbol", { alto: 12, copa: 14 });
    expect(ocupan(piezas)).toEqual([14, 12, 14]);
    expect(piezas.map((p) => p.forma)).toEqual(["cilindro", "esfera"]);
  });

  it("la piedra es una roca de su diámetro y su alto", () => {
    expect(piezasDeReferencia("piedra", { diametro: 1.5, alto: 1 })).toEqual([
      expect.objectContaining({ forma: "roca", centro: [0, 0.5, 0], tamano: [1.5, 1, 1.5] }),
    ]);
  });

  it("el bebedero mide largo × alto × ancho", () => {
    expect(ocupan(piezasDeReferencia("bebedero", { largo: 1, ancho: 0.5, alto: 1 }))).toEqual([1, 1, 0.5]);
  });

  it("las gradas son escalones que suben hacia atrás, hasta el alto", () => {
    const piezas = piezasDeReferencia("gradas", { largo: 20, ancho: 4, alto: 2 });
    expect(piezas).toHaveLength(escalonesDeGradas(2));
    expect(ocupan(piezas)).toEqual([20, 2, 4]);
    // El frente (z positivo) es el escalón más bajo.
    const porFondo = [...piezas].sort((a, b) => b.centro[2] - a.centro[2]);
    const altos = porFondo.map((p) => p.tamano[1]);
    expect(altos).toEqual([...altos].sort((a, b) => a - b));
  });

  it("la cantidad de escalones sale del alto: unos 45 cm cada uno", () => {
    expect(escalonesDeGradas(2)).toBe(4);
    expect(escalonesDeGradas(3)).toBe(7);
    expect(escalonesDeGradas(0.5)).toBe(1);
  });

  it("la tribuna son las mismas gradas con techo", () => {
    const medidas = { largo: 30, ancho: 6, alto: 3 };
    const gradas = piezasDeReferencia("gradas", medidas);
    const tribuna = piezasDeReferencia("tribuna", medidas);
    expect(tribuna.slice(0, gradas.length)).toEqual(gradas);
    const [largo, alto, ancho] = ocupan(tribuna);
    expect([largo, ancho]).toEqual([30, 6]);
    expect(alto).toBeGreaterThan(3 + 2);
  });

  it.each(TIPOS_REFERENCIA.map((t) => [t.nombre, t.clave] as const))(
    "%s ocupa en el piso lo mismo que su huella en el editor",
    (_, tipo) => {
      const medidas = medidasPorDefectoDeReferencia(tipo);
      const huella = huellaDeReferencia({ tipo, posicion: [0, 0], rotacion: 0, medidas });
      const largo = Math.max(...huella.map((p) => p[0])) - Math.min(...huella.map((p) => p[0]));
      const ancho = Math.max(...huella.map((p) => p[1])) - Math.min(...huella.map((p) => p[1]));
      const [x, , z] = ocupan(piezasDeReferencia(tipo, medidas));
      expect(x).toBeCloseTo(largo, 6);
      expect(z).toBeCloseTo(ancho, 6);
    },
  );
});
