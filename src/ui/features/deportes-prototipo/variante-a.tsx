"use client";

/**
 * PROTOTIPO (#54), variante A «Lista y panel lateral».
 * Catálogo como lista; se edita en un panel lateral. Condición en bloques
 * anidados con un interruptor Y/O por bloque. Ícono elegido de un set.
 */

import { useState } from "react";
import { AlertTriangle, MoreHorizontal, Plus, Trash2, UserMinus, X } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { Badge } from "@/ui/nativos/badge";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/ui/nativos/sheet";
import { cn } from "@/lib/utils";
import {
  CATALOGO,
  DEL_CLUB,
  JUGADORES_RUGBY,
  agregarEnSubgrupo,
  condicionVacia,
  cumple,
  describir,
  edad,
  motivosConflicto,
  nuevoChequeo,
  nuevoSubgrupo,
  reemplazar,
  type Condicion,
  type Conector,
  type Deporte,
} from "./datos";
import { Confirmar, IconoSet, SET_ICONOS, SelectorCampo, ValorChequeo, claseInput } from "./comunes";
export function VarianteA({ pantalla, columnaCondicion = false }: { pantalla: string; columnaCondicion?: boolean }) {
  if (pantalla === "club") return <ClubA />;
  if (pantalla === "jugadores") return <JugadoresA />;
  return <CatalogoA columnaCondicion={columnaCondicion} />;
}

/** Variante D, la aprobada (19/11/2026): A con la columna «Condición» del catálogo de C. */
export function VarianteD({ pantalla }: { pantalla: string }) {
  return <VarianteA pantalla={pantalla} columnaCondicion />;
}

// ---------- catálogo (Super Admin) ----------

