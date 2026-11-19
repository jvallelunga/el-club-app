"use client";

import { Button } from "@/ui/nativos/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/nativos/dialog";

/**
 * Confirmación antes de borrar. Es regla de toda la app: siempre que se borra
 * algo, se pide confirmación con este diálogo.
 *
 * Quien lo usa maneja el estado: lo abre, corre la acción en `onConfirmar` y
 * lo cierra cuando termina. Mientras `pendiente`, no se puede cerrar ni
 * confirmar dos veces.
 */
export function DialogoConfirmar({
  abierto,
  onCerrar,
  titulo,
  children,
  accion,
  accionPendiente,
  pendiente = false,
  error,
  onConfirmar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  /** Qué pasa si se confirma. Sin `children`, avisa que no se puede deshacer. */
  children?: React.ReactNode;
  /** El texto del botón, por ejemplo «Borrar deporte». */
  accion: string;
  /** El texto del botón mientras corre, por ejemplo «Borrando…». */
  accionPendiente: string;
  pendiente?: boolean;
  /** Un error de la acción, que se muestra sin cerrar el diálogo. */
  error?: string | null;
  onConfirmar: () => void;
}) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={(valor) => {
        if (!valor && !pendiente) onCerrar();
      }}
    >
      <DialogContent showCloseButton={!pendiente}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-col gap-2">
              {children ?? <p>Esta acción no se puede deshacer.</p>}
            </div>
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCerrar}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!pendiente) onConfirmar();
            }}
            disabled={pendiente}
          >
            {pendiente ? accionPendiente : accion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
