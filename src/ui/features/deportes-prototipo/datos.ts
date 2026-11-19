/**
 * PROTOTIPO (#54): tipos, datos de ejemplo y lógica de juguete para los mocks
 * de deportes. Nada se guarda. Se tira cuando se aprueben los mocks.
 */

export const ANIO_ACTUAL = 2026;

export type Sexo = "M" | "F";

export type Chequeo =
  | { tipo: "chequeo"; id: string; campo: "sexo"; valor: Sexo }
  | { tipo: "chequeo"; id: string; campo: "edad"; desde?: number; hasta?: number }
  | { tipo: "chequeo"; id: string; campo: "anio"; desde?: number; hasta?: number };

export type Campo = Chequeo["campo"];
export type Conector = "Y" | "O";

/** Subnivel: un grupo dentro de la condición. No admite otro subnivel. */
export type Subgrupo = { tipo: "grupo"; id: string; conector: Conector; items: Chequeo[] };

/** La condición de un deporte: chequeos y como máximo un subnivel de grupos. */
export type Condicion = { conector: Conector; items: (Chequeo | Subgrupo)[] };

export type Deporte = {
  id: string;
  nombre: string;
  icono: string; // clave del set de íconos (variante A)
  emoji: string; // variante B
  imagen?: string; // variante C: ícono subido (acá, iniciales sobre color)
  color: string;
  descripcion: string;
  condicion: Condicion;
  borrado: boolean;
  clubes: number;
  jugadores: number;
};

export type Jugador = {
  id: string;
  nombre: string;
  sexo: Sexo;
  nacimiento: number; // año
  otrosDeportes: string[];
};

let n = 0;
export const nuevoId = () => `id-${++n}-${Math.random().toString(36).slice(2, 6)}`;

export const CAMPOS: { campo: Campo; etiqueta: string }[] = [
  { campo: "sexo", etiqueta: "Sexo" },
  { campo: "edad", etiqueta: "Edad que cumple en el año" },
  { campo: "anio", etiqueta: "Año de nacimiento" },
];

export function nuevoChequeo(campo: Campo): Chequeo {
  const id = nuevoId();
  if (campo === "sexo") return { tipo: "chequeo", id, campo, valor: "M" };
  return { tipo: "chequeo", id, campo };
}

export function nuevoSubgrupo(conectorPadre: Conector): Subgrupo {
  return {
    tipo: "grupo",
    id: nuevoId(),
    conector: conectorPadre === "Y" ? "O" : "Y",
    items: [nuevoChequeo("edad"), nuevoChequeo("sexo")],
  };
}

const c = (x: Omit<Extract<Chequeo, { campo: "sexo" }>, "tipo" | "id">): Chequeo => ({ tipo: "chequeo", id: nuevoId(), ...x });
const r = (campo: "edad" | "anio", desde?: number, hasta?: number): Chequeo => ({ tipo: "chequeo", id: nuevoId(), campo, desde, hasta });

