"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/nativos/dialog";

export function BotonEliminarInstalacion({
  nombre,
  eliminar,
}: {
  nombre: string;
  eliminar: () => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    if (pending) return;
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

      <Dialog
        open={abierto}
        onOpenChange={(valor) => {
          if (!pending) setAbierto(valor);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar «{nombre}»?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmar}
              disabled={pending}
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
