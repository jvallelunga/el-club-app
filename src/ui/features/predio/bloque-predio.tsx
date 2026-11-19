"use client";

/**
 * Bloque «Predio» con el visor 3D, para quien no edita: el Admin del club en
 * la pantalla de la sede y todos en la Inicio de un club con una sola sede
 * (#44). three.js se carga recién en el navegador.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import type { PredioEnVisor } from "@/dominio/predio-3d";

const VisorPredio = dynamic(() => import("./visor-predio").then((m) => m.VisorPredio), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

export const AYUDA_VISOR = "Orbitá con el dedo o el mouse y acercate con zoom.";

/** El visor en su marco, a todo el ancho. */
export function MarcoVisorPredio({
  predio,
  sedeNombre,
}: {
  predio: PredioEnVisor;
  sedeNombre: string;
}) {
  return (
    <div className="h-[380px] overflow-hidden rounded-2xl border border-border sm:h-[480px]">
      <VisorPredio
        predio={predio}
        etiqueta={`Predio 3D de la sede ${sedeNombre}`}
        className="size-full"
      />
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
          {AYUDA_VISOR}
        </p>
      </div>
      <MarcoVisorPredio predio={predio} sedeNombre={sedeNombre} />
    </section>
  );
}
