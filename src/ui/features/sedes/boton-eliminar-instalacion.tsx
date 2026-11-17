"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/ui/nativos/button";

export function BotonEliminarInstalacion({
  nombre,
  eliminar,
}: {
  nombre: string;
  eliminar: () => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        className="h-10 text-destructive"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            `¿Eliminar «${nombre}»? Esta acción no se puede deshacer.`,
          );
          if (!ok) return;
          startTransition(async () => {
            const resultado = await eliminar();
            if (!resultado.ok) {
              setError(resultado.error);
              return;
            }
            setError(null);
            router.refresh();
          });
        }}
      >
        <Trash2 className="size-4" />
        {pending ? "Eliminando…" : "Eliminar"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
