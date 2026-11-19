"use client";

/**
 * PROTOTIPO (#54), variante C «Tabla y asistente».
 * Catálogo en tabla densa; alta y edición con un asistente de 3 pasos.
 * Condición como tabla de reglas con sangría para el grupo. Ícono subido.
 */

import { useState } from "react";
import { ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/nativos/dialog";
import { cn } from "@/lib/utils";
import {
  CATALOGO,
  DEL_CLUB,
  JUGADORES_RUGBY,
  SOCIOS_EJEMPLO,
  agregarEnSubgrupo,
  condicionVacia,
  cumple,
  describir,
  edad,
  motivosConflicto,
  nuevoChequeo,
  nuevoSubgrupo,
  reemplazar,
  type Chequeo,
  type Condicion,
  type Conector,
  type Deporte,
} from "./datos";
import { Confirmar, IconoSubido, SelectorCampo, ValorChequeo, claseInput } from "./comunes";

export function VarianteC({ pantalla }: { pantalla: string }) {
  if (pantalla === "club") return <ClubC />;
  if (pantalla === "jugadores") return <JugadoresC />;
  return <CatalogoC />;
}

const th = "px-3 py-2 text-left text-xs font-medium text-muted-foreground";
const td = "px-3 py-2.5 align-middle";

// ---------- catálogo (Super Admin) ----------

function CatalogoC() {
  const [deportes, setDeportes] = useState(CATALOGO);
  const [editando, setEditando] = useState<Deporte | null>(null);
  const [aBorrar, setABorrar] = useState<Deporte | null>(null);
  const [filtro, setFiltro] = useState<"activos" | "borrados">("activos");
  const visibles = deportes.filter((d) => (filtro === "borrados" ? d.borrado : !d.borrado));

  return (
    <div className="flex w-full flex-col gap-4 pb-28">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
          {(["activos", "borrados"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFiltro(f)} className={cn("rounded-md px-3 py-1 capitalize", filtro === f ? "bg-muted font-medium" : "text-muted-foreground")}>
              {f} ({deportes.filter((d) => (f === "borrados" ? d.borrado : !d.borrado)).length})
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          onClick={() =>
            setEditando({ id: `n-${Date.now()}`, nombre: "", icono: "", emoji: "", color: "#6b7280", descripcion: "", condicion: condicionVacia(), borrado: false, clubes: 0, jugadores: 0 })
          }
        >
          <Plus className="size-4" /> Nuevo deporte
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className={th} />
              <th className={th}>Deporte</th>
              <th className={th}>Condición</th>
              <th className={cn(th, "text-right")}>Clubes</th>
              <th className={cn(th, "text-right")}>Jugadores</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibles.map((d) => (
              <tr key={d.id} className={cn(d.borrado && "text-muted-foreground")}>
                <td className={cn(td, "w-10")}>
                  <IconoSubido deporte={d} className={cn("size-8", d.borrado && "opacity-40")} />
                </td>
                <td className={td}>
                  <p className="font-medium">{d.nombre}</p>
                  <p className="text-xs text-muted-foreground">{d.descripcion}</p>
                </td>
                <td className={cn(td, "max-w-64 text-xs")}>{describir(d.condicion)}</td>
                <td className={cn(td, "text-right tabular-nums")}>{d.clubes}</td>
                <td className={cn(td, "text-right tabular-nums")}>{d.jugadores}</td>
                <td className={cn(td, "w-24 text-right whitespace-nowrap")}>
                  {d.borrado ? (
                    <span className="text-xs">Borrado</span>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditando(d)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Borrar" onClick={() => setABorrar(d)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando ? (
        <Asistente
          inicial={editando}
          onCerrar={() => setEditando(null)}
          onGuardar={(d) => {
            setDeportes((ds) => (ds.some((x) => x.id === d.id) ? ds.map((x) => (x.id === d.id ? d : x)) : [...ds, d]));
            setEditando(null);
          }}
        />
      ) : null}

      <Confirmar
        abierto={!!aBorrar}
        titulo={`¿Borrar ${aBorrar?.nombre}?`}
        accion="Borrar"
        onCerrar={() => setABorrar(null)}
        onConfirmar={() => setDeportes((ds) => ds.map((d) => (d.id === aBorrar?.id ? { ...d, borrado: true } : d)))}
      >
        <span>
          Queda en «Borrados». {aBorrar?.jugadores} jugadores de {aBorrar?.clubes} clubes siguen asociados y se ven marcados con un deporte que ya no existe.
        </span>
      </Confirmar>
    </div>
  );
}

const PASOS = ["Datos", "Condición", "Revisar"];

function Asistente({ inicial, onCerrar, onGuardar }: { inicial: Deporte; onCerrar: () => void; onGuardar: (d: Deporte) => void }) {
  const [d, setD] = useState(inicial);
  const [paso, setPaso] = useState(0);
  const pasan = SOCIOS_EJEMPLO.filter((s) => cumple(d.condicion, s)).length;
  const conflicto = Math.round(inicial.jugadores * (1 - pasan / SOCIOS_EJEMPLO.length) * 0.1);

  return (
    <Dialog open onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{inicial.nombre ? `Editar ${inicial.nombre}` : "Nuevo deporte"}</DialogTitle>
          <ol className="flex gap-2 pt-2 text-xs">
            {PASOS.map((p, i) => (
              <li key={p} className={cn("flex items-center gap-1.5", i === paso ? "font-medium text-foreground" : "text-muted-foreground")}>
                <span className={cn("flex size-5 items-center justify-center rounded-full border", i <= paso && "border-primary bg-primary text-primary-foreground")}>{i + 1}</span>
                {p}
                {i < PASOS.length - 1 ? <span className="mx-1 text-muted-foreground">—</span> : null}
              </li>
            ))}
          </ol>
        </DialogHeader>

        {paso === 0 ? (
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <button type="button" className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground hover:bg-muted/40">
              {d.nombre ? <IconoSubido deporte={d} className="size-14 text-base" /> : <ImageUp className="size-6" />}
              Subir ícono
              <span className="text-[10px]">PNG o SVG, cuadrado</span>
            </button>
            <div className="flex flex-col gap-3">
              <input className={claseInput} placeholder="Nombre" value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
              <textarea className={cn(claseInput, "h-20 py-2")} placeholder="Descripción" value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} />
            </div>
          </div>
        ) : null}

        {paso === 1 ? <EditorTabla condicion={d.condicion} onChange={(condicion) => setD({ ...d, condicion })} /> : null}

        {paso === 2 ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Deporte</dt>
            <dd className="flex items-center gap-2">
              <IconoSubido deporte={d} className="size-6" /> {d.nombre || "—"}
            </dd>
            <dt className="text-muted-foreground">Descripción</dt>
            <dd>{d.descripcion || "—"}</dd>
            <dt className="text-muted-foreground">Condición</dt>
            <dd>{describir(d.condicion)}</dd>
            {inicial.jugadores ? (
              <>
                <dt className="text-muted-foreground">Efecto</dt>
                <dd className="text-amber-700 dark:text-amber-400">
                  Con la condición nueva, unos {conflicto} de los {inicial.jugadores} jugadores quedarían en conflicto en sus clubes.
                </dd>
              </>
            ) : null}
          </dl>
        ) : null}

        <DialogFooter>
          {paso > 0 ? (
            <Button variant="outline" onClick={() => setPaso(paso - 1)}>
              Atrás
            </Button>
          ) : null}
          {paso < 2 ? (
            <Button onClick={() => setPaso(paso + 1)} disabled={paso === 0 && !d.nombre.trim()}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={() => onGuardar(d)}>Guardar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- editor de condición: tabla de reglas ----------

function CeldaConector({ primero, conector, onChange }: { primero: boolean; conector: Conector; onChange: (c: Conector) => void }) {
  if (primero) return <span className="text-xs text-muted-foreground">Donde</span>;
  return (
    <select className="h-8 rounded-md border border-border bg-muted px-1.5 text-xs font-semibold" value={conector} onChange={(e) => onChange(e.target.value as Conector)}>
      <option value="Y">Y</option>
      <option value="O">O</option>
    </select>
  );
}

function FilaRegla({ ch, conector, primero, onConector, onChange, onQuitar, sangria }: {
  ch: Chequeo;
  conector: Conector;
  primero: boolean;
  onConector: (c: Conector) => void;
  onChange: (c: Chequeo) => void;
  onQuitar: () => void;
  sangria?: boolean;
}) {
  return (
    <tr>
      <td className={cn("w-16 py-1.5 pr-2", sangria && "pl-6")}>
        <CeldaConector primero={primero} conector={conector} onChange={onConector} />
      </td>
      <td className="py-1.5 pr-2">
        <SelectorCampo valor={ch.campo} onChange={onChange} className="w-full" />
      </td>
      <td className="py-1.5 pr-2">
        <ValorChequeo ch={ch} onChange={onChange} />
      </td>
      <td className="w-8 py-1.5">
        <Button variant="ghost" size="icon-sm" aria-label="Quitar" onClick={onQuitar}>
          <X className="size-4" />
        </Button>
      </td>
    </tr>
  );
}

function EditorTabla({ condicion, onChange }: { condicion: Condicion; onChange: (c: Condicion) => void }) {
  const tieneSubgrupo = condicion.items.some((it) => it.tipo === "grupo");
  const setConector = (conector: Conector) => onChange({ ...condicion, conector });
  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-sm">
        <tbody>
          {condicion.items.map((it, i) =>
            it.tipo === "grupo" ? (
              [
                <tr key={`${it.id}-cab`}>
                  <td className="w-16 py-1.5 pr-2">
                    <CeldaConector primero={i === 0} conector={condicion.conector} onChange={setConector} />
                  </td>
                  <td colSpan={3} className="py-1.5 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">(</span> grupo
                    <button type="button" className="ml-2 text-enlace hover:underline" onClick={() => onChange(reemplazar(condicion, it.id, null))}>
                      quitar grupo
                    </button>
                  </td>
                </tr>,
                ...it.items.map((ch, j) => (
                  <FilaRegla
                    key={ch.id}
                    sangria
                    ch={ch}
                    primero={j === 0}
                    conector={it.conector}
                    onConector={(conector) => onChange(reemplazar(condicion, it.id, { ...it, conector }))}
                    onChange={(n) => onChange(reemplazar(condicion, ch.id, n))}
                    onQuitar={() => onChange(reemplazar(condicion, ch.id, null))}
                  />
                )),
                <tr key={`${it.id}-pie`}>
                  <td className="pl-6" />
                  <td colSpan={3} className="pb-1.5 text-xs">
                    <button type="button" className="text-enlace hover:underline" onClick={() => onChange(agregarEnSubgrupo(condicion, it.id, nuevoChequeo("edad")))}>
                      + regla en el grupo
                    </button>
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">)</span>
                  </td>
                </tr>,
              ]
            ) : (
              <FilaRegla
                key={it.id}
                ch={it}
                primero={i === 0}
                conector={condicion.conector}
                onConector={setConector}
                onChange={(n) => onChange(reemplazar(condicion, it.id, n))}
                onQuitar={() => onChange(reemplazar(condicion, it.id, null))}
              />
            ),
          )}
        </tbody>
      </table>
      {condicion.items.length === 0 ? <p className="text-xs text-muted-foreground">Sin reglas: cualquier socio puede anotarse.</p> : null}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onChange({ ...condicion, items: [...condicion.items, nuevoChequeo("sexo")] })}>
          <Plus className="size-3.5" /> Regla
        </Button>
        <Button variant="outline" size="sm" disabled={tieneSubgrupo} onClick={() => onChange({ ...condicion, items: [...condicion.items, nuevoSubgrupo(condicion.conector)] })}>
          <Plus className="size-3.5" /> Grupo ( )
        </Button>
      </div>
      <p className="rounded-md border border-border px-3 py-2 font-mono text-xs">{describir(condicion)}</p>
    </div>
  );
}

// ---------- deportes del club (Admin) ----------

function ClubC() {
  const [guardado, setGuardado] = useState(DEL_CLUB);
  const [marcados, setMarcados] = useState(DEL_CLUB);
  const [confirmar, setConfirmar] = useState(false);
  const activos = CATALOGO.filter((d) => !d.borrado);
  const quitados = guardado.filter((id) => !marcados.includes(id));
  const sumados = marcados.filter((id) => !guardado.includes(id));
  const nombre = (id: string) => CATALOGO.find((d) => d.id === id)?.nombre;
  const hayCambios = quitados.length + sumados.length > 0;

  const guardar = () => {
    setGuardado(marcados);
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-40">
      <p className="text-sm text-muted-foreground">Marcá los deportes del catálogo que tiene el club y guardá.</p>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className={cn(th, "w-24")}>En el club</th>
              <th className={th}>Deporte</th>
              <th className={th}>Condición</th>
              <th className={cn(th, "text-right")}>Jugadores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activos.map((d) => {
              const m = marcados.includes(d.id);
              return (
                <tr key={d.id} className={cn(m && "bg-primary/5")}>
                  <td className={td}>
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={m}
                      onChange={() => setMarcados((xs) => (m ? xs.filter((x) => x !== d.id) : [...xs, d.id]))}
                      aria-label={d.nombre}
                    />
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-2 font-medium">
                      <IconoSubido deporte={d} className="size-6" /> {d.nombre}
                    </span>
                  </td>
                  <td className={cn(td, "text-xs text-muted-foreground")}>{describir(d.condicion)}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{guardado.includes(d.id) ? 22 : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hayCambios ? (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex w-[min(640px,calc(100%-2rem))] items-center gap-3 rounded-xl border border-border bg-popover p-3 text-sm shadow-lg">
          <span className="flex-1">
            {sumados.length ? `Sumar: ${sumados.map(nombre).join(", ")}. ` : ""}
            {quitados.length ? `Quitar: ${quitados.map(nombre).join(", ")}.` : ""}
          </span>
          <Button variant="outline" size="sm" onClick={() => setMarcados(guardado)}>
            Descartar
          </Button>
          <Button size="sm" onClick={() => (quitados.length ? setConfirmar(true) : guardar())}>
            Guardar
          </Button>
        </div>
      ) : null}
      <Confirmar abierto={confirmar} titulo="¿Quitar deportes del club?" accion="Guardar y quitar" onCerrar={() => setConfirmar(false)} onConfirmar={guardar}>
        <span>
          Vas a quitar <strong>{quitados.map(nombre).join(", ")}</strong>. Se cortan los vínculos de {22 * quitados.length} jugadores con esos deportes; siguen siendo socios.
        </span>
      </Confirmar>
    </div>
  );
}

// ---------- jugadores de un deporte (Admin) ----------

function JugadoresC() {
  const rugby = CATALOGO[0];
  const [jugadores, setJugadores] = useState(JUGADORES_RUGBY);
  const [filtro, setFiltro] = useState<"todos" | "conflicto">("todos");
  const [sel, setSel] = useState<string[]>([]);
  const [confirmar, setConfirmar] = useState(false);
  const enConflicto = (j: (typeof jugadores)[number]) => !cumple(rugby.condicion, j);
  const visibles = jugadores.filter((j) => filtro === "todos" || enConflicto(j));
  const cantConflicto = jugadores.filter(enConflicto).length;

  return (
    <div className="flex w-full flex-col gap-4 pb-28">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 font-medium">
          <IconoSubido deporte={rugby} className="size-7" /> {rugby.nombre}
        </span>
        <span className="text-xs text-muted-foreground">· {describir(rugby.condicion)}</span>
        <div className="flex-1" />
        {(["todos", "conflicto"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFiltro(f);
              setSel([]);
            }}
            className={cn("rounded-full border px-3 py-1 text-xs", filtro === f ? "border-foreground bg-foreground text-background" : "border-border")}
          >
            {f === "todos" ? `Todos (${jugadores.length})` : `En conflicto (${cantConflicto})`}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className={cn(th, "w-10")} />
              <th className={th}>Jugador</th>
              <th className={th}>Sexo</th>
              <th className={cn(th, "text-right")}>Edad {2026}</th>
              <th className={th}>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibles.map((j) => {
              const c = enConflicto(j);
              return (
                <tr key={j.id} className={cn(c && "bg-muted/60 text-muted-foreground")}>
                  <td className={td}>
                    {c ? (
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={sel.includes(j.id)}
                        onChange={() => setSel((s) => (s.includes(j.id) ? s.filter((x) => x !== j.id) : [...s, j.id]))}
                        aria-label={`Elegir ${j.nombre}`}
                      />
                    ) : null}
                  </td>
                  <td className={td}>{j.nombre}</td>
                  <td className={td}>{j.sexo === "M" ? "Masc." : "Fem."}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{edad(j)}</td>
                  <td className={td}>
                    {c ? (
                      <span className="text-xs text-amber-700 dark:text-amber-400">Deshabilitado · no cumple {motivosConflicto(rugby.condicion, j).join(", ")}</span>
                    ) : (
                      <span className="text-xs">Habilitado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sel.length ? (
        <div className="flex items-center gap-3">
          <span className="text-sm">{sel.length} elegidos</span>
          <Button variant="destructive" size="sm" onClick={() => setConfirmar(true)}>
            Sacar del deporte
          </Button>
        </div>
      ) : cantConflicto ? (
        <p className="text-xs text-muted-foreground">Elegí jugadores deshabilitados para sacarlos del deporte.</p>
      ) : null}
      <Confirmar
        abierto={confirmar}
        titulo={`¿Sacar ${sel.length} jugadores de ${rugby.nombre}?`}
        accion="Sacar"
        onCerrar={() => setConfirmar(false)}
        onConfirmar={() => {
          setJugadores((js) => js.filter((j) => !sel.includes(j.id)));
          setSel([]);
        }}
      >
        <span>Siguen siendo socios. Los que no tienen otro deporte dejan de ser jugadores.</span>
      </Confirmar>
    </div>
  );
}
