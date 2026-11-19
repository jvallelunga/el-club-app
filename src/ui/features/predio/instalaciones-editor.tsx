"use client";

/**
 * Piezas del editor de predio para ubicar instalaciones (#43) y elementos de
 * referencia (#46): la barra de instalaciones de la sede (ubicadas y sin
 * ubicar), la paleta de elementos de referencia y el panel del elemento
 * elegido (rotación, medidas, leyenda y «Quitar del predio» o «Borrar»).
 */

import { useState, type ReactNode } from "react";
import { Check, Circle, RotateCcw, RotateCw, Trash2, X } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { MEDIDA_MAXIMA, MEDIDA_MINIMA, type InstalacionDeLaSede } from "@/dominio/predio";
import type { FormaInstalacion, MedidaInstalacion } from "@/dominio/tipos-instalacion";
import {
  TIPOS_LINEA,
  TIPOS_REFERENCIA,
  type ClaveTipoLinea,
  type ClaveTipoReferencia,
} from "@/dominio/tipos-referencia";
import { NumeroLeyenda } from "./leyenda-predio";

/** Color de la huella en el mapa, según la forma del tipo. */
export const COLOR_POR_FORMA: Record<FormaInstalacion, string> = {
  cancha: "#3f9b4f",
  pileta: "#4fb3e8",
  edificio: "#c9b28f",
  bloque: "#9a9a9a",
};

/** Color de la huella de cada elemento de referencia en el mapa. */
export const COLOR_POR_REFERENCIA: Record<ClaveTipoReferencia, string> = {
  arbol: "#2e8b3a",
  piedra: "#8a8a8a",
  bebedero: "#4fb3e8",
  gradas: "#e2e2e2",
  tribuna: "#9aa7b3",
};

/** Color de cada camino o valla en el mapa (#47). */
export const COLOR_POR_LINEA: Record<ClaveTipoLinea, string> = {
  camino: "#d9c49a",
  valla: "#f4f4f4",
};

const botonPaleta =
  "flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-left text-sm hover:bg-muted";

/**
 * Los tipos de elemento de referencia: tocar uno puntual lo agrega en el
 * centro del mapa; un camino o una valla empieza a dibujarse punto a punto.
 */
export function PaletaReferencias({
  onAgregar,
  onTrazar,
}: {
  onAgregar: (tipo: ClaveTipoReferencia) => void;
  onTrazar: (tipo: ClaveTipoLinea) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-1">
      {TIPOS_REFERENCIA.map((tipo) => (
        <button key={tipo.clave} type="button" onClick={() => onAgregar(tipo.clave)} className={botonPaleta}>
          <span
            className="size-3 shrink-0 rounded-full border border-black/20"
            style={{ backgroundColor: COLOR_POR_REFERENCIA[tipo.clave] }}
            aria-hidden
          />
          {tipo.nombre}
        </button>
      ))}
      {TIPOS_LINEA.map((tipo) => (
        <button key={tipo.clave} type="button" onClick={() => onTrazar(tipo.clave)} className={botonPaleta}>
          <span
            className="h-1 w-3 shrink-0 rounded-full border border-black/20"
            style={{ backgroundColor: COLOR_POR_LINEA[tipo.clave] }}
            aria-hidden
          />
          {tipo.nombre}
          <span className="text-xs text-muted-foreground">· se dibuja</span>
        </button>
      ))}
    </div>
  );
}

