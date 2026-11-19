"use client";

/**
 * Piezas del editor de predio para ubicar instalaciones (#43): la barra de
 * instalaciones de la sede (ubicadas y sin ubicar) y el panel de la
 * instalación elegida (rotación, medidas, leyenda y «Quitar del predio»).
 */

import { useState, type ReactNode } from "react";
import { Check, Circle, RotateCcw, RotateCw, Trash2, X } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { MEDIDA_MAXIMA, MEDIDA_MINIMA, type InstalacionDeLaSede } from "@/dominio/predio";
import {
  tipoInstalacion,
  type FormaInstalacion,
} from "@/dominio/tipos-instalacion";
import { NumeroLeyenda } from "./leyenda-predio";

/** Color de la huella en el mapa, según la forma del tipo. */
export const COLOR_POR_FORMA: Record<FormaInstalacion, string> = {
  cancha: "#3f9b4f",
  pileta: "#4fb3e8",
  edificio: "#c9b28f",
  bloque: "#9a9a9a",
};

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
 * válido. Se reinicia con `key` al cambiar de instalación.
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

export function PanelInstalacion({
  instalacion,
  numero,
  rotacion,
  medidas,
  onRotar,
  onMedida,
  onQuitar,
  onCerrar,
  children,
}: {
  instalacion: InstalacionDeLaSede;
  /** Su número en la leyenda, o null si no entra. */
  numero: number | null;
  rotacion: number;
  medidas: Record<string, number>;
  onRotar: (grados: number) => void;
  onMedida: (clave: string, valor: number) => void;
  onQuitar: () => void;
  onCerrar: () => void;
  /** La leyenda: descripción, si entra y el orden. */
  children: ReactNode;
}) {
  const tipo = tipoInstalacion(instalacion.tipo);
  const girar = (delta: number) => onRotar((((rotacion + delta) % 360) + 360) % 360);
  return (
    <div className="absolute right-16 top-24 flex max-h-[calc(100%-14rem)] w-80 flex-col gap-4 overflow-y-auto rounded-2xl bg-background/95 p-4 text-sm shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Instalación · {tipo.nombre}
          </p>
          <p className="flex items-center gap-1.5 font-medium">
            {numero !== null ? <NumeroLeyenda numero={numero} elegido className="size-5" /> : null}
            <span className="truncate">{instalacion.nombre}</span>
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

      <p className="text-muted-foreground">Arrastrala en el mapa para moverla.</p>

      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <CampoNumero
              key={`rotacion-${instalacion.id}`}
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tipo.medidas.map((medida) => (
          <CampoNumero
            key={`${instalacion.id}-${medida.clave}`}
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
        La huella en el mapa sale de estas medidas.
      </p>

      {children}

      <Button variant="ghost" className="h-9 justify-start text-destructive" onClick={onQuitar}>
        <Trash2 className="size-4" />
        Quitar del predio
      </Button>
      <p className="-mt-3 text-xs text-muted-foreground">
        Sale del mapa, pero sigue en la sede.
      </p>
    </div>
  );
}
