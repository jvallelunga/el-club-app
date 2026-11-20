"use client";

/**
 * PROTOTIPO (#85) · Variante B: una columna angosta de escudos a la izquierda
 * (el logo de El Club App arriba para el Super Admin) y al lado el menú del
 * panel elegido. Todos los paneles quedan siempre a la vista.
 */

import { cn } from "@/lib/utils";
import { CABECERA, Escudo, LogoApp, Nav, Pagina, Salir, mismoPanel, nombrePanel, useMock, type Panel, type Perfil } from "./comunes";

export function VarianteB({ perfil }: { perfil: Perfil }) {
  const m = useMock(perfil);
  const conColumna = m.super || m.clubes.length > 1;

  const barra = (
    <div className="flex h-full">
      {conColumna ? (
        <div className="flex h-full w-[68px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border bg-muted/40 py-3">
          {m.super ? (
            <>
              <Boton activo={m.panel.tipo === "super"} titulo="Panel del Super Admin" onClick={() => m.elegir({ tipo: "super" })}>
                <LogoApp />
              </Boton>
              <div className="my-1 h-px w-8 shrink-0 bg-border" />
            </>
          ) : null}
          {m.clubes.map((club) => (
            <Boton key={club.slug} activo={mismoPanel(m.panel, { tipo: "club", club })} titulo={club.nombre} onClick={() => m.elegir({ tipo: "club", club } as Panel)}>
              <Escudo club={club} />
            </Boton>
          ))}
        </div>
      ) : null}
      <div className="flex h-full w-56 flex-col">
        <div className={cn(CABECERA, "gap-3 px-4")}>
          {conColumna ? null : m.panel.tipo === "club" ? <Escudo club={m.panel.club} /> : null}
          <div className="min-w-0">
            <p className="text-sm leading-snug font-medium">{nombrePanel(m.panel)}</p>
            <p className="text-xs text-muted-foreground">{m.super ? "Super Admin" : "Admin"}</p>
          </div>
        </div>
        <Nav panel={m.panel} activo={m.activo} onElegir={m.setActivo} />
        <Salir />
      </div>
    </div>
  );

  return (
    <Pagina
      barra={barra}
      menuMovil={barra}
      anchoMenuMovil={conColumna ? "w-[18.25rem] sm:max-w-[18.25rem]" : "w-56 sm:max-w-56"}
      panel={m.panel}
      activo={m.activo}
      super={m.super}
      onEntrar={(club) => m.elegir({ tipo: "club", club })}
    />
  );
}

function Boton({ activo, titulo, onClick, children }: { activo: boolean; titulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="relative flex w-full shrink-0 justify-center">
      <span className={cn("absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full bg-foreground transition-all", activo ? "h-8" : "h-0")} />
      <button
        type="button"
        title={titulo}
        aria-label={titulo}
        aria-current={activo ? "page" : undefined}
        onClick={onClick}
        className={cn("rounded-full transition", activo ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100")}
      >
        {children}
      </button>
    </div>
  );
}
