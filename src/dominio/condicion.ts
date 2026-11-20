/**
 * Condición para anotarse (#74): chequeos sobre el sexo y la fecha de
 * nacimiento de una persona, unidos por Y u O, con como máximo un subnivel
 * (un grupo de chequeos con su propio Y/O, sin otro grupo adentro).
 *
 * No depende de quién la usa: la tienen el deporte y el club (#77), y la van
 * a usar las categorías (#57). Para anotarse hay que cumplirlas todas: ver
 * `condicionEfectiva`. La base valida la misma
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

export type Rango = {
  /** Para los mensajes y las etiquetas: «La edad desde». */
  nombre: string;
  /** Lo que se lee después de «hasta» en el editor. */
  unidad: string;
  placeholder: string;
  /** Límites, enteros e incluidos. La base usa los mismos (interno.es_chequeo_valido). */
  min: number;
  max: number;
};

export const RANGOS: Record<ChequeoRango["campo"], Rango> = {
  edad: { nombre: "Edad", unidad: "años", placeholder: "—", min: 0, max: 120 },
  anio: { nombre: "Año de nacimiento", unidad: "", placeholder: "año", min: 1900, max: 2100 },
};

export function esSubgrupo(item: Chequeo | Subgrupo): item is Subgrupo {
  return "items" in item;
}

/** Sin chequeos: puede anotarse cualquier socio. */
export function esCondicionVacia(condicion: Condicion): boolean {
  return condicion.items.length === 0;
}

export function tieneSubgrupo(condicion: Condicion): boolean {
  return condicion.items.some(esSubgrupo);
}

/** Antes de validarlo: un objeto con `items` se lee como subgrupo. */
function pareceSubgrupo(valor: unknown): valor is Record<string, unknown> {
  return esObjeto(valor) && "items" in valor;
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
    throw new FormaInvalida("Cada grupo tiene que ser «Todas (Y)» o «Alguna (O)».");
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
    const { min, max, nombre } = RANGOS[campo];
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

/** El conector y la lista de items de la condición o de un subgrupo, sin leer los items. */
function leerBloque(valor: unknown): { conector: Conector; items: unknown[] } {
  if (!esObjeto(valor) || !Array.isArray(valor.items)) {
    throw new FormaInvalida("La condición no se reconoce.");
  }
  soloClaves(valor, ["conector", "items"]);
  return { conector: leerConector(valor.conector), items: valor.items };
}

function leerSubgrupo(valor: unknown): Subgrupo {
  const { conector, items } = leerBloque(valor);
  if (items.length === 0) throw new FormaInvalida("Un grupo necesita al menos un chequeo.");
  return {
    conector,
    items: items.map((item) => {
      if (pareceSubgrupo(item)) {
        throw new FormaInvalida("Un grupo no puede tener otro grupo adentro: hay un solo subnivel.");
      }
      return leerChequeo(item);
    }),
  };
}

/** Lee una condición de un dato cualquiera (un JSON del form o de la base). */
export function validarCondicion(valor: unknown): ResultadoCondicion {
  try {
    const { conector, items: crudos } = leerBloque(valor);
    if (crudos.filter(pareceSubgrupo).length > 1) {
      throw new FormaInvalida("Puede haber un solo grupo.");
    }
    const items = crudos.map((item) =>
      pareceSubgrupo(item) ? leerSubgrupo(item) : leerChequeo(item),
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
  if (esCondicionVacia(condicion)) return true;
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
  // Una condición válida tiene desde, hasta o los dos (validarCondicion).
  if (chequeo.campo === "edad") {
    if (desde !== undefined && hasta !== undefined) return `de ${desde} a ${hasta} años`;
    return desde !== undefined ? `${desde} años o más` : `hasta ${hasta} años`;
  }
  if (desde !== undefined && hasta !== undefined) {
    return desde === hasta ? `nacidos en ${desde}` : `nacidos de ${desde} a ${hasta}`;
  }
  return desde !== undefined ? `nacidos en ${desde} o después` : `nacidos en ${hasta} o antes`;
}

function describirChequeo(chequeo: Chequeo): string {
  if (chequeo.campo === "sexo") return chequeo.valor === "M" ? "masculino" : "femenino";
  return describirRango(chequeo);
}

function unir(conector: Conector, partes: string[]): string {
  return partes.join(conector === "Y" ? " y " : " o ");
}

function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** El texto de una condición con chequeos, en minúscula, para seguir una frase. */
export function describirCondicionEnFrase(condicion: Condicion): string {
  return unir(
    condicion.conector,
    condicion.items.map((item) =>
      esSubgrupo(item)
        ? `(${unir(item.conector, item.items.map(describirChequeo))})`
        : describirChequeo(item),
    ),
  );
}

/** «Masculino y 16 años o más», «25 años o más o (femenino y 20 años o más)». */
export function describirCondicion(condicion: Condicion): string {
  if (esCondicionVacia(condicion)) return TEXTO_SIN_CONDICION;
  return conMayuscula(describirCondicionEnFrase(condicion));
}

// ---------------------------------------------------------------------------
// Condición efectiva (#77): varias condiciones que hay que cumplir todas.
// ---------------------------------------------------------------------------

/**
 * Lo que de verdad tiene que cumplir un socio para anotarse: la condición del
 * deporte Y la del club (#77) y, con #57, la de la categoría. No se junta en
 * una sola `Condicion`: cada una puede tener su O y su subgrupo, y unirlas
 * pediría un segundo subnivel. Va en orden y sin las vacías.
 */
export type CondicionEfectiva = readonly Condicion[];

/** Junta condiciones con Y, en el orden dado: primero la más general (el deporte). */
export function condicionEfectiva(...condiciones: Condicion[]): CondicionEfectiva {
  return condiciones.filter((condicion) => !esCondicionVacia(condicion));
}

/** Tiene que cumplir cada una. Sin ninguna, la cumple cualquiera. */
export function cumpleCondicionEfectiva(
  efectiva: CondicionEfectiva,
  persona: Persona,
  anioActual: number,
): boolean {
  return efectiva.every((condicion) => cumpleCondicion(condicion, persona, anioActual));
}

/** «Hasta 12 años, y además 6 años o más». */
export function describirCondicionEfectiva(efectiva: CondicionEfectiva): string {
  if (efectiva.length === 0) return TEXTO_SIN_CONDICION;
  return conMayuscula(efectiva.map(describirCondicionEnFrase).join(", y además "));
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

/**
 * Suma el único grupo, con el conector contrario al de arriba y un chequeo
 * para empezar. Si ya hay uno, no cambia nada.
 */
export function agregarSubgrupo(condicion: Condicion): Condicion {
  if (tieneSubgrupo(condicion)) return condicion;
  const subgrupo: Subgrupo = {
    conector: condicion.conector === "Y" ? "O" : "Y",
    items: [chequeoNuevo("sexo")],
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
export function quitarItem(condicion: Condicion, ubicacion: Ubicacion): Condicion {
  const [i, j] = ubicacion;
  const item = condicion.items[i];
  if (item && esSubgrupo(item) && j === undefined) {
    return { ...condicion, items: condicion.items.filter((_, indice) => indice !== i) };
  }
  return reemplazarChequeo(condicion, ubicacion, () => null);
}
