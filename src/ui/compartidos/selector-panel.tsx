"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoElClub } from "@/ui/marca/logo-el-club";
import { EscudoClub } from "./escudo-club";
import type { OpcionesSelector } from "./shell-admin";

/**
 * Selector de panel: la cabecera del menú abre un desplegable con el Panel
 * del Super Admin (si corresponde) y los clubes, como los perfiles de un
 * navegador. Elegir un club lleva a su Inicio.
 */
export function SelectorPanel({
  opciones,
  children,
}: {
  opciones: OpcionesSelector;
  /** Lo que muestra la cabecera cerrada: escudo o logo, nombre y rol. */
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (evento: MouseEvent) => {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const escape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const texto = busqueda.trim().toLowerCase();
  const visibles = texto
    ? opciones.clubes.filter((club) => club.nombre.toLowerCase().includes(texto))
    : opciones.clubes;

  const cerrar = () => {
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <div ref={caja} className="relative w-full">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-label="Cambiar de panel"
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-muted/60"
      >
        {children}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {abierto ? (
        <div className="absolute top-[calc(100%+0.75rem)] left-0 z-50 flex max-h-[70svh] w-full min-w-64 flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl lg:w-72">
          {opciones.panelSuperAdmin ? (
            <>
              <Opcion href={opciones.panelSuperAdmin.href} activo={opciones.panelSuperAdmin.activo} onElegir={cerrar}>
                <LogoElClub className="size-7" />
                <span className="min-w-0 flex-1 truncate">Panel del Super Admin</span>
              </Opcion>
              <div className="border-t border-border" />
            </>
          ) : null}
          <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Clubes
          </p>
          {opciones.conBuscador ? (
            <div className="px-2 pb-1">
              <label className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar club"
                  aria-label="Buscar club"
                  className="min-w-0 flex-1 bg-transparent outline-none"
                />
              </label>
            </div>
          ) : null}
          <div className="overflow-y-auto pb-1">
            {visibles.map((club) => (
              <Opcion key={club.slug} href={club.href} activo={club.activo} onElegir={cerrar}>
                <EscudoClub club={club} tamano="xs" />
                <span className="min-w-0 flex-1 truncate">{club.nombre}</span>
              </Opcion>
            ))}
            {visibles.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Ningún club se llama así.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Opcion({
  href,
  activo,
  onElegir,
  children,
}: {
  href: string;
  activo: boolean;
  onElegir: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onElegir}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "mx-1 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-muted",
        activo && "font-medium",
      )}
    >
      {children}
      {activo ? <Check className="size-4 shrink-0" /> : null}
    </Link>
  );
}
