"use client";

/**
 * PROTOTIPO (#85) · Variante C: tocar la cabecera da vuelta el menú. En vez de
 * las secciones, la barra lateral muestra «Cambiar de panel» con la lista
 * completa, grande y con buscador. Igual en el celular.
 */

import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CABECERA, Escudo, IconoPanel, LogoApp, Nav, Pagina, Salir, mismoPanel, nombrePanel, useMock, type Panel, type Perfil } from "./comunes";

export function VarianteC({ perfil }: { perfil: Perfil }) {
  const m = useMock(perfil);
  const barra = <Barra m={m} />;
  return (
    <Pagina
      barra={barra}
      menuMovil={barra}
      panel={m.panel}
      activo={m.activo}
      super={m.super}
      onEntrar={(club) => m.elegir({ tipo: "club", club })}
    />
  );
}

function Barra({ m }: { m: ReturnType<typeof useMock> }) {
  const [cambiando, setCambiando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const hayVarios = m.super || m.clubes.length > 1;

  const ir = (p: Panel) => {
    m.elegir(p);
    setCambiando(false);
    setBusqueda("");
  };

  if (cambiando) {
    const visibles = m.clubes.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    return (
      <div className="flex h-full w-64 flex-col">
        <div className={cn(CABECERA, "gap-2 px-2")}>
          <button type="button" onClick={() => setCambiando(false)} className="rounded-lg p-2 hover:bg-muted" aria-label="Volver al menú">
            <ArrowLeft className="size-5" />
          </button>
          <p className="text-sm font-medium">Cambiar de panel</p>
        </div>
        {m.clubes.length >= 8 ? (
          <div className="p-3 pb-1">
            <label className="flex items-center gap-2 rounded-lg border border-border px-2 py-2 text-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar club"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </label>
          </div>
        ) : null}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {m.super ? (
            <>
              <Fila activo={m.panel.tipo === "super"} onClick={() => ir({ tipo: "super" })} rol="Todos los clubes">
                <LogoApp />
                <span>Panel del Super Admin</span>
              </Fila>
              <p className="px-3 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Clubes</p>
            </>
          ) : null}
          {visibles.map((club) => (
            <Fila key={club.slug} activo={mismoPanel(m.panel, { tipo: "club", club })} onClick={() => ir({ tipo: "club", club })} rol={m.super ? "Como Super Admin" : "Admin"}>
              <Escudo club={club} />
              <span>{club.nombre}</span>
            </Fila>
          ))}
          {visibles.length === 0 ? <p className="px-3 py-2 text-sm text-muted-foreground">Ningún club se llama así.</p> : null}
        </div>
      </div>
    );
  }

  const cabecera = (
    <>
      <IconoPanel panel={m.panel} />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm leading-snug font-medium">{nombrePanel(m.panel)}</p>
        <p className="text-xs text-muted-foreground">{hayVarios ? "Cambiar de panel" : "Admin"}</p>
      </div>
    </>
  );

  return (
    <div className="flex h-full w-64 flex-col">
      {hayVarios ? (
        <div className={cn(CABECERA, "px-2")}>
          <button type="button" onClick={() => setCambiando(true)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
            {cabecera}
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className={cn(CABECERA, "gap-3 px-4")}>{cabecera}</div>
      )}
      <Nav panel={m.panel} activo={m.activo} onElegir={m.setActivo} />
      <Salir />
    </div>
  );
}

function Fila({ activo, onClick, rol, children }: { activo: boolean; onClick: () => void; rol: string; children: [React.ReactNode, React.ReactNode] }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-3 rounded-xl px-2 py-2 text-left", activo ? "bg-muted" : "hover:bg-muted/60")}
    >
      {children[0]}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{children[1]}</span>
        <span className="block text-xs text-muted-foreground">{rol}</span>
      </span>
      {activo ? <Check className="size-4 shrink-0" /> : null}
    </button>
  );
}
