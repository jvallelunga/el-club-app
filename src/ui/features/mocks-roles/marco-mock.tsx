import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/ui/nativos/badge";
import { Button } from "@/ui/nativos/button";
import { cn } from "@/lib/utils";
import { RUTAS_MOCK } from "./datos-ejemplo";

export function MarcoMock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-svh w-full max-w-md flex-col bg-background md:border-x md:border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CabeceraMock({
  atras,
  titulo,
  subtitulo,
  accion,
}: {
  atras?: { href: string; etiqueta?: string };
  titulo: string;
  subtitulo?: string;
  accion?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-2">
        {atras ? (
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            className="size-11 shrink-0"
          >
            <Link href={atras.href} aria-label={atras.etiqueta ?? "Volver"}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-medium tracking-tight">
            {titulo}
          </h1>
          {subtitulo ? (
            <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
          ) : null}
        </div>
        {accion}
      </div>
    </header>
  );
}

export function ContenidoMock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex flex-1 flex-col px-5 py-6", className)}>
      {children}
    </main>
  );
}

export function PieMock({ extra }: { extra?: React.ReactNode }) {
  return (
    <footer className="mt-auto px-5 pb-6 pt-4 text-center">
      {extra}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Mock de aprobación · datos de ejemplo ·{" "}
        <Link href={RUTAS_MOCK.indice} className="underline-offset-2 hover:underline">
          ver pantallas
        </Link>
      </p>
    </footer>
  );
}

export function EtiquetaEjemplo({ className }: { className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-5 px-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      ejemplo
    </Badge>
  );
}

export function BotonPrincipal({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("h-12 w-full rounded-xl text-base", className)}
      {...props}
    />
  );
}
