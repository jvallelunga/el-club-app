"use client";

/**
 * PROTOTIPO (#54), variante B «Mosaico y página completa».
 * Catálogo en mosaico; se edita en una página con vista previa en vivo de
 * quiénes pueden anotarse. Condición escrita como frases. Ícono = emoji.
 */

import { useState } from "react";
import { ArrowLeft, Check, Minus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/ui/nativos/button";
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
  type Jugador,
} from "./datos";
import { Confirmar, SelectorCampo, ValorChequeo, claseInput } from "./comunes";

export function VarianteB({ pantalla }: { pantalla: string }) {
  if (pantalla === "club") return <ClubB />;
  if (pantalla === "jugadores") return <JugadoresB />;
  return <CatalogoB />;
}

const EMOJIS = ["🏉", "🏑", "⚽", "🏀", "🏐", "🎾", "🏊", "🚴", "🏃", "🥋", "⛳", "🏓", "🧒", "🏅"];

// ---------- catálogo (Super Admin) ----------

function CatalogoB() {
  const [deportes, setDeportes] = useState(CATALOGO);
  const [editando, setEditando] = useState<Deporte | null>(null);
  const [aBorrar, setABorrar] = useState<Deporte | null>(null);

  if (editando) {
    return (
      <EditorPaginaB
        inicial={editando}
        onVolver={() => setEditando(null)}
        onGuardar={(d) => {
          setDeportes((ds) => (ds.some((x) => x.id === d.id) ? ds.map((x) => (x.id === d.id ? d : x)) : [...ds, d]));
          setEditando(null);
        }}
        onBorrar={editando.clubes || editando.jugadores ? () => setABorrar(editando) : undefined}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-28">
      <h2 className="text-xl font-medium tracking-tight">Catálogo de deportes</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {deportes.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              disabled={d.borrado}
              onClick={() => setEditando(d)}
              className={cn(
                "flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50",
                d.borrado && "cursor-default border-dashed opacity-50 hover:bg-card",
              )}
            >
              <span className="text-4xl">{d.emoji}</span>
              <span className="font-medium">{d.nombre}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{d.descripcion}</span>
              <span className="mt-auto text-xs text-muted-foreground">{d.borrado ? "Borrado" : `${d.clubes} clubes`}</span>
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() =>
              setEditando({ id: `n-${Date.now()}`, nombre: "", icono: "trophy", emoji: "🏅", color: "#555", descripcion: "", condicion: condicionVacia(), borrado: false, clubes: 0, jugadores: 0 })
            }
            className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-muted/40"
          >
            <Plus className="size-6" /> Nuevo deporte
          </button>
        </li>
      </ul>
      <Confirmar
        abierto={!!aBorrar}
        titulo={`¿Borrar «${aBorrar?.nombre}»?`}
        accion="Borrar"
        onCerrar={() => setABorrar(null)}
        onConfirmar={() => {
          setDeportes((ds) => ds.map((d) => (d.id === aBorrar?.id ? { ...d, borrado: true } : d)));
          setEditando(null);
        }}
      >
        <span>
          {aBorrar?.clubes} clubes lo tienen y {aBorrar?.jugadores} jugadores están anotados. No pierden el vínculo: van a figurar en un deporte que ya no existe.
        </span>
      </Confirmar>
    </div>
  );
}

function EditorPaginaB({
  inicial,
  onVolver,
  onGuardar,
  onBorrar,
}: {
  inicial: Deporte;
  onVolver: () => void;
  onGuardar: (d: Deporte) => void;
  onBorrar?: () => void;
}) {
  const [d, setD] = useState(inicial);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-28">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onVolver} aria-label="Volver al catálogo">
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="flex-1 text-xl font-medium tracking-tight">{inicial.nombre || "Nuevo deporte"}</h2>
        {onBorrar ? (
          <Button variant="destructive" onClick={onBorrar}>
            <Trash2 className="size-4" /> Borrar
          </Button>
        ) : null}
        <Button onClick={() => onGuardar(d)} disabled={!d.nombre.trim()}>
          Guardar
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <section className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <span className="flex size-20 items-center justify-center rounded-2xl bg-muted text-5xl">{d.emoji}</span>
              <div className="grid grid-cols-7 gap-0.5">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setD({ ...d, emoji: e })} className={cn("rounded p-0.5 text-lg", d.emoji === e && "bg-primary/15")}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <input className={cn(claseInput, "h-12 text-lg font-medium")} placeholder="Nombre del deporte" value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
              <textarea className={cn(claseInput, "h-24 py-2")} placeholder="Descripción" value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-medium">¿Quién puede anotarse?</h3>
            <EditorFrases condicion={d.condicion} onChange={(condicion) => setD({ ...d, condicion })} />
          </section>
        </div>

        <aside className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4 lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Vista previa</p>
          <p className="text-sm">{describir(d.condicion)}</p>
          <ul className="flex flex-col gap-1.5">
            {SOCIOS_EJEMPLO.map((s) => {
              const ok = cumple(d.condicion, s);
              return (
                <li key={s.id} className={cn("flex items-center gap-2 text-sm", !ok && "text-muted-foreground line-through")}>
                  {ok ? <Check className="size-4 text-emerald-600" /> : <Minus className="size-4" />}
                  {s.nombre}
                </li>
              );
            })}
          </ul>
          {inicial.jugadores ? (
            <p className="text-xs text-muted-foreground">
              Hoy hay {inicial.jugadores} jugadores en {inicial.clubes} clubes. Los que dejen de cumplir quedan en conflicto en su club.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

// ---------- editor de condición: frases ----------

function ElegirConector({ valor, onChange, sub }: { valor: Conector; onChange: (c: Conector) => void; sub?: boolean }) {
  return (
    <span className="text-sm">
      {sub ? "o bien, que cumpla " : "Pueden anotarse los socios que cumplan "}
      <select className="rounded-md border-b-2 border-primary bg-transparent px-1 font-medium" value={valor} onChange={(e) => onChange(e.target.value as Conector)}>
        <option value="Y">todas</option>
        <option value="O">alguna</option>
      </select>
      {" de estas:"}
    </span>
  );
}

function Frase({ ch, onChange, onQuitar }: { ch: Chequeo; onChange: (c: Chequeo) => void; onQuitar: () => void }) {
  return (
    <li className="group flex flex-wrap items-center gap-2 py-1">
      <span className="text-muted-foreground">•</span>
      <SelectorCampo valor={ch.campo} onChange={onChange} className="border-0 border-b bg-transparent px-0 font-medium" />
      <span className="text-sm text-muted-foreground">{ch.campo === "sexo" ? "es" : ""}</span>
      <ValorChequeo ch={ch} onChange={onChange} />
      <button type="button" onClick={onQuitar} className="text-muted-foreground opacity-0 group-hover:opacity-100" aria-label="Quitar">
        <X className="size-4" />
      </button>
    </li>
  );
}

function EditorFrases({ condicion, onChange }: { condicion: Condicion; onChange: (c: Condicion) => void }) {
  const tieneSubgrupo = condicion.items.some((it) => it.tipo === "grupo");
  return (
    <div className="flex flex-col gap-1">
      <ElegirConector valor={condicion.conector} onChange={(conector) => onChange({ ...condicion, conector })} />
      <ul className="flex flex-col pl-2">
        {condicion.items.map((it) =>
          it.tipo === "grupo" ? (
            <li key={it.id} className="my-1 border-l-2 border-primary/40 pl-3">
              <ElegirConector sub valor={it.conector} onChange={(conector) => onChange(reemplazar(condicion, it.id, { ...it, conector }))} />
              <ul className="flex flex-col pl-2">
                {it.items.map((ch) => (
                  <Frase key={ch.id} ch={ch} onChange={(n) => onChange(reemplazar(condicion, ch.id, n))} onQuitar={() => onChange(reemplazar(condicion, ch.id, null))} />
                ))}
              </ul>
              <button type="button" className="text-xs text-enlace hover:underline" onClick={() => onChange(agregarEnSubgrupo(condicion, it.id, nuevoChequeo("edad")))}>
                + otra
              </button>
            </li>
          ) : (
            <Frase key={it.id} ch={it} onChange={(n) => onChange(reemplazar(condicion, it.id, n))} onQuitar={() => onChange(reemplazar(condicion, it.id, null))} />
          ),
        )}
      </ul>
      <div className="flex gap-4 pl-2 text-sm">
        <button type="button" className="text-enlace hover:underline" onClick={() => onChange({ ...condicion, items: [...condicion.items, nuevoChequeo("sexo")] })}>
          + Agregar requisito
        </button>
        {!tieneSubgrupo ? (
          <button type="button" className="text-enlace hover:underline" onClick={() => onChange({ ...condicion, items: [...condicion.items, nuevoSubgrupo(condicion.conector)] })}>
            + Agregar grupo de requisitos
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---------- deportes del club (Admin) ----------

function ClubB() {
  const [delClub, setDelClub] = useState(DEL_CLUB);
  const [aQuitar, setAQuitar] = useState<Deporte | null>(null);
  const activos = CATALOGO.filter((d) => !d.borrado);
  const enClub = activos.filter((d) => delClub.includes(d.id));
  const resto = activos.filter((d) => !delClub.includes(d.id));

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 pb-28 md:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium tracking-tight">En Los Cardos</h2>
        {enClub.map((d) => (
          <div key={d.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <span className="text-3xl">{d.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{d.nombre}</p>
              <p className="text-xs text-muted-foreground">{describir(d.condicion)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAQuitar(d)}>
              Quitar
            </Button>
          </div>
        ))}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Para sumar, del catálogo</h2>
        {resto.map((d) => (
          <div key={d.id} className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-4">
            <span className="text-3xl opacity-60">{d.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{d.nombre}</p>
              <p className="text-xs text-muted-foreground">{d.descripcion}</p>
            </div>
            <Button size="sm" onClick={() => setDelClub((xs) => [...xs, d.id])}>
              <Plus className="size-3.5" /> Sumar
            </Button>
          </div>
        ))}
      </section>
      <Confirmar
        abierto={!!aQuitar}
        titulo={`¿Quitar ${aQuitar?.nombre}?`}
        accion="Quitar"
        onCerrar={() => setAQuitar(null)}
        onConfirmar={() => setDelClub((xs) => xs.filter((x) => x !== aQuitar?.id))}
      >
        <span>22 jugadores dejan de estar anotados en {aQuitar?.nombre}. 3 de ellos no juegan otro deporte y dejan de ser jugadores; todos siguen siendo socios.</span>
      </Confirmar>
    </div>
  );
}

// ---------- jugadores de un deporte (Admin) ----------

function JugadoresB() {
  const rugby = CATALOGO[0];
  const [jugadores, setJugadores] = useState(JUGADORES_RUGBY);
  const [aSacar, setASacar] = useState<Jugador[] | null>(null);
  const conflicto = jugadores.filter((j) => !cumple(rugby.condicion, j));
  const ok = jugadores.filter((j) => cumple(rugby.condicion, j));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{rugby.emoji}</span>
        <h2 className="text-xl font-medium tracking-tight">{rugby.nombre}</h2>
      </div>

      {conflicto.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-sm">
              <strong>Cambió la condición del deporte.</strong> Ahora es «{describir(rugby.condicion)}». Estos {conflicto.length} jugadores ya no la cumplen y quedan
              deshabilitados.
            </p>
            <Button variant="destructive" size="sm" onClick={() => setASacar(conflicto)}>
              Sacar a los {conflicto.length}
            </Button>
          </div>
          <ul className="flex flex-col gap-1">
            {conflicto.map((j) => (
              <li key={j.id} className="flex items-center gap-2 rounded-lg bg-background/70 px-3 py-2 text-sm">
                <span className="flex-1 text-muted-foreground">
                  {j.nombre} · {edad(j)} años · no cumple {motivosConflicto(rugby.condicion, j).join(", ")}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setASacar([j])}>
                  Sacar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-1">
        <h3 className="text-sm text-muted-foreground">{ok.length} jugadores</h3>
        {ok.map((j) => (
          <div key={j.id} className="flex items-center justify-between border-b border-border py-2.5 text-sm">
            <span>{j.nombre}</span>
            <span className="text-muted-foreground">{edad(j)} años</span>
          </div>
        ))}
      </section>

      <Confirmar
        abierto={!!aSacar}
        titulo={aSacar?.length === 1 ? `¿Sacar a ${aSacar[0].nombre}?` : `¿Sacar a ${aSacar?.length} jugadores?`}
        accion="Sacar"
        onCerrar={() => setASacar(null)}
        onConfirmar={() => setJugadores((js) => js.filter((j) => !aSacar?.some((x) => x.id === j.id)))}
      >
        <span>Dejan de ser jugadores de {rugby.nombre}. Siguen siendo socios, y jugadores de sus otros deportes si tienen.</span>
      </Confirmar>
    </div>
  );
}
