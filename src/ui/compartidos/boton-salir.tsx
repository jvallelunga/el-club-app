import type { ReactNode } from "react";
import { Button } from "@/ui/nativos/button";

export const RUTA_SALIR = "/auth/salir";

/**
 * Salir es siempre un POST, para que el prefetch de Next no dispare
 * GET /auth/salir y cierre la sesión.
 */
export function BotonSalir({
  className,
  variant = "ghost",
  children,
}: {
  className?: string;
  variant?: "ghost" | "outline" | "default";
  children: ReactNode;
}) {
  return (
    <form action={RUTA_SALIR} method="post">
      <Button type="submit" variant={variant} className={className}>
        {children}
      </Button>
    </form>
  );
}

/** Versión de texto/ícono, para el pie del sidebar. */
export function EnlaceSalir({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <form action={RUTA_SALIR} method="post">
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
