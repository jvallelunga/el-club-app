"use client";

/**
 * Bloque «Predio» de la pantalla de la sede para el Super Admin (#42).
 * «Editar predio» abre el editor a pantalla completa. Si hay cambios sin
 * guardar, avisa antes de salir: al tocar «Cerrar», al volver atrás con el
 * navegador y al recargar o cerrar la pestaña.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Expand } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/nativos/dialog";
import type { Coordenadas } from "@/dominio/maps";
import type { DatosPredio, DesdeOrigen } from "@/dominio/predio";
import type { ResultadoGuardarPredio } from "./editor-predio";

const EditorPredio = dynamic(() => import("./editor-predio").then((m) => m.EditorPredio), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 animate-pulse bg-neutral-900" />,
});

/** Parámetro de la URL mientras el editor está abierto (para volver atrás). */
const PARAMETRO = "predio";

function urlSinParametro(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAMETRO);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function SeccionPredio({
  sedeNombre,
  guardado,
  origenInicial,
  guardar,
}: {
  sedeNombre: string;
  guardado: DatosPredio | null;
  origenInicial: { coordenadas: Coordenadas; desde: DesdeOrigen };
  guardar: (datos: DatosPredio) => Promise<ResultadoGuardarPredio>;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [preguntando, setPreguntando] = useState(false);
  const hayCambios = useRef(false);
  /** Si el editor sumó una entrada al historial al abrirse. */
  const agregoHistorial = useRef(false);
  /** Para ignorar el «atrás» que hace el propio editor al cerrarse. */
  const cerrandoSolo = useRef(false);

  const onCambios = useCallback((hay: boolean) => {
    hayCambios.current = hay;
  }, []);

  function abrir() {
    hayCambios.current = false;
    const url = new URL(window.location.href);
    url.searchParams.set(PARAMETRO, "editar");
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    agregoHistorial.current = true;
    setAbierto(true);
  }

  const cerrar = useCallback(() => {
    setPreguntando(false);
    setAbierto(false);
    hayCambios.current = false;
    if (agregoHistorial.current) {
      agregoHistorial.current = false;
      cerrandoSolo.current = true;
      window.history.back();
    } else {
      window.history.replaceState(null, "", urlSinParametro());
    }
    // Trae lo guardado al resto de la pantalla de la sede.
    router.refresh();
  }, [router]);

  function pedirCerrar() {
    if (hayCambios.current) setPreguntando(true);
    else cerrar();
  }

  // Si se entra con ?predio=editar (por ejemplo, al recargar), abre el editor.
  useEffect(() => {
    if (new URL(window.location.href).searchParams.get(PARAMETRO) === "editar") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lee la URL una sola vez al montar
      setAbierto(true);
    }
  }, []);

  useEffect(() => {
    if (!abierto) return;

    // Recargar o cerrar la pestaña: el navegador muestra su propio aviso.
    const antesDeSalir = (evento: BeforeUnloadEvent) => {
      if (!hayCambios.current) return;
      evento.preventDefault();
      evento.returnValue = "";
    };

    // «Atrás» del navegador con el editor abierto.
    const alVolver = () => {
      if (cerrandoSolo.current) {
        cerrandoSolo.current = false;
        return;
      }
      agregoHistorial.current = false;
      if (!hayCambios.current) {
        cerrar();
        return;
      }
      // Se vuelve a poner la entrada del editor y se pregunta.
      const url = new URL(window.location.href);
      url.searchParams.set(PARAMETRO, "editar");
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      agregoHistorial.current = true;
      setPreguntando(true);
    };

    window.addEventListener("beforeunload", antesDeSalir);
    window.addEventListener("popstate", alVolver);
    return () => {
      window.removeEventListener("beforeunload", antesDeSalir);
      window.removeEventListener("popstate", alVolver);
    };
  }, [abierto, cerrar]);

  const tieneArea = (guardado?.area.length ?? 0) > 0;

  return (
    <section className="hidden flex-col gap-4 border-t border-border pt-8 lg:flex">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Predio</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {tieneArea
              ? "El área del predio ya está dibujada. Podés seguir editándola cuando quieras."
              : "Dibujá el área del predio sobre el mapa satelital. Lo que guardes queda y se puede seguir editando."}
          </p>
        </div>
        <Button className="h-11 shrink-0 rounded-xl px-4" onClick={abrir}>
          <Expand className="size-4" />
          Editar predio
        </Button>
      </div>

      {abierto
        ? createPortal(
            // En el celular el editor no se muestra (#26: edición solo desde una computadora).
            <div className="hidden lg:block">
              <EditorPredio
                sedeNombre={sedeNombre}
                guardado={guardado}
                origenInicial={origenInicial}
                guardar={guardar}
                onCambios={onCambios}
                onCerrar={pedirCerrar}
              />
            </div>,
            document.body,
          )
        : null}

      <Dialog open={preguntando} onOpenChange={setPreguntando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir sin guardar?</DialogTitle>
            <DialogDescription>
              Hay cambios en el predio que todavía no guardaste. Si salís, se pierden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreguntando(false)}>
              Seguir editando
            </Button>
            <Button variant="destructive" onClick={cerrar}>
              Salir sin guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