export const CATALOGO: Deporte[] = [
  {
    id: "rugby-m",
    nombre: "Rugby masculino",
    icono: "goal",
    emoji: "🏉",
    color: "#2f6b3a",
    descripcion: "Rugby XV para varones, de infantiles a plantel superior.",
    condicion: { conector: "Y", items: [c({ campo: "sexo", valor: "M" }), r("edad", 16)] },
    borrado: false,
    clubes: 4,
    jugadores: 212,
  },
  {
    id: "hockey-f",
    nombre: "Hockey femenino",
    icono: "hockey",
    emoji: "🏑",
    color: "#7a3a8c",
    descripcion: "Hockey sobre césped para mujeres.",
    condicion: { conector: "Y", items: [c({ campo: "sexo", valor: "F" })] },
    borrado: false,
    clubes: 3,
    jugadores: 148,
  },
  {
    id: "rugby-inf",
    nombre: "Rugby infantil",
    icono: "volleyball",
    emoji: "🧒",
    color: "#b5651d",
    descripcion: "Escuelita mixta, hasta los 12.",
    condicion: { conector: "Y", items: [r("edad", undefined, 12)] },
    borrado: false,
    clubes: 2,
    jugadores: 64,
  },
  {
    id: "tenis",
    nombre: "Tenis",
    icono: "target",
    emoji: "🎾",
    color: "#a08a00",
    descripcion: "Abierto a todos los socios.",
    condicion: { conector: "Y", items: [] },
    borrado: false,
    clubes: 1,
    jugadores: 30,
  },
  {
    id: "natacion",
    nombre: "Natación master",
    icono: "waves",
    emoji: "🏊",
    color: "#1f5f8b",
    descripcion: "Pileta para adultos. Mujeres desde los 20, todos desde los 25.",
    condicion: {
      conector: "O",
      items: [r("edad", 25), { tipo: "grupo", id: nuevoId(), conector: "Y", items: [c({ campo: "sexo", valor: "F" }), r("edad", 20)] }],
    },
    borrado: false,
    clubes: 1,
    jugadores: 41,
  },
  {
    id: "futbol-vet",
    nombre: "Fútbol veteranos",
    icono: "trophy",
    emoji: "⚽",
    color: "#555555",
    descripcion: "Varones nacidos en 1986 o antes.",
    condicion: { conector: "Y", items: [c({ campo: "sexo", valor: "M" }), r("anio", undefined, 1986)] },
    borrado: true,
    clubes: 2,
    jugadores: 37,
  },
];

/** Deportes que eligió el club Los Cardos. */
export const DEL_CLUB = ["rugby-m", "hockey-f", "rugby-inf"];

/** Jugadores de Rugby masculino en Los Cardos: el Super Admin sumó «16 años o más» y dos quedan en conflicto. */
export const JUGADORES_RUGBY: Jugador[] = [
  { id: "j1", nombre: "Tomás Aguirre", sexo: "M", nacimiento: 2004, otrosDeportes: [] },
  { id: "j2", nombre: "Bautista Ferreyra", sexo: "M", nacimiento: 2008, otrosDeportes: ["Tenis"] },
  { id: "j3", nombre: "Lucía Benítez", sexo: "F", nacimiento: 2007, otrosDeportes: ["Hockey femenino"] },
  { id: "j4", nombre: "Joaquín Ruiz", sexo: "M", nacimiento: 2001, otrosDeportes: [] },
  { id: "j5", nombre: "Santino Gómez", sexo: "M", nacimiento: 2012, otrosDeportes: [] },
  { id: "j6", nombre: "Mateo Sosa", sexo: "M", nacimiento: 1998, otrosDeportes: [] },
  { id: "j7", nombre: "Felipe Domínguez", sexo: "M", nacimiento: 2009, otrosDeportes: [] },
  { id: "j8", nombre: "Juan Cruz Medina", sexo: "M", nacimiento: 2006, otrosDeportes: [] },
];

/** Socios de ejemplo para la vista previa de «quiénes pueden jugar». */
export const SOCIOS_EJEMPLO: Jugador[] = [
  { id: "s1", nombre: "Varón, 10 años", sexo: "M", nacimiento: 2016, otrosDeportes: [] },
  { id: "s2", nombre: "Mujer, 14 años", sexo: "F", nacimiento: 2012, otrosDeportes: [] },
  { id: "s3", nombre: "Varón, 17 años", sexo: "M", nacimiento: 2009, otrosDeportes: [] },
  { id: "s4", nombre: "Mujer, 22 años", sexo: "F", nacimiento: 2004, otrosDeportes: [] },
  { id: "s5", nombre: "Varón, 30 años", sexo: "M", nacimiento: 1996, otrosDeportes: [] },
  { id: "s6", nombre: "Mujer, 45 años", sexo: "F", nacimiento: 1981, otrosDeportes: [] },
];

// ---------- lógica ----------

export const edad = (j: Jugador) => ANIO_ACTUAL - j.nacimiento;

