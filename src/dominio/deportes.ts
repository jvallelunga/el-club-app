/**
 * Catálogo de deportes (#73): lo arma el Super Admin y cada club elige de él.
 * El ícono de un deporte se elige de un set definido en código; la base solo
 * acepta esas claves (deporte_icono_check).
 */

import {
  CONDICION_VACIA,
  describirCondicion,
  describirCondicionEnFrase,
  esCondicionVacia,
  validarCondicion,
  type Condicion,
} from "./condicion";
import { textoOpcional } from "./contacto";

/** El set de íconos, en el orden en que se ofrecen. Cada clave tiene su ícono de lucide en `ui`. */
export const ICONOS_DEPORTE = [
  { clave: "rugby", nombre: "Rugby" },
  { clave: "hockey", nombre: "Hockey" },
  { clave: "futbol", nombre: "Fútbol" },
  { clave: "voley", nombre: "Vóley" },
  { clave: "natacion", nombre: "Natación" },
  { clave: "atletismo", nombre: "Atletismo" },
  { clave: "running", nombre: "Running" },
  { clave: "ciclismo", nombre: "Ciclismo" },
  { clave: "remo", nombre: "Remo" },
  { clave: "vela", nombre: "Vela" },
  { clave: "montania", nombre: "Montaña" },
  { clave: "gimnasio", nombre: "Gimnasio" },
  { clave: "tiro", nombre: "Tiro" },
  { clave: "esgrima", nombre: "Esgrima" },
  { clave: "boxeo", nombre: "Boxeo" },
  { clave: "trofeo", nombre: "Trofeo" },
] as const;

export type ClaveIconoDeporte = (typeof ICONOS_DEPORTE)[number]["clave"];

/** El ícono de un deporte nuevo, y el que se muestra si una clave no se reconoce. */
export const ICONO_DEPORTE_POR_DEFECTO: ClaveIconoDeporte = "trofeo";

export const LARGO_MAXIMO_NOMBRE_DEPORTE = 60;
export const LARGO_MAXIMO_DESCRIPCION_DEPORTE = 280;

export function esClaveIconoDeporte(valor: string): valor is ClaveIconoDeporte {
  return ICONOS_DEPORTE.some((icono) => icono.clave === valor);
}

/** Un deporte del catálogo. `borradoEn` es null mientras no se borra (soft delete). */
export type Deporte = {
  id: string;
  nombre: string;
  icono: ClaveIconoDeporte;
  descripcion: string;
  /** Para anotarse en el deporte (#74). Sin chequeos, puede anotarse cualquier socio. */
  condicion: Condicion;
  borradoEn: string | null;
};

export type DeporteInput = {
  nombre: string;
  icono: string;
  descripcion: string;
  /** Sin leer todavía: viene de un form (JSON) y la valida `validarCondicion`. */
  condicion: unknown;
};

export type ErroresDeporte = {
  nombre?: string;
  icono?: string;
  descripcion?: string;
  condicion?: string;
};

export function validarDeporte(input: DeporteInput): ErroresDeporte {
  const errores: ErroresDeporte = {};
  const nombre = input.nombre.trim();
  if (!nombre) {
    errores.nombre = "Poné un nombre, por ejemplo «Rugby masculino».";
  } else if (nombre.length > LARGO_MAXIMO_NOMBRE_DEPORTE) {
    errores.nombre = `El nombre puede tener hasta ${LARGO_MAXIMO_NOMBRE_DEPORTE} caracteres.`;
  }
  if (!esClaveIconoDeporte(input.icono)) {
    errores.icono = "Elegí un ícono.";
  }
  if (input.descripcion.trim().length > LARGO_MAXIMO_DESCRIPCION_DEPORTE) {
    errores.descripcion = `La descripción puede tener hasta ${LARGO_MAXIMO_DESCRIPCION_DEPORTE} caracteres.`;
  }
  const condicion = validarCondicion(input.condicion);
  if (!condicion.ok) {
    errores.condicion = condicion.error;
  }
  return errores;
}

