import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/ui/nativos/badge";
import { Button } from "@/ui/nativos/button";
import { cn } from "@/lib/utils";
import { RUTAS_MOCK } from "./datos-ejemplo";

export function MarcoPagina({
  children,
  cabecera,
  className,
  ancho = "ancho",
}: {
  children: React.ReactNode;
  cabecera?: React.ReactNode;
  className?: string;
  ancho?: "ancho" | "completo";
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {cabecera}
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col",
          ancho === "ancho" && "max-w-5xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function MarcoAcceso({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="flex flex-1 flex-col lg:flex-row">
        {panel ? (
          <div className="hidden lg:flex lg:w-[44%] lg:flex-col lg:justify-center lg:bg-muted/60 lg:px-16 lg:py-16">
            {panel}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col">
          <div
            className={cn(
              "mx-auto flex w-full max-w-md flex-1 flex-col",
              "md:max-w-lg md:justify-center md:px-6 md:py-12",
              "lg:py-16",
            )}
          >
            <div
              className={cn(
                "flex flex-1 flex-col",
                "md:flex-none md:rounded-2xl md:border md:border-border md:bg-card md:px-8 md:py-10 md:shadow-sm",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
      <PieMock />
    </div>
  );
}

export function TarjetaFormulario({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col gap-6",
        "md:rounded-2xl md:border md:border-border md:bg-card md:p-8",
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
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-3 py-2 backdrop-blur md:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
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
    <main className={cn("flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8", className)}>
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
