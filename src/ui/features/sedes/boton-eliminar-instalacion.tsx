"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ResultadoSimple } from "@/dominio/resultado";
import { DialogoConfirmar } from "@/ui/compartidos/dialogo-confirmar";
import { Button } from "@/ui/nativos/button";

export function BotonEliminarInstalacion({
  nombre,
  eliminar,
}: {
  nombre: string;
  eliminar: () => Promise<ResultadoSimple>;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const resultado = await eliminar();
      // Cerrar siempre: el error se muestra junto al botón, fuera del diálogo.
      setAbierto(false);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        className="h-10 text-destructive"
        disabled={pending}
        onClick={() => setAbierto(true)}
      >
        <Trash2 className="size-4" />
        {pending ? "Eliminando…" : "Eliminar"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <DialogoConfirmar
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={`¿Eliminar «${nombre}»?`}
        accion="Eliminar"
        accionPendiente="Eliminando…"
        pendiente={pending}
        onConfirmar={confirmar}
      />
    </div>
  );
}
