"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { describirCondicion } from "@/dominio/condicion";
import type { DeporteDelClub } from "@/dominio/deportes";
import type { ResultadoSimple } from "@/dominio/resultado";
import { DialogoConfirmar } from "@/ui/compartidos/dialogo-confirmar";
import { cn } from "@/lib/utils";
import { IconoDeporte } from "./icono-deporte";

/**
 * Los deportes del club: el catálogo activo con un interruptor por deporte.
 * Los borrados del catálogo que el club tenía se ven marcados y sin
 * interruptor: ya no se pueden volver a sumar.
 */
export function DeportesDelClub({
  nombreClub,
  deportes,
  sumar,
  quitar,
}: {
  nombreClub: string;
  deportes: DeporteDelClub[];
  sumar: (deporteId: string) => Promise<ResultadoSimple>;
  quitar: (deporteId: string) => Promise<ResultadoSimple>;
}) {
  const router = useRouter();
  const [aQuitar, setAQuitar] = useState<DeporteDelClub | null>(null);
  const [errorQuitar, setErrorQuitar] = useState<string | null>(null);
  const [quitando, startQuitar] = useTransition();
  const [sumando, setSumando] = useState<string | null>(null);
  const [errorSumar, setErrorSumar] = useState<string | null>(null);
  const [, startSumar] = useTransition();

  function sumarDeporte(deporte: DeporteDelClub) {
    if (sumando) return;
    setErrorSumar(null);
    setSumando(deporte.id);
    startSumar(async () => {
      const resultado = await sumar(deporte.id);
      if (!resultado.ok) setErrorSumar(resultado.error);
      router.refresh();
      setSumando(null);
    });
  }

  function confirmarQuitar() {
    if (!aQuitar) return;
    const id = aQuitar.id;
    startQuitar(async () => {
      const resultado = await quitar(id);
      if (!resultado.ok) {
        setErrorQuitar(resultado.error);
        return;
      }
      setAQuitar(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <p className="max-w-xl text-sm text-muted-foreground">
        Elegí del catálogo los deportes que se practican en {nombreClub}.
      </p>

      {errorSumar ? (
        <p className="text-sm text-destructive" role="alert">
          {errorSumar}
        </p>
      ) : null}

      {deportes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Todavía no hay deportes en el catálogo. Los crea el Super Admin.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {deportes.map((deporte) => {
            const borrado = deporte.borradoEn !== null;
            return (
              <li
                key={deporte.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  borrado && "text-muted-foreground",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <IconoDeporte clave={deporte.icono} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-medium", borrado && "line-through")}>
                    {deporte.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {borrado
                      ? "Borrado del catálogo: ya no se puede volver a sumar."
                      : describirCondicion(deporte.condicion)}
                  </p>
                </div>
                {borrado ? (
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs">
                    Borrado
                  </span>
                ) : (
                  <Interruptor
                    encendido={deporte.enClub}
                    pendiente={sumando === deporte.id}
                    etiqueta={`${deporte.nombre} en el club`}
                    onClick={() => {
                      if (deporte.enClub) {
                        setErrorQuitar(null);
                        setAQuitar(deporte);
                      } else {
                        sumarDeporte(deporte);
                      }
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <DialogoConfirmar
        abierto={aQuitar !== null}
        onCerrar={() => setAQuitar(null)}
        titulo={`¿Quitar «${aQuitar?.nombre ?? ""}» del club?`}
        accion="Quitar deporte"
        accionPendiente="Quitando…"
        pendiente={quitando}
        error={errorQuitar}
        onConfirmar={confirmarQuitar}
      >
        <p>Deja de estar entre los deportes del club. Lo podés volver a sumar del catálogo.</p>
      </DialogoConfirmar>
    </div>
  );
}

function Interruptor({
  encendido,
  pendiente,
  etiqueta,
  onClick,
}: {
  encendido: boolean;
  pendiente: boolean;
  etiqueta: string;
  onClick: () => void;
}) {
  // Mientras se suma, ya se muestra encendido.
  const visible = encendido || pendiente;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      aria-label={etiqueta}
      disabled={pendiente}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70",
        visible ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          visible ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}
