import type { PaletaDerivada } from "@/dominio/paleta";
import { cn } from "@/lib/utils";
import { variablesCssTema } from "./tema";

/** Aplica las variables de paleta (producto o de un club) a un árbol de UI. */
export function ProveedorPaleta({
  paleta,
  className,
  children,
}: {
  paleta: PaletaDerivada;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={variablesCssTema(paleta)}
      className={cn("min-h-svh bg-background text-foreground", className)}
    >
      {children}
    </div>
  );
}
