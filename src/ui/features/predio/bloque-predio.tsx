"use client";

/**
 * Bloque «Predio» con el visor 3D, para quien no edita: el Admin del club en
 * la pantalla de la sede y todos en la Inicio de un club con una sola sede
 * (#44). Abajo, la leyenda (#45). three.js se carga recién en el navegador.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import type { PredioEnVisor } from "@/dominio/predio-3d";
import { FichaLeyenda, ListaLeyenda } from "./leyenda-predio";

const VisorPredio = dynamic(() => import("./visor-predio").then((m) => m.VisorPredio), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

/** Cómo se usa el visor; si hay leyenda, también que los números se tocan. */
export function ayudaVisor(predio: PredioEnVisor | null): string {
  return predio && predio.leyenda.length > 0
    ? "Orbitá con el dedo o el mouse, acercate con zoom y tocá un número para ver qué es."
    : "Orbitá con el dedo o el mouse y acercate con zoom.";
}

/**
 * El visor en su marco, a todo el ancho, con la leyenda abajo. Tocar un
 * número (en el 3D o en la leyenda) abre su ficha sobre el predio.
 */
export function MarcoVisorPredio({
  predio,
  sedeNombre,
}: {
  predio: PredioEnVisor;
  sedeNombre: string;
}) {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const elegida = predio.leyenda.find((e) => e.id === seleccion);
  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[380px] overflow-hidden rounded-2xl border border-border sm:h-[480px]">
        <VisorPredio
          predio={predio}
          etiqueta={`Predio 3D de la sede ${sedeNombre}`}
          seleccion={elegida?.id ?? null}
          onElegir={setSeleccion}
          className="size-full"
        />
        {elegida ? (
          <div className="absolute inset-x-3 bottom-3 sm:left-auto sm:w-96">
            <FichaLeyenda entrada={elegida} onCerrar={() => setSeleccion(null)} />
          </div>
        ) : null}
      </div>
      {predio.leyenda.length > 0 ? (
        <ListaLeyenda leyenda={predio.leyenda} seleccion={elegida?.id ?? null} onElegir={setSeleccion} />
      ) : null}
    </div>
  );
}

export function BloquePredio({
  predio,
  sedeNombre,
  hrefSede,
  className = "",
}: {
  predio: PredioEnVisor;
  sedeNombre: string;
  /** Si se pasa, el subtítulo lleva a la pantalla de la sede (en la Inicio). */
  hrefSede?: string;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      <div>
        <h2 className="text-lg font-medium tracking-tight">Predio</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {hrefSede ? (
            <>
              <Link href={hrefSede} className="font-medium text-foreground underline-offset-4 hover:underline">
                Sede {sedeNombre}
              </Link>
              {" · "}
            </>
          ) : null}
          {ayudaVisor(predio)}
        </p>
      </div>
      <MarcoVisorPredio predio={predio} sedeNombre={sedeNombre} />
    </section>
  );
}
