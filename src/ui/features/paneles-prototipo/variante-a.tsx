"use client";

/** PROTOTIPO (#85) · Variante A: la cabecera abre un desplegable, como los perfiles de Chrome. */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CABECERA,
  Escudo,
  IconoPanel,
  LogoApp,
  Nav,
  Pagina,
  Salir,
  mismoPanel,
  nombrePanel,
  useMock,
  type Panel,
  type Perfil,
} from "./comunes";

export function VarianteA({ perfil }: { perfil: Perfil }) {
  const m = useMock(perfil);
  const barra = (
    <div className="flex h-full w-64 flex-col">
      <Cabecera {...m} />
      <Nav panel={m.panel} activo={m.activo} onElegir={m.setActivo} />
      <Salir />
    </div>
  );
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

function Cabecera({
  panel,
  clubes,
  super: esSuper,
  elegir,
}: ReturnType<typeof useMock>) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const caja = useRef<HTMLDivElement>(null);
  const hayVarios = esSuper || clubes.length > 1;

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  const contenido = (
    <>
      <IconoPanel panel={panel} />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm leading-snug font-medium">{nombrePanel(panel)}</p>
        <p className="text-xs text-muted-foreground">{esSuper ? "Super Admin" : "Admin"}</p>
      </div>
    </>
  );

  if (!hayVarios) {
    return <div className={cn(CABECERA, "gap-3 px-4")}>{contenido}</div>;
  }

  const visibles = clubes.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const ir = (p: Panel) => {
    elegir(p);
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <div ref={caja} className={cn(CABECERA, "relative px-2")}>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60"
      >
        {contenido}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {abierto ? (
        <div className="absolute top-[calc(100%-4px)] left-2 z-50 flex max-h-[70svh] w-[calc(100%-1rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl lg:w-72">
          {esSuper ? (
            <>
              <Fila activo={panel.tipo === "super"} onClick={() => ir({ tipo: "super" })}>
                <LogoApp chico />
                <span className="flex-1 truncate">Panel del Super Admin</span>
              </Fila>
              <div className="border-t border-border" />
            </>
          ) : null}
          <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Clubes</p>
          {clubes.length >= 8 ? (
            <div className="px-2 pb-1">
              <label className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm">
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
          <div className="overflow-y-auto pb-1">
            {visibles.map((club) => (
              <Fila key={club.slug} activo={mismoPanel(panel, { tipo: "club", club })} onClick={() => ir({ tipo: "club", club })}>
                <Escudo club={club} chico />
                <span className="flex-1 truncate">{club.nombre}</span>
              </Fila>
            ))}
            {visibles.length === 0 ? <p className="px-3 py-2 text-sm text-muted-foreground">Ningún club se llama así.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Fila({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted">
      {children}
      {activo ? <Check className="size-4 shrink-0" /> : null}
    </button>
  );
}
