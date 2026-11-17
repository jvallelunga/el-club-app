"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/ui/nativos/sheet";

export function MenuMovil({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-11 shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton
        className="w-64 gap-0 bg-background p-0 sm:max-w-64"
        onClick={(evento) => {
          const destino = evento.target;
          if (
            destino instanceof Element &&
            destino.closest("a, button[type='submit']")
          ) {
            setAbierto(false);
          }
        }}
      >
        <SheetTitle className="sr-only">{titulo}</SheetTitle>
        {descripcion ? (
          <SheetDescription className="sr-only">{descripcion}</SheetDescription>
        ) : null}
        {children}
      </SheetContent>
    </Sheet>
  );
}
