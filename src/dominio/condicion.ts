/**
 * Condición para anotarse (#74): chequeos sobre el sexo y la fecha de
 * nacimiento de una persona, unidos por Y u O, con como máximo un subnivel
 * (un grupo de chequeos con su propio Y/O, sin otro grupo adentro).
 *
 * No depende de quién la usa: hoy la tiene el deporte; la van a usar la
 * condición del club (#77) y las categorías (#57). La base valida la misma
 * forma con interno.es_condicion_valida.
 */

export type Sexo = "M" | "F";
export type Conector = "Y" | "O";

export type Chequeo =
  | { campo: "sexo"; valor: Sexo }
  /** Edad que cumple en el año: año actual − año de nacimiento. */
  | { campo: "edad"; desde?: number; hasta?: number }
  /** Año de nacimiento. */
  | { campo: "anio"; desde?: number; hasta?: number };

export type Campo = Chequeo["campo"];
export type ChequeoRango = Extract<Chequeo, { campo: "edad" | "anio" }>;

/** El subnivel: chequeos con su propio conector, sin otro grupo adentro. */
export type Subgrupo = { conector: Conector; items: Chequeo[] };

export type Condicion = { conector: Conector; items: (Chequeo | Subgrupo)[] };

/** Lo que hace falta saber de una persona para ver si cumple una condición. */
export type Persona = {
  sexo: Sexo;
  /** Fecha ISO, `AAAA-MM-DD`. */
  fechaNacimiento: string;
};

/** Dónde está un chequeo: `[i]` arriba, `[i, j]` dentro del subgrupo `i`. */
export type Ubicacion = [number] | [number, number];

export const CONDICION_VACIA: Condicion = { conector: "Y", items: [] };

export const TEXTO_SIN_CONDICION = "Sin condición: puede anotarse cualquier socio";

export const CAMPOS: { campo: Campo; etiqueta: string }[] = [
  { campo: "sexo", etiqueta: "Sexo" },
  { campo: "edad", etiqueta: "Edad que cumple en el año" },
  { campo: "anio", etiqueta: "Año de nacimiento" },
];

/** Los límites de cada rango. La base usa los mismos (interno.es_condicion_valida). */
export const LIMITES: Record<ChequeoRango["campo"], { min: number; max: number }> = {
  edad: { min: 0, max: 120 },
  anio: { min: 1900, max: 2100 },
};

export function esSubgrupo(item: Chequeo | Subgrupo): item is Subgrupo {
  return "items" in item;
}

export function tieneSubgrupo(condicion: Condicion): boolean {
  return condicion.items.some(esSubgrupo);
}

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

export type ResultadoCondicion =
  | { ok: true; condicion: Condicion }
  | { ok: false; error: string };

class FormaInvalida extends Error {}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Las claves con `undefined` cuentan como ausentes, como en JSON. */
function clavesDefinidas(objeto: Record<string, unknown>): string[] {
  return Object.keys(objeto).filter((clave) => objeto[clave] !== undefined);
}

function soloClaves(objeto: Record<string, unknown>, permitidas: string[]) {
  if (clavesDefinidas(objeto).some((clave) => !permitidas.includes(clave))) {
    throw new FormaInvalida("La condición tiene datos que no se reconocen.");
  }
}

function leerConector(valor: unknown): Conector {
  if (valor !== "Y" && valor !== "O") {
    throw new FormaInvalida("Cada bloque tiene que ser «Todas (Y)» o «Alguna (O)».");
  }
  return valor;
}

function leerChequeo(valor: unknown): Chequeo {
  if (!esObjeto(valor)) throw new FormaInvalida("Hay un chequeo que no se reconoce.");
  if (valor.campo === "sexo") {
    soloClaves(valor, ["campo", "valor"]);
    if (valor.valor !== "M" && valor.valor !== "F") {
      throw new FormaInvalida("Elegí masculino o femenino.");
    }
    return { campo: "sexo", valor: valor.valor };
  }
  if (valor.campo === "edad" || valor.campo === "anio") {
    const campo = valor.campo;
    soloClaves(valor, ["campo", "desde", "hasta"]);
    const { min, max } = LIMITES[campo];
    const nombre = campo === "edad" ? "La edad" : "El año de nacimiento";
    const extremo = (dato: unknown): number | undefined => {
      if (dato === undefined) return undefined;
      if (typeof dato !== "number" || !Number.isInteger(dato) || dato < min || dato > max) {
        throw new FormaInvalida(`${nombre} tiene que ser un número entero entre ${min} y ${max}.`);
      }
      return dato;
    };
    const desde = extremo(valor.desde);
    const hasta = extremo(valor.hasta);
    if (desde === undefined && hasta === undefined) {
      throw new FormaInvalida(`${nombre} necesita «desde», «hasta» o los dos.`);
    }
    if (desde !== undefined && hasta !== undefined && desde > hasta) {
      throw new FormaInvalida(`${nombre}: «desde» no puede ser mayor que «hasta».`);
    }
    return {
      campo,
      ...(desde !== undefined ? { desde } : {}),
      ...(hasta !== undefined ? { hasta } : {}),
    };
  }
  throw new FormaInvalida("Hay un chequeo que no se reconoce.");
}

