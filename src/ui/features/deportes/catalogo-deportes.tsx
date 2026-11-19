"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  ICONO_DEPORTE_POR_DEFECTO,
  ICONOS_DEPORTE,
  LARGO_MAXIMO_DESCRIPCION_DEPORTE,
  LARGO_MAXIMO_NOMBRE_DEPORTE,
  separarBorrados,
  textoClubes,
  TEXTO_SIN_CONDICION,
  type Deporte,
} from "@/dominio/deportes";
import type { ResultadoConId, ResultadoSimple } from "@/dominio/resultado";
import { DialogoConfirmar } from "@/ui/compartidos/dialogo-confirmar";
import { Button } from "@/ui/nativos/button";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
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

/** Lo que se edita en el panel: un deporte existente o uno nuevo (sin id). */
type Edicion = Omit<Deporte, "id" | "borradoEn"> & { id: string | null };

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function CatalogoDeportes({
  deportes,
  crear,
  editar,
  borrar,
}: {
  deportes: Deporte[];
  crear: (formData: FormData) => Promise<ResultadoConId>;
  editar: (deporteId: string, formData: FormData) => Promise<ResultadoSimple>;
  borrar: (deporteId: string) => Promise<ResultadoSimple>;
}) {
  const router = useRouter();
  const { activos, borrados } = separarBorrados(deportes);
  const [editando, setEditando] = useState<Edicion | null>(null);
  const [aBorrar, setABorrar] = useState<Deporte | null>(null);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);
  const [borrando, startBorrar] = useTransition();
  const [verBorrados, setVerBorrados] = useState(false);

  function confirmarBorrado() {
    if (!aBorrar) return;
    const id = aBorrar.id;
    startBorrar(async () => {
      const resultado = await borrar(id);
      if (!resultado.ok) {
        setErrorBorrar(resultado.error);
        return;
      }
      setABorrar(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          El catálogo que ven todos los clubes. Cada club elige los suyos.
        </p>
        <Button
          type="button"
          className="h-10"
          onClick={() =>
            setEditando({ id: null, nombre: "", icono: ICONO_DEPORTE_POR_DEFECTO, descripcion: "" })
          }
        >
          <Plus className="size-4" />
          Nuevo deporte
        </Button>
      </div>

      {activos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Todavía no hay deportes. Creá el primero para que los clubes puedan elegirlo.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          <li
            className="hidden items-center gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:flex"
            aria-hidden
          >
            <span className="w-10 shrink-0" />
            <span className="grid flex-1 grid-cols-2 gap-4">
              <span>Deporte</span>
              <span>Condición</span>
            </span>
            <span className="w-20">Uso</span>
            <span className="w-9" />
          </li>
          {activos.map((deporte) => (
            <li key={deporte.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <IconoDeporte clave={deporte.icono} className="size-5" />
              </span>
              <button
                type="button"
                onClick={() =>
                  setEditando({
                    id: deporte.id,
                    nombre: deporte.nombre,
                    icono: deporte.icono,
                    descripcion: deporte.descripcion,
                  })
                }
                aria-label={`Editar ${deporte.nombre}`}
                className="grid min-w-0 flex-1 gap-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-2 sm:gap-4"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{deporte.nombre}</span>
                  {deporte.descripcion ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {deporte.descripcion}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm sm:text-foreground">
                  {TEXTO_SIN_CONDICION}
                </span>
              </button>
              <span className="hidden w-20 text-xs text-muted-foreground sm:block">
                {textoClubes(0)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                aria-label={`Borrar ${deporte.nombre}`}
                onClick={() => {
                  setErrorBorrar(null);
                  setABorrar(deporte);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {borrados.length > 0 ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={verBorrados}
            className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setVerBorrados((valor) => !valor)}
          >
            {verBorrados ? "Ocultar" : "Ver"} borrados ({borrados.length})
          </button>
          {verBorrados ? (
            <ul className="divide-y divide-border rounded-xl border border-dashed border-border">
              {borrados.map((deporte) => (
                <li
                  key={deporte.id}
                  className="flex items-center gap-3 px-4 py-3 text-muted-foreground"
                >
                  <IconoDeporte clave={deporte.icono} className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate line-through">{deporte.nombre}</span>
                  {deporte.borradoEn ? (
                    <span className="shrink-0 text-xs">
                      Borrado el {FORMATO_FECHA.format(new Date(deporte.borradoEn))}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Sheet open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {editando ? (
            <FormularioDeporte
              key={editando.id ?? "nuevo"}
              inicial={editando}
              guardar={(formData) =>
                editando.id ? editar(editando.id, formData) : crear(formData)
              }
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
        abierto={aBorrar !== null}
        onCerrar={() => setABorrar(null)}
        titulo={`¿Borrar «${aBorrar?.nombre ?? ""}» del catálogo?`}
        accion="Borrar deporte"
        accionPendiente="Borrando…"
        pendiente={borrando}
        error={errorBorrar}
        onConfirmar={confirmarBorrado}
      >
        <p>Lo usan {textoClubes(0)}.</p>
        <p>
          Los clubes ya no lo van a poder elegir. Queda en «Ver borrados» y ya no se puede
          editar.
        </p>
      </DialogoConfirmar>
    </div>
  );
}

function FormularioDeporte({
  inicial,
  guardar,
  onListo,
  onCancelar,
}: {
  inicial: Edicion;
  guardar: (formData: FormData) => Promise<ResultadoSimple | ResultadoConId>;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [icono, setIcono] = useState(inicial.icono);
  const [descripcion, setDescripcion] = useState(inicial.descripcion);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const esNuevo = inicial.id === null;

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente) return;
    const formData = new FormData();
    formData.set("nombre", nombre);
    formData.set("icono", icono);
    formData.set("descripcion", descripcion);
    startTransition(async () => {
      const resultado = await guardar(formData);
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
        <SheetTitle>{esNuevo ? "Nuevo deporte" : `Editar ${inicial.nombre}`}</SheetTitle>
        <SheetDescription>
          Lo ven todos los clubes al elegir sus deportes.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deporte-nombre" className="text-sm">
            Nombre
          </Label>
          <Input
            id="deporte-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Rugby masculino"
            maxLength={LARGO_MAXIMO_NOMBRE_DEPORTE}
            required
            autoFocus
          />
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Ícono</legend>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
            {ICONOS_DEPORTE.map((opcion) => {
              const elegido = icono === opcion.clave;
              return (
                <button
                  key={opcion.clave}
                  type="button"
                  aria-label={opcion.nombre}
                  aria-pressed={elegido}
                  title={opcion.nombre}
                  onClick={() => setIcono(opcion.clave)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    elegido ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                  )}
                >
                  <IconoDeporte clave={opcion.clave} className="size-5" />
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deporte-descripcion" className="text-sm">
            Descripción{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <textarea
            id="deporte-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Rugby XV para varones, de infantiles a plantel superior."
            maxLength={LARGO_MAXIMO_DESCRIPCION_DEPORTE}
            rows={3}
            className="min-h-20 w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
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
        <Button type="submit" disabled={pendiente || !nombre.trim()}>
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
      </SheetFooter>
    </form>
  );
}
