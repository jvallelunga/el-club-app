"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/ui/nativos/button";

export function esSalidaReal(href: string): boolean {
  return href === "/auth/salir" || href.startsWith("/auth/salir?");
}

/**
 * En la app real, Salir es un POST para que el prefetch de Next no
 * dispare GET /auth/salir y cierre la sesión. En los mocks sigue siendo un Link.
 */
export function BotonSalir({
  href,
  className,
  variant = "ghost",
  children,
}: {
  href: string;
  className?: string;
  variant?: "ghost" | "outline" | "default";
  children: ReactNode;
}) {
  if (esSalidaReal(href)) {
    return (
      <form action={href} method="post">
        <Button type="submit" variant={variant} className={className}>
          {children}
        </Button>
      </form>
    );
  }
  return (
    <Button asChild variant={variant} className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

/** Versión de texto/ícono, para el pie del sidebar. */
export function EnlaceSalir({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (esSalidaReal(href)) {
    return (
      <form action={href} method="post">
        <button type="submit" className={className}>
          {children}
        </button>
      </form>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