/** Solo para un input que pasó `validarDeporte`. */
export function deporteParaGuardar(input: DeporteInput): {
  nombre: string;
  icono: ClaveIconoDeporte;
  descripcion: string | null;
  condicion: Condicion;
} {
  if (!esClaveIconoDeporte(input.icono)) {
    throw new Error(`Ícono de deporte desconocido: ${input.icono}`);
  }
  const condicion = validarCondicion(input.condicion);
  if (!condicion.ok) {
    throw new Error(`Condición inválida: ${condicion.error}`);
  }
  return {
    nombre: input.nombre.trim(),
    icono: input.icono,
    descripcion: textoOpcional(input.descripcion),
    condicion: condicion.condicion,
  };
}

/** Cuántos clubes eligieron cada deporte, por id. Sin entrada, ninguno. */
export type ClubesPorDeporte = Record<string, number>;

/** «0 clubes», «1 club», «3 clubes». */
export function textoClubes(cantidad: number): string {
  return cantidad === 1 ? "1 club" : `${cantidad} clubes`;
}

/** «Lo usa 1 club», «Lo usan 3 clubes». */
export function textoUso(cantidad: number): string {
  return `${cantidad === 1 ? "Lo usa" : "Lo usan"} ${textoClubes(cantidad)}.`;
}

/** Los deportes activos y los borrados, cada grupo ordenado por nombre. */
export function separarBorrados(deportes: Deporte[]): {
  activos: Deporte[];
  borrados: Deporte[];
} {
  const porNombre = [...deportes].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
  );
  return {
    activos: porNombre.filter((deporte) => deporte.borradoEn === null),
    borrados: porNombre.filter((deporte) => deporte.borradoEn !== null),
  };
}

/** Un deporte que eligió el club, con la condición que el club le suma (#77). */
export type DeporteElegido = { deporteId: string; condicion: Condicion };

/**
 * Un deporte como lo ve un club: `enClub` dice si el club lo eligió y
 * `condicionClub` es lo que el club le suma (vacía si no lo eligió).
 */
export type DeporteDelClub = Deporte & { enClub: boolean; condicionClub: Condicion };

/**
 * La lista de deportes de la pantalla del club: todo el catálogo activo, con
 * los que el club ya eligió marcados, y al final los borrados que el club
 * tenía. Un borrado que el club no tenía no aparece: ya no se puede elegir.
 */
export function deportesDelClub(
  catalogo: Deporte[],
  elegidos: readonly DeporteElegido[],
): DeporteDelClub[] {
  const delClub = new Map(elegidos.map((elegido) => [elegido.deporteId, elegido.condicion]));
  const comoDelClub = (deporte: Deporte): DeporteDelClub => ({
    ...deporte,
    enClub: delClub.has(deporte.id),
    condicionClub: delClub.get(deporte.id) ?? CONDICION_VACIA,
  });
  const { activos, borrados } = separarBorrados(catalogo);
  return [
    ...activos.map(comoDelClub),
    ...borrados.filter((deporte) => delClub.has(deporte.id)).map(comoDelClub),
  ];
}

/** Cómo empieza la línea de la lista si el deporte no pide nada pero el club sí. */
const SIN_CONDICION_DEL_DEPORTE = "Cualquier socio";

/**
 * La línea de la lista: «Hasta 12 años · Club: 6 años o más». Si el club no
 * suma nada (o no eligió el deporte), solo la del deporte.
 */
export function textoCondicionEnElClub(deporte: DeporteDelClub): string {
  if (esCondicionVacia(deporte.condicionClub)) return describirCondicion(deporte.condicion);
  const delDeporte = esCondicionVacia(deporte.condicion)
    ? SIN_CONDICION_DEL_DEPORTE
    : describirCondicion(deporte.condicion);
  return `${delDeporte} · Club: ${describirCondicionEnFrase(deporte.condicionClub)}`;
}
