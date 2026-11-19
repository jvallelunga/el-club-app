"use client";

/**
 * La leyenda en el editor de predio (#45, variante B del mock): la
 * descripción y «Entra en la leyenda» del elemento elegido, y el orden de la
 * leyenda, que se reordena con subir y bajar. También el nombre propio de un
 * elemento de referencia (#46).
 */

import { ArrowDown, ArrowUp } from "lucide-react";
import { DESCRIPCION_MAXIMA } from "@/dominio/leyenda";
import { NOMBRE_MAXIMO } from "@/dominio/predio";
import { NumeroLeyenda } from "./leyenda-predio";

/**
 * El nombre propio de un elemento de referencia (#46), opcional: por ejemplo
 * «El ombú», que sirve de punto de referencia, o «Gradas Tito», un homenaje.
 */
export function CampoNombre({
  nombre,
  onNombre,
}: {
  nombre: string;
  onNombre: (texto: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      Nombre (opcional)
      <input
        className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-foreground/40"
        maxLength={NOMBRE_MAXIMO}
        value={nombre}
        placeholder="Por ejemplo «El ombú»"
        onChange={(evento) => onNombre(evento.target.value)}
      />
    </label>
  );
}

export function CamposLeyenda({
  descripcion,
  enLeyenda,
  onDescripcion,
  onEnLeyenda,
}: {
  descripcion: string;
  enLeyenda: boolean;
  onDescripcion: (texto: string) => void;
  onEnLeyenda: (entra: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Descripción (opcional, se ve en la leyenda)
        <textarea
          className="min-h-16 w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-foreground/40"
          rows={3}
          maxLength={DESCRIPCION_MAXIMA}
          value={descripcion}
          placeholder="Por ejemplo «En homenaje a…»"
          onChange={(evento) => onDescripcion(evento.target.value)}
        />
        <span className="self-end">
          {descripcion.length}/{DESCRIPCION_MAXIMA}
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={enLeyenda}
          onChange={(evento) => onEnLeyenda(evento.target.checked)}
        />
        Entra en la leyenda (con número)
      </label>
    </div>
  );
}

export type LineaOrdenLeyenda = { id: string; numero: number; nombre: string };

export function OrdenLeyenda({
  leyenda,
  seleccion,
  onElegir,
  onMover,
}: {
  /** Lo que entra en la leyenda, en su orden. */
  leyenda: LineaOrdenLeyenda[];
  seleccion: string | null;
  onElegir: (id: string) => void;
  onMover: (id: string, delta: -1 | 1) => void;
}) {
  if (leyenda.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Todavía no hay nada en la leyenda. Marcá «Entra en la leyenda» para darle un número.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-0.5">
      {leyenda.map((linea, i) => (
        <li
          key={linea.id}
          className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
            seleccion === linea.id ? "bg-muted" : ""
          }`}
        >
          <NumeroLeyenda
            numero={linea.numero}
            elegido={seleccion === linea.id}
            className="size-5"
          />
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left"
            onClick={() => onElegir(linea.id)}
          >
            {linea.nombre}
          </button>
          <button
            type="button"
            disabled={i === 0}
            onClick={() => onMover(linea.id, -1)}
            className="text-muted-foreground disabled:opacity-30"
            title={`Subir ${linea.nombre} en la leyenda`}
            aria-label={`Subir ${linea.nombre} en la leyenda`}
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={i === leyenda.length - 1}
            onClick={() => onMover(linea.id, 1)}
            className="text-muted-foreground disabled:opacity-30"
            title={`Bajar ${linea.nombre} en la leyenda`}
            aria-label={`Bajar ${linea.nombre} en la leyenda`}
          >
            <ArrowDown className="size-3.5" />
          </button>
        </li>
      ))}
    </ol>
  );
}