function CatalogoA({ columnaCondicion }: { columnaCondicion: boolean }) {
  const [deportes, setDeportes] = useState(CATALOGO);
  const [editando, setEditando] = useState<Deporte | null>(null);
  const [aBorrar, setABorrar] = useState<Deporte | null>(null);
  const [verBorrados, setVerBorrados] = useState(false);

  const activos = deportes.filter((d) => !d.borrado);
  const borrados = deportes.filter((d) => d.borrado);

  const nuevo = (): Deporte => ({
    id: `nuevo-${Date.now()}`,
    nombre: "",
    icono: "trophy",
    emoji: "🏅",
    color: "#555",
    descripcion: "",
    condicion: condicionVacia(),
    borrado: false,
    clubes: 0,
    jugadores: 0,
  });

  const guardar = (d: Deporte) => {
    setDeportes((ds) => (ds.some((x) => x.id === d.id) ? ds.map((x) => (x.id === d.id ? d : x)) : [...ds, d]));
    setEditando(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Deportes</h2>
          <p className="text-sm text-muted-foreground">El catálogo que ven todos los clubes. Cada club elige los suyos.</p>
        </div>
        <Button onClick={() => setEditando(nuevo())}>
          <Plus className="size-4" /> Nuevo deporte
        </Button>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {columnaCondicion ? (
          <li className="hidden items-center gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:flex" aria-hidden>
            <span className="w-10 shrink-0" />
            <span className="grid flex-1 grid-cols-2 gap-4">
              <span>Deporte</span>
              <span>Condición</span>
            </span>
            <span className="w-[7.5rem]">Uso</span>
            <span className="w-8" />
          </li>
        ) : null}
        {activos.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IconoSet clave={d.icono} className="size-5" />
            </span>
            {columnaCondicion ? (
              <button type="button" onClick={() => setEditando(d)} className="grid min-w-0 flex-1 gap-1 text-left sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
                <span className="min-w-0">
                  <span className="block font-medium">{d.nombre}</span>
                  <span className="block truncate text-xs text-muted-foreground">{d.descripcion}</span>
                </span>
                <span className="text-sm">{describir(d.condicion)}</span>
              </button>
            ) : (
              <button type="button" onClick={() => setEditando(d)} className="min-w-0 flex-1 text-left">
                <p className="font-medium">{d.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{describir(d.condicion)}</p>
              </button>
            )}
            <span className={cn("hidden text-xs text-muted-foreground sm:block", columnaCondicion && "w-[7.5rem]")}>
              {d.clubes} {d.clubes === 1 ? "club" : "clubes"} · {d.jugadores} jugadores
            </span>
            <Button variant="ghost" size="icon" aria-label={`Borrar ${d.nombre}`} onClick={() => setABorrar(d)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      {borrados.length > 0 ? (
        <div className="flex flex-col gap-2">
          <button type="button" className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={() => setVerBorrados((v) => !v)}>
            {verBorrados ? "Ocultar" : "Ver"} borrados ({borrados.length})
          </button>
          {verBorrados ? (
            <ul className="divide-y divide-border rounded-xl border border-dashed border-border">
              {borrados.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3 text-muted-foreground">
                  <IconoSet clave={d.icono} className="size-5" />
                  <span className="flex-1 line-through">{d.nombre}</span>
                  <span className="text-xs">{d.jugadores} jugadores siguen asociados</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Sheet open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {editando ? <FormularioA inicial={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} /> : null}
        </SheetContent>
      </Sheet>

      <Confirmar
        abierto={!!aBorrar}
        titulo={`¿Borrar «${aBorrar?.nombre}» del catálogo?`}
        accion="Borrar deporte"
        onCerrar={() => setABorrar(null)}
        onConfirmar={() => setDeportes((ds) => ds.map((d) => (d.id === aBorrar?.id ? { ...d, borrado: true } : d)))}
      >
        <span>
          Lo usan <strong>{aBorrar?.clubes} clubes</strong> con <strong>{aBorrar?.jugadores} jugadores</strong>.
        </span>
        <span>Los clubes ya no lo pueden elegir. Los jugadores siguen asociados, marcados en un deporte borrado.</span>
      </Confirmar>
    </div>
  );
}

function FormularioA({ inicial, onGuardar, onCancelar }: { inicial: Deporte; onGuardar: (d: Deporte) => void; onCancelar: () => void }) {
  const [d, setD] = useState(inicial);
  return (
    <>
      <SheetHeader>
        <SheetTitle>{inicial.nombre ? `Editar ${inicial.nombre}` : "Nuevo deporte"}</SheetTitle>
        <SheetDescription>Los cambios en la condición se aplican en todos los clubes que lo usan.</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nombre
          <input className={claseInput} value={d.nombre} placeholder="Rugby masculino" onChange={(e) => setD({ ...d, nombre: e.target.value })} />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Ícono</span>
          <div className="grid grid-cols-6 gap-1.5">
            {Object.keys(SET_ICONOS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setD({ ...d, icono: k })}
                className={cn("flex aspect-square items-center justify-center rounded-lg border", d.icono === k ? "border-primary bg-primary/10" : "border-border hover:bg-muted")}
                aria-label={k}
              >
                <IconoSet clave={k} className="size-5" />
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Descripción
          <textarea className={cn(claseInput, "h-20 py-2")} value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Condición para anotarse</span>
          <EditorBloques condicion={d.condicion} onChange={(condicion) => setD({ ...d, condicion })} />
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{describir(d.condicion)}</p>
        </div>
      </div>
      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button onClick={() => onGuardar(d)} disabled={!d.nombre.trim()}>
          Guardar
        </Button>
      </SheetFooter>
    </>
  );
}

// ---------- editor de condición: bloques anidados ----------

function InterruptorYO({ valor, onChange }: { valor: Conector; onChange: (c: Conector) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
      {(["Y", "O"] as const).map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} className={cn("rounded px-2 py-0.5", valor === c ? "bg-foreground text-background" : "text-muted-foreground")}>
          {c === "Y" ? "Todas (Y)" : "Alguna (O)"}
        </button>
      ))}
    </div>
  );
}

export function EditorBloques({ condicion, onChange }: { condicion: Condicion; onChange: (c: Condicion) => void }) {
  const tieneSubgrupo = condicion.items.some((it) => it.tipo === "grupo");
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Cumplir</span>
        <InterruptorYO valor={condicion.conector} onChange={(conector) => onChange({ ...condicion, conector })} />
      </div>
      {condicion.items.length === 0 ? <p className="text-xs text-muted-foreground">Sin chequeos: puede anotarse cualquier socio.</p> : null}
      {condicion.items.map((it) =>
        it.tipo === "grupo" ? (
          <div key={it.id} className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <InterruptorYO valor={it.conector} onChange={(conector) => onChange(reemplazar(condicion, it.id, { ...it, conector }))} />
              <Button variant="ghost" size="icon-sm" aria-label="Quitar grupo" onClick={() => onChange(reemplazar(condicion, it.id, null))}>
                <X className="size-4" />
              </Button>
            </div>
            {it.items.map((ch) => (
              <FilaChequeo key={ch.id} ch={ch} onChange={(n) => onChange(reemplazar(condicion, ch.id, n))} onQuitar={() => onChange(reemplazar(condicion, ch.id, null))} />
            ))}
            <Button variant="ghost" size="sm" className="self-start" onClick={() => onChange(agregarEnSubgrupo(condicion, it.id, nuevoChequeo("sexo")))}>
              <Plus className="size-3.5" /> Chequeo
            </Button>
          </div>
        ) : (
          <FilaChequeo key={it.id} ch={it} onChange={(n) => onChange(reemplazar(condicion, it.id, n))} onQuitar={() => onChange(reemplazar(condicion, it.id, null))} />
        ),
      )}
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => onChange({ ...condicion, items: [...condicion.items, nuevoChequeo("sexo")] })}>
          <Plus className="size-3.5" /> Chequeo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={tieneSubgrupo}
          title={tieneSubgrupo ? "Ya hay un grupo; como máximo un subnivel" : undefined}
          onClick={() => onChange({ ...condicion, items: [...condicion.items, nuevoSubgrupo(condicion.conector)] })}
        >
          <Plus className="size-3.5" /> Grupo
        </Button>
      </div>
    </div>
  );
}

function FilaChequeo({ ch, onChange, onQuitar }: { ch: Parameters<typeof ValorChequeo>[0]["ch"]; onChange: (c: typeof ch) => void; onQuitar: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-background p-1.5 ring-1 ring-border">
      <SelectorCampo valor={ch.campo} onChange={onChange} />
      <ValorChequeo ch={ch} onChange={onChange} />
      <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Quitar chequeo" onClick={onQuitar}>
        <X className="size-4" />
      </Button>
    </div>
  );
}

// ---------- deportes del club (Admin) ----------

function ClubA() {
  const [delClub, setDelClub] = useState(DEL_CLUB);
  const [aQuitar, setAQuitar] = useState<Deporte | null>(null);
  const disponibles = CATALOGO.filter((d) => !d.borrado);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28">
      <div>
        <h2 className="text-xl font-medium tracking-tight">Deportes del club</h2>
        <p className="text-sm text-muted-foreground">Elegí del catálogo los deportes que se practican en Los Cardos.</p>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {disponibles.map((d) => {
          const activo = delClub.includes(d.id);
          return (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3">
              <IconoSet clave={d.icono} className="size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{d.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{describir(d.condicion)}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={activo}
                aria-label={`${d.nombre} en el club`}
                onClick={() => (activo ? setAQuitar(d) : setDelClub((xs) => [...xs, d.id]))}
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", activo ? "bg-primary" : "bg-muted-foreground/30")}
              >
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", activo ? "left-[22px]" : "left-0.5")} />
              </button>
            </li>
          );
        })}
      </ul>
      <Confirmar
        abierto={!!aQuitar}
        titulo={`¿Quitar «${aQuitar?.nombre}» del club?`}
        accion="Quitar deporte"
        onCerrar={() => setAQuitar(null)}
        onConfirmar={() => setDelClub((xs) => xs.filter((x) => x !== aQuitar?.id))}
      >
        <span>
          Se cortan los vínculos de <strong>22 jugadores</strong> con este deporte. Siguen siendo socios.
        </span>
        <span>
          <strong>3</strong> dejan de ser jugadores porque no tienen otro deporte.
        </span>
      </Confirmar>
    </div>
  );
}

// ---------- jugadores de un deporte (Admin) ----------

function JugadoresA() {
  const rugby = CATALOGO[0];
  const [jugadores, setJugadores] = useState(JUGADORES_RUGBY);
  const [aSacar, setASacar] = useState<(typeof JUGADORES_RUGBY)[number] | null>(null);
  const enConflicto = jugadores.filter((j) => !cumple(rugby.condicion, j));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <IconoSet clave={rugby.icono} className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-medium tracking-tight">{rugby.nombre}</h2>
          <p className="text-sm text-muted-foreground">
            {jugadores.length} jugadores · {describir(rugby.condicion)}
          </p>
        </div>
      </div>
      {enConflicto.length > 0 ? (
        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-4" /> {enConflicto.length} jugadores ya no cumplen la condición del deporte.
        </p>
      ) : null}
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {jugadores.map((j) => {
          const motivos = motivosConflicto(rugby.condicion, j);
          const conflicto = motivos.length > 0;
          return (
            <li key={j.id} className={cn("flex items-center gap-3 px-4 py-3", conflicto && "bg-muted/50")}>
              <div className={cn("min-w-0 flex-1", conflicto && "opacity-60")}>
                <p className="font-medium">{j.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {j.sexo === "M" ? "Masculino" : "Femenino"} · {edad(j)} años en {2026}
                </p>
              </div>
              {conflicto ? (
                <>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                    En conflicto: no cumple «{motivos.join(", ")}»
                  </Badge>
                  <Button variant="destructive" size="sm" onClick={() => setASacar(j)}>
                    <UserMinus className="size-3.5" /> Sacar
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="icon" aria-label="Más">
                  <MoreHorizontal className="size-4" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <Confirmar
        abierto={!!aSacar}
        titulo={`¿Sacar a ${aSacar?.nombre} de ${rugby.nombre}?`}
        accion="Sacar del deporte"
        onCerrar={() => setASacar(null)}
        onConfirmar={() => setJugadores((js) => js.filter((x) => x.id !== aSacar?.id))}
      >
        <span>Sigue siendo socio.</span>
        <span>
          {aSacar?.otrosDeportes.length
            ? `Sigue siendo jugador de ${aSacar.otrosDeportes.join(", ")}.`
            : "No juega otro deporte, así que deja de ser jugador."}
        </span>
      </Confirmar>
    </div>
  );
}