export function BarraInstalaciones({
  instalaciones,
  ubicadas,
  seleccion,
  onElegir,
  onUbicar,
}: {
  instalaciones: InstalacionDeLaSede[];
  ubicadas: ReadonlySet<string>;
  seleccion: string | null;
  onElegir: (id: string) => void;
  onUbicar: (id: string) => void;
}) {
  const sinUbicar = instalaciones.filter((i) => !ubicadas.has(i.id)).length;
  return (
    <div className="absolute bottom-10 left-4 right-16 flex items-center gap-2 overflow-x-auto rounded-2xl bg-background/95 p-2 shadow-lg">
      <span className="shrink-0 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Instalaciones
        {sinUbicar > 0 ? ` · ${sinUbicar} sin ubicar` : null}
      </span>
      {instalaciones.length === 0 ? (
        <span className="text-sm text-muted-foreground">
          La sede todavía no tiene instalaciones. Se agregan desde la pantalla de la sede.
        </span>
      ) : null}
      {instalaciones.map((instalacion) => {
        const ubicada = ubicadas.has(instalacion.id);
        const elegida = seleccion === instalacion.id;
        return (
          <button
            key={instalacion.id}
            type="button"
            title={
              ubicada
                ? `${instalacion.nombre}: ubicada`
                : `${instalacion.nombre}: sin ubicar. Tocá para ubicarla en el centro del mapa.`
            }
            onClick={() => (ubicada ? onElegir(instalacion.id) : onUbicar(instalacion.id))}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
              elegida
                ? "border-foreground bg-foreground text-background"
                : ubicada
                  ? "border-border hover:bg-muted"
                  : "border-dashed border-amber-500 text-amber-800 hover:bg-amber-50"
            }`}
          >
            {ubicada ? (
              <Check className="size-3.5" aria-label="Ubicada" />
            ) : (
              <Circle className="size-3.5" aria-label="Sin ubicar" />
            )}
            {instalacion.nombre}
            {ubicada ? null : <span className="text-xs">· ubicar</span>}
          </button>
        );
      })}
    </div>
  );
}

const campo =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-foreground/40 aria-invalid:border-destructive";

/**
 * Campo de número que deja escribir libre y avisa recién con un número
 * válido. Se reinicia con `key` al cambiar de elemento.
 */
function CampoNumero({
  etiqueta,
  unidad,
  valor,
  min,
  max,
  paso,
  onCambio,
}: {
  etiqueta: string;
  unidad: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  onCambio: (valor: number) => void;
}) {
  const [texto, setTexto] = useState(String(valor));
  // Si el valor cambia desde afuera (por ejemplo, con los botones de girar).
  const [ultimo, setUltimo] = useState(valor);
  if (valor !== ultimo) {
    setUltimo(valor);
    if (Number(texto.replace(",", ".")) !== valor) setTexto(String(valor));
  }
  const numero = Number(texto.replace(",", "."));
  const valido = texto.trim() !== "" && Number.isFinite(numero) && numero >= min && numero <= max;
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {etiqueta}
      <span className="flex items-center gap-1">
        <input
          className={campo}
          inputMode="decimal"
          type="number"
          step={paso}
          min={min}
          max={max}
          value={texto}
          aria-invalid={!valido}
          onChange={(evento) => {
            const nuevo = evento.target.value;
            setTexto(nuevo);
            const n = Number(nuevo.replace(",", "."));
            if (nuevo.trim() !== "" && Number.isFinite(n) && n >= min && n <= max) {
              setUltimo(n);
              onCambio(n);
            }
          }}
        />
        {unidad}
      </span>
    </label>
  );
}

/** Lo que el panel dice del elemento elegido y cómo se saca del predio. */
export type DatosPanel = {
  id: string;
  /** «Instalación · Cancha de rugby» o «Elemento de referencia · Árbol». */
  titulo: string;
  nombre: string;
  medidasDelTipo: readonly MedidaInstalacion[];
  /** «Quitar del predio» (instalación) o «Borrar» (elemento de referencia). */
  quitar: string;
  /** Qué pasa al quitarlo. */
  ayudaQuitar: string;
  /** Algo más que hay que saber para ubicarlo, si hace falta. */
  ayudaRotacion?: string;
  /** Cómo se mueve; por defecto, arrastrándolo. */
  ayudaMover?: string;
  /** Qué cambian las medidas; por defecto, la huella en el mapa. */
  ayudaMedidas?: string;
};

export function PanelElemento({
  elemento,
  numero,
  rotacion,
  medidas,
  onRotar,
  onMedida,
  onQuitar,
  onCerrar,
  children,
}: {
  elemento: DatosPanel;
  /** Su número en la leyenda, o null si no entra. */
  numero: number | null;
  /** null si no se gira: un camino o una valla sigue sus puntos. */
  rotacion: number | null;
  medidas: Record<string, number>;
  onRotar: (grados: number) => void;
  onMedida: (clave: string, valor: number) => void;
  onQuitar: () => void;
  onCerrar: () => void;
  /** El nombre (si es un elemento de referencia) y la leyenda. */
  children: ReactNode;
}) {
  const girar = (delta: number) => onRotar(((((rotacion ?? 0) + delta) % 360) + 360) % 360);
  return (
    <div className="absolute right-16 top-24 flex max-h-[calc(100%-14rem)] w-80 flex-col gap-4 overflow-y-auto rounded-2xl bg-background/95 p-4 text-sm shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {elemento.titulo}
          </p>
          <p className="flex items-center gap-1.5 font-medium">
            {numero !== null ? <NumeroLeyenda numero={numero} elegido className="size-5" /> : null}
            <span className="truncate">{elemento.nombre}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="text-muted-foreground"
          aria-label="Cerrar las propiedades"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="text-muted-foreground">
        {elemento.ayudaMover ?? "Arrastralo en el mapa para moverlo."}
      </p>

      {rotacion === null ? null : (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <CampoNumero
                key={`rotacion-${elemento.id}`}
                etiqueta="Rotación (sentido horario)"
                unidad="°"
                valor={Math.round(rotacion * 10) / 10}
                min={0}
                max={359.9}
                paso={1}
                onCambio={onRotar}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-lg"
              title="Girar 15° a la izquierda"
              aria-label="Girar 15° a la izquierda"
              onClick={() => girar(-15)}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-lg"
              title="Girar 15° a la derecha"
              aria-label="Girar 15° a la derecha"
              onClick={() => girar(15)}
            >
              <RotateCw className="size-4" />
            </Button>
          </div>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={Math.round(rotacion) % 360}
            onChange={(evento) => onRotar(Number(evento.target.value))}
            aria-label="Rotación"
          />
          {elemento.ayudaRotacion ? (
            <p className="text-xs text-muted-foreground">{elemento.ayudaRotacion}</p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {elemento.medidasDelTipo.map((medida) => (
          <CampoNumero
            key={`${elemento.id}-${medida.clave}`}
            etiqueta={medida.etiqueta}
            unidad="m"
            valor={medidas[medida.clave] ?? medida.porDefecto}
            min={MEDIDA_MINIMA}
            max={MEDIDA_MAXIMA}
            paso={0.1}
            onCambio={(valor) => onMedida(medida.clave, valor)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {elemento.ayudaMedidas ?? "La huella en el mapa sale de estas medidas."}
      </p>

      {children}

      <Button variant="ghost" className="h-9 justify-start text-destructive" onClick={onQuitar}>
        <Trash2 className="size-4" />
        {elemento.quitar}
      </Button>
      <p className="-mt-3 text-xs text-muted-foreground">{elemento.ayudaQuitar}</p>
    </div>
  );
}