function leerSubgrupo(valor: Record<string, unknown>): Subgrupo {
  soloClaves(valor, ["conector", "items"]);
  const conector = leerConector(valor.conector);
  if (!Array.isArray(valor.items)) throw new FormaInvalida("Hay un grupo que no se reconoce.");
  if (valor.items.length === 0) throw new FormaInvalida("Un grupo necesita al menos un chequeo.");
  const items = valor.items.map((item) => {
    if (esObjeto(item) && "items" in item) {
      throw new FormaInvalida("Un grupo no puede tener otro grupo adentro: hay un solo subnivel.");
    }
    return leerChequeo(item);
  });
  return { conector, items };
}

/** Lee una condición de un dato cualquiera (un JSON del form o de la base). */
export function validarCondicion(valor: unknown): ResultadoCondicion {
  try {
    if (!esObjeto(valor)) throw new FormaInvalida("La condición no se reconoce.");
    soloClaves(valor, ["conector", "items"]);
    const conector = leerConector(valor.conector);
    if (!Array.isArray(valor.items)) throw new FormaInvalida("La condición no se reconoce.");
    const items = valor.items.map((item) =>
      esObjeto(item) && "items" in item ? leerSubgrupo(item) : leerChequeo(item),
    );
    return { ok: true, condicion: { conector, items } };
  } catch (error) {
    if (error instanceof FormaInvalida) return { ok: false, error: error.message };
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Cumplimiento
// ---------------------------------------------------------------------------

function anioDe(fechaIso: string): number {
  return Number(fechaIso.slice(0, 4));
}

/** La edad que cumple en el año: año actual − año de nacimiento. */
export function edadEnElAnio(fechaNacimiento: string, anioActual: number): number {
  return anioActual - anioDe(fechaNacimiento);
}

function enRango(valor: number, desde?: number, hasta?: number): boolean {
  return (desde === undefined || valor >= desde) && (hasta === undefined || valor <= hasta);
}

function cumpleChequeo(chequeo: Chequeo, persona: Persona, anioActual: number): boolean {
  switch (chequeo.campo) {
    case "sexo":
      return persona.sexo === chequeo.valor;
    case "edad":
      return enRango(edadEnElAnio(persona.fechaNacimiento, anioActual), chequeo.desde, chequeo.hasta);
    case "anio":
      return enRango(anioDe(persona.fechaNacimiento), chequeo.desde, chequeo.hasta);
  }
}

function combinar(conector: Conector, resultados: boolean[]): boolean {
  return conector === "Y" ? resultados.every(Boolean) : resultados.some(Boolean);
}

/** Sin chequeos, la cumple cualquiera. */
export function cumpleCondicion(
  condicion: Condicion,
  persona: Persona,
  anioActual: number,
): boolean {
  if (condicion.items.length === 0) return true;
  return combinar(
    condicion.conector,
    condicion.items.map((item) =>
      esSubgrupo(item)
        ? combinar(
            item.conector,
            item.items.map((chequeo) => cumpleChequeo(chequeo, persona, anioActual)),
          )
        : cumpleChequeo(item, persona, anioActual),
    ),
  );
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

function describirRango(chequeo: ChequeoRango): string {
  const { desde, hasta } = chequeo;
  if (chequeo.campo === "edad") {
    if (desde !== undefined && hasta !== undefined) return `de ${desde} a ${hasta} años`;
    if (desde !== undefined) return `${desde} años o más`;
    if (hasta !== undefined) return `hasta ${hasta} años`;
    return "cualquier edad";
  }
  if (desde !== undefined && hasta !== undefined) {
    return desde === hasta ? `nacidos en ${desde}` : `nacidos de ${desde} a ${hasta}`;
  }
  if (desde !== undefined) return `nacidos en ${desde} o después`;
  if (hasta !== undefined) return `nacidos en ${hasta} o antes`;
  return "cualquier año";
}

function describirChequeo(chequeo: Chequeo): string {
  if (chequeo.campo === "sexo") return chequeo.valor === "M" ? "masculino" : "femenino";
  return describirRango(chequeo);
}

function unir(conector: Conector, partes: string[]): string {
  return partes.join(conector === "Y" ? " y " : " o ");
}

/** «Masculino y 16 años o más», «25 años o más o (femenino y 20 años o más)». */
export function describirCondicion(condicion: Condicion): string {
  if (condicion.items.length === 0) return TEXTO_SIN_CONDICION;
  const texto = unir(
    condicion.conector,
    condicion.items.map((item) =>
      esSubgrupo(item)
        ? `(${unir(item.conector, item.items.map(describirChequeo))})`
        : describirChequeo(item),
    ),
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ---------------------------------------------------------------------------
// Edición (lo que usa el editor en bloques). Nunca cambia la condición que
// recibe: devuelve una nueva.
// ---------------------------------------------------------------------------

export function chequeoNuevo(campo: Campo): Chequeo {
  return campo === "sexo" ? { campo, valor: "M" } : { campo };
}

/** Suma un chequeo arriba o, con `grupo`, dentro de ese subgrupo. */
export function agregarChequeo(condicion: Condicion, grupo?: number): Condicion {
  const chequeo = chequeoNuevo("sexo");
  if (grupo === undefined) return { ...condicion, items: [...condicion.items, chequeo] };
  return {
    ...condicion,
    items: condicion.items.map((item, i) =>
      i === grupo && esSubgrupo(item) ? { ...item, items: [...item.items, chequeo] } : item,
    ),
  };
}

/** Suma el subnivel, con el conector contrario al de arriba. Si ya hay uno, no cambia nada. */
export function agregarSubgrupo(condicion: Condicion): Condicion {
  if (tieneSubgrupo(condicion)) return condicion;
  const subgrupo: Subgrupo = {
    conector: condicion.conector === "Y" ? "O" : "Y",
    items: [chequeoNuevo("sexo"), chequeoNuevo("edad")],
  };
  return { ...condicion, items: [...condicion.items, subgrupo] };
}

/** Cambia el conector de arriba o, con `grupo`, el de ese subgrupo. */
export function cambiarConector(
  condicion: Condicion,
  conector: Conector,
  grupo?: number,
): Condicion {
  if (grupo === undefined) return { ...condicion, conector };
  return {
    ...condicion,
    items: condicion.items.map((item, i) =>
      i === grupo && esSubgrupo(item) ? { ...item, conector } : item,
    ),
  };
}

function reemplazarChequeo(
  condicion: Condicion,
  [i, j]: Ubicacion,
  cambio: (chequeo: Chequeo) => Chequeo | null,
): Condicion {
  const items = condicion.items.flatMap((item, indice): (Chequeo | Subgrupo)[] => {
    if (indice !== i) return [item];
    if (!esSubgrupo(item)) {
      if (j !== undefined) return [item];
      const nuevo = cambio(item);
      return nuevo ? [nuevo] : [];
    }
    if (j === undefined) return [item];
    const chequeos = item.items.flatMap((chequeo, k) => {
      if (k !== j) return [chequeo];
      const nuevo = cambio(chequeo);
      return nuevo ? [nuevo] : [];
    });
    return chequeos.length > 0 ? [{ ...item, items: chequeos }] : [];
  });
  return { ...condicion, items };
}

export function cambiarChequeo(
  condicion: Condicion,
  ubicacion: Ubicacion,
  chequeo: Chequeo,
): Condicion {
  return reemplazarChequeo(condicion, ubicacion, () => chequeo);
}

/** Cambia de qué es el chequeo; arranca vacío. */
export function cambiarCampo(condicion: Condicion, ubicacion: Ubicacion, campo: Campo): Condicion {
  return reemplazarChequeo(condicion, ubicacion, (actual) =>
    actual.campo === campo ? actual : chequeoNuevo(campo),
  );
}

/** Quita un chequeo, o el subgrupo entero con `[i]`. Un subgrupo que queda vacío se va. */
export function quitar(condicion: Condicion, ubicacion: Ubicacion): Condicion {
  const [i, j] = ubicacion;
  const item = condicion.items[i];
  if (item && esSubgrupo(item) && j === undefined) {
    return { ...condicion, items: condicion.items.filter((_, indice) => indice !== i) };
  }
  return reemplazarChequeo(condicion, ubicacion, () => null);
}
