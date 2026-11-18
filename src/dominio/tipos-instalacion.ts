/**
 * Tipos de instalación, definidos en código (ADR 0001). Cada tipo tiene su
 * forma 3D y las medidas que se pueden configurar, con su valor por defecto.
 *
 * Agregar o quitar un tipo también pide una migración: la base de datos solo
 * acepta estas claves en `instalacion.tipo`.
 */

/** Forma con la que se dibuja el tipo en el predio 3D. */
export type FormaInstalacion = "cancha" | "pileta" | "edificio" | "bloque";

export type MedidaInstalacion = {
  clave: string;
  etiqueta: string;
  /** En metros. */
  porDefecto: number;
};

export type TipoInstalacion = {
  clave: string;
  nombre: string;
  forma: FormaInstalacion;
  medidas: readonly MedidaInstalacion[];
};

const largo = (porDefecto: number): MedidaInstalacion => ({
  clave: "largo",
  etiqueta: "Largo",
  porDefecto,
});
const ancho = (porDefecto: number): MedidaInstalacion => ({
  clave: "ancho",
  etiqueta: "Ancho",
  porDefecto,
});
const alto = (porDefecto: number): MedidaInstalacion => ({
  clave: "alto",
  etiqueta: "Alto",
  porDefecto,
});

/** En el orden en que se ofrecen. «Otra» va al final. */
export const TIPOS_INSTALACION = [
  {
    clave: "cancha_rugby",
    nombre: "Cancha de rugby",
    forma: "cancha",
    medidas: [
      largo(100),
      ancho(70),
      { clave: "ingoal", etiqueta: "In-goal", porDefecto: 10 },
    ],
  },
  {
    clave: "cancha_hockey",
    nombre: "Cancha de hockey",
    forma: "cancha",
    medidas: [largo(91.4), ancho(55)],
  },
  {
    clave: "cancha_tenis",
    nombre: "Cancha de tenis",
    forma: "cancha",
    medidas: [largo(36), ancho(18)],
  },
  {
    clave: "cancha_futbol",
    nombre: "Cancha de fútbol",
    forma: "cancha",
    medidas: [largo(100), ancho(64)],
  },
  {
    clave: "house",
    nombre: "House",
    forma: "edificio",
    medidas: [largo(30), ancho(15), alto(5)],
  },
  {
    clave: "pileta",
    nombre: "Pileta",
    forma: "pileta",
    medidas: [largo(25), ancho(12)],
  },
  {
    clave: "gym",
    nombre: "Gym",
    forma: "edificio",
    medidas: [largo(20), ancho(12), alto(5)],
  },
  {
    clave: "vestuario",
    nombre: "Vestuario",
    forma: "edificio",
    medidas: [largo(15), ancho(8), alto(3.5)],
  },
  {
    clave: "quincho",
    nombre: "Quincho",
    forma: "edificio",
    medidas: [largo(14), ancho(9), alto(4)],
  },
  {
    clave: "salon",
    nombre: "Salón",
    forma: "edificio",
    medidas: [largo(20), ancho(12), alto(4)],
  },
  {
    clave: "otra",
    nombre: "Otra",
    forma: "bloque",
    medidas: [largo(10), ancho(10), alto(3)],
  },
] as const satisfies readonly TipoInstalacion[];

export type ClaveTipoInstalacion = (typeof TIPOS_INSTALACION)[number]["clave"];

export const CLAVE_TIPO_OTRA = "otra" satisfies ClaveTipoInstalacion;

const TIPO_POR_CLAVE = new Map<string, TipoInstalacion>(
  TIPOS_INSTALACION.map((tipo) => [tipo.clave, tipo]),
);

export function esClaveTipoInstalacion(
  valor: string,
): valor is ClaveTipoInstalacion {
  return TIPO_POR_CLAVE.has(valor);
}

export function tipoInstalacion(clave: ClaveTipoInstalacion): TipoInstalacion {
  return TIPO_POR_CLAVE.get(clave)!;
}

export function medidasPorDefecto(
  clave: ClaveTipoInstalacion,
): Record<string, number> {
  return Object.fromEntries(
    tipoInstalacion(clave).medidas.map((medida) => [medida.clave, medida.porDefecto]),
  );
}
