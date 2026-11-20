"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  condicionEfectiva,
  describirCondicion,
  describirCondicionEfectiva,
  esCondicionVacia,
  validarCondicion,
  type Condicion,
} from "@/dominio/condicion";
import { textoCondicionEnElClub, type DeporteDelClub } from "@/dominio/deportes";
import type { ResultadoSimple } from "@/dominio/resultado";
import { DialogoConfirmar } from "@/ui/compartidos/dialogo-confirmar";
import { EditorCondicion } from "@/ui/compartidos/editor-condicion";
import { Button } from "@/ui/nativos/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/ui/nativos/sheet";
import { cn } from "@/lib/utils";
import { IconoDeporte } from "./icono-deporte";

/**
 * Los deportes del club: el catálogo activo con un interruptor por deporte.
 * Tocar un deporte del club abre el panel de la condición del club (#77).
 * Los borrados del catálogo que el club tenía se ven marcados y sin
 * interruptor: ya no se pueden volver a sumar.
 */
export function DeportesDelClub({
  nombreClub,
  deportes,
  sumar,
  quitar,
  guardarCondicion,
}: {
  nombreClub: string;
  deportes: DeporteDelClub[];
  sumar: (deporteId: string) => Promise<ResultadoSimple>;
  quitar: (deporteId: string) => Promise<ResultadoSimple>;
  guardarCondicion: (deporteId: string, condicion: Condicion) => Promise<ResultadoSimple>;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<DeporteDelClub | null>(null);
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
        Elegí del catálogo los deportes que se practican en {nombreClub}. Tocá un deporte
        del club para sumarle una condición del club.
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
            const editable = deporte.enClub && !borrado;
            const texto = (
              <>
                <span className={cn("block font-medium", borrado && "line-through")}>
                  {deporte.nombre}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {borrado
                    ? "Borrado del catálogo: ya no se puede volver a sumar."
                    : textoCondicionEnElClub(deporte)}
                </span>
              </>
            );
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
                {editable ? (
                  <button
                    type="button"
                    onClick={() => setEditando(deporte)}
                    aria-label={`Condición del club para ${deporte.nombre}`}
                    className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {texto}
                  </button>
                ) : (
                  <div className="min-w-0 flex-1">{texto}</div>
                )}
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

      <Sheet open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {editando ? (
            <PanelCondicionClub
              key={editando.id}
              deporte={editando}
              nombreClub={nombreClub}
              guardar={(condicion) => guardarCondicion(editando.id, condicion)}
              onListo={() => {
                setEditando(null);
                router.refresh();
              }}
              onCancelar={() => setEditando(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

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
        {aQuitar && !esCondicionVacia(aQuitar.condicionClub) ? (
          <p>
            También se pierde la condición que sumó el club: «
            {describirCondicion(aQuitar.condicionClub)}».
          </p>
        ) : null}
      </DialogoConfirmar>
    </div>
  );
}

/**
 * La condición del club para un deporte: la del deporte, fija, el editor para
 * la del club y lo que resulta de las dos juntas.
 */
function PanelCondicionClub({
  deporte,
  nombreClub,
  guardar,
  onListo,
  onCancelar,
}: {
  deporte: DeporteDelClub;
  nombreClub: string;
  guardar: (condicion: Condicion) => Promise<ResultadoSimple>;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [condicion, setCondicion] = useState(deporte.condicionClub);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const validacion = validarCondicion(condicion);

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente) return;
    setError(null);
    startTransition(async () => {
      const resultado = await guardar(condicion);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      onListo();
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-1 flex-col">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <IconoDeporte clave={deporte.icono} className="size-5" />
          {deporte.nombre}
        </SheetTitle>
        <SheetDescription>
          {deporte.descripcion || `La condición para anotarse en ${nombreClub}.`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Condición del deporte</span>
          <p className="rounded-md border border-border px-3 py-2 text-sm">
            {describirCondicion(deporte.condicion)}
          </p>
          <p className="text-xs text-muted-foreground">
            La define el Super Admin para todos los clubes. No se puede cambiar.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Condición del club</span>
          <p className="text-xs text-muted-foreground">
            Lo que suma {nombreClub} a la del deporte: hay que cumplir las dos.
          </p>
          <EditorCondicion
            condicion={condicion}
            onChange={setCondicion}
            etiqueta="Condición del club"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Pueden anotarse</span>
          <p className="rounded-md bg-muted px-3 py-2 text-sm" aria-live="polite">
            {validacion.ok
              ? describirCondicionEfectiva(
                  condicionEfectiva(deporte.condicion, validacion.condicion),
                )
              : "Completá la condición del club para ver quiénes pueden anotarse."}
          </p>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={pendiente}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendiente || !validacion.ok}>
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
      </SheetFooter>
    </form>
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
  const seVeEncendido = encendido || pendiente;
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
        seVeEncendido ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          seVeEncendido ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}