const enRango = (v: number, desde?: number, hasta?: number) =>
  (desde === undefined || v >= desde) && (hasta === undefined || v <= hasta);

export function cumpleChequeo(ch: Chequeo, j: Jugador): boolean {
  if (ch.campo === "sexo") return j.sexo === ch.valor;
  if (ch.campo === "edad") return enRango(edad(j), ch.desde, ch.hasta);
  return enRango(j.nacimiento, ch.desde, ch.hasta);
}

function cumpleItems(conector: Conector, items: (Chequeo | Subgrupo)[], j: Jugador): boolean {
  if (items.length === 0) return true;
  const res = items.map((it) => (it.tipo === "grupo" ? cumpleItems(it.conector, it.items, j) : cumpleChequeo(it, j)));
  return conector === "Y" ? res.every(Boolean) : res.some(Boolean);
}

export const cumple = (cond: Condicion, j: Jugador) => cumpleItems(cond.conector, cond.items, j);

/** Chequeos de primer nivel que no cumple (para explicar el conflicto). */
export function motivosConflicto(cond: Condicion, j: Jugador): string[] {
  if (cumple(cond, j)) return [];
  if (cond.conector === "O") return [`No cumple ninguna de: ${describir(cond)}`];
  return cond.items
    .filter((it) => (it.tipo === "grupo" ? !cumpleItems(it.conector, it.items, j) : !cumpleChequeo(it, j)))
    .map((it) => (it.tipo === "grupo" ? `(${describirItems(it.conector, it.items)})` : describirChequeo(it)));
}

export function describirChequeo(ch: Chequeo): string {
  if (ch.campo === "sexo") return ch.valor === "M" ? "masculino" : "femenino";
  const { desde, hasta } = ch;
  if (ch.campo === "edad") {
    if (desde !== undefined && hasta !== undefined) return `de ${desde} a ${hasta} años`;
    if (desde !== undefined) return `${desde} años o más`;
    if (hasta !== undefined) return `hasta ${hasta} años`;
    return "cualquier edad";
  }
  if (desde !== undefined && hasta !== undefined) return desde === hasta ? `nacidos en ${desde}` : `nacidos de ${desde} a ${hasta}`;
  if (desde !== undefined) return `nacidos en ${desde} o después`;
  if (hasta !== undefined) return `nacidos en ${hasta} o antes`;
  return "cualquier año";
}

function describirItems(conector: Conector, items: (Chequeo | Subgrupo)[]): string {
  const sep = conector === "Y" ? " y " : " o ";
  return items
    .map((it) => (it.tipo === "grupo" ? `(${describirItems(it.conector, it.items)})` : describirChequeo(it)))
    .join(sep);
}

export function describir(cond: Condicion): string {
  if (cond.items.length === 0) return "Sin condición: puede jugar cualquier socio";
  const t = describirItems(cond.conector, cond.items);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Cambia un ítem (chequeo o subgrupo) por id, en cualquier nivel. */
export function reemplazar(cond: Condicion, id: string, nuevo: Chequeo | Subgrupo | null): Condicion {
  const items = cond.items.flatMap((it): (Chequeo | Subgrupo)[] => {
    if (it.id === id) return nuevo ? [nuevo] : [];
    if (it.tipo === "grupo") {
      const sub = it.items.flatMap((ch) => (ch.id === id ? (nuevo && nuevo.tipo === "chequeo" ? [nuevo] : []) : [ch]));
      return [{ ...it, items: sub }];
    }
    return [it];
  });
  return { ...cond, items: items.filter((it) => it.tipo === "chequeo" || it.items.length > 0) };
}

export function agregarEnSubgrupo(cond: Condicion, grupoId: string, ch: Chequeo): Condicion {
  return {
    ...cond,
    items: cond.items.map((it) => (it.tipo === "grupo" && it.id === grupoId ? { ...it, items: [...it.items, ch] } : it)),
  };
}

export const condicionVacia = (): Condicion => ({ conector: "Y", items: [] });
