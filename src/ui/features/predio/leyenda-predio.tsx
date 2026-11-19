"use client";

/**
 * La leyenda del visor 3D (#45, variante D del mock): la ficha que se abre al
 * tocar un número y la lista numerada que va abajo del predio, en dos columnas.
 */

import { X } from "lucide-react";
import type { EntradaLeyenda } from "@/dominio/predio-3d";

/**
 * El número de la leyenda, en negro o en amarillo si está elegido. El tamaño
 * va en `className` (por ejemplo «size-6»).
 */
export function NumeroLeyenda({
  numero,
  elegido = false,
  className,
}: {
  numero: number;
  elegido?: boolean;
  className: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        elegido ? "bg-[#ffd23f] text-black" : "bg-foreground text-background"
      } ${className}`}
    >
      {numero}
    </span>
  );
}

/** El nombre y la descripción de lo que se tocó. */
export function FichaLeyenda({
  entrada,
  onCerrar,
}: {
  entrada: EntradaLeyenda;
  onCerrar: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg"
      role="dialog"
      aria-label={`${entrada.numero}. ${entrada.nombre}`}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ffd23f] font-bold text-black">
        {entrada.numero}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{entrada.nombre}</p>
        {entrada.descripcion ? (
          <p className="mt-1.5 text-sm leading-relaxed">{entrada.descripcion}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCerrar}
        className="text-muted-foreground"
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/** La leyenda abajo del predio: número, nombre y descripción, en dos columnas. */
export function ListaLeyenda({
  leyenda,
  seleccion,
  onElegir,
}: {
  leyenda: EntradaLeyenda[];
  seleccion: string | null;
  onElegir: (id: string) => void;
}) {
  return (
    <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2" aria-label="Leyenda del predio">
      {leyenda.map((entrada) => (
        <li key={entrada.id}>
          <button
            type="button"
            onClick={() => onElegir(entrada.id)}
            className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-muted ${
              seleccion === entrada.id ? "bg-muted" : ""
            }`}
          >
            <NumeroLeyenda
              numero={entrada.numero}
              elegido={seleccion === entrada.id}
              className="mt-0.5 size-6"
            />
            <span className="min-w-0">
              <span className="block font-medium">{entrada.nombre}</span>
              {entrada.descripcion ? (
                <span className="block text-sm text-muted-foreground">{entrada.descripcion}</span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
