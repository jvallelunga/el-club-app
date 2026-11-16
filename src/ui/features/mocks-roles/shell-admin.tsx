import Link from "next/link";
import { ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { cn } from "@/lib/utils";
import { RUTAS_MOCK } from "./datos-ejemplo";
import { EscudoClub, type ClubConEscudo } from "./escudo-club";
import { PieMock } from "./marco-mock";

export type RolShell = "super-admin" | "admin";
export type ActivoShell = "clubes" | "inicio" | "admins";

export type RutasShell = {
  inicioClub: (slug: string) => string;
  superAdmin: string;
  elegirClub: string;
  admins: (slug: string) => string;
};

const RUTAS_SHELL_MOCK: RutasShell = {
  inicioClub: RUTAS_MOCK.inicioClub,
  superAdmin: RUTAS_MOCK.superAdmin,
  elegirClub: RUTAS_MOCK.elegirClub,
  admins: RUTAS_MOCK.admins,
};

export const RUTAS_SHELL_APP: RutasShell = {
  inicioClub: (slug) => `/c/${slug}/admin`,
  superAdmin: "/super-admin",
  elegirClub: "/elegir-club",
  admins: (slug) => `/super-admin/clubes/${slug}/admins`,
};

type ItemNav = {
  etiqueta: string;
  href: string;
  activo: boolean;
};

function itemsNav({
  club,
  rol,
  activo,
  como,
  esMultiClub,
  rutas,
}: {
  club?: ClubConEscudo & { slug: string };
  rol: RolShell;
  activo?: ActivoShell;
  como?: string;
  esMultiClub?: boolean;
  rutas: RutasShell;
}): ItemNav[] {
  const items: ItemNav[] = [];

  if (club) {
    const query = como ? `?como=${como}` : "";
    items.push({
      etiqueta: "Inicio",
      href: `${rutas.inicioClub(club.slug)}${query}`,
      activo: activo === "inicio",
    });
  }

  if (rol === "super-admin") {
    items.push({
      etiqueta: "Clubes",
      href: rutas.superAdmin,
      activo: activo === "clubes",
    });
  } else if (esMultiClub) {
    items.push({
      etiqueta: "Clubes",
      href: rutas.elegirClub,
      activo: false,
    });
  }

  if (club && rol === "super-admin") {
    items.push({
      etiqueta: "Admins",
      href: rutas.admins(club.slug),
      activo: activo === "admins",
    });
  }

  return items;
}

export function ShellAdmin({
  children,
  titulo,
  tituloMobile,
  subtitulo,
  subtituloMobile,
  atras,
  club,
  rol,
  activo,
  como,
  esMultiClub,
  accion,
  salirHref = RUTAS_MOCK.ingreso,
  salirEnMobile = true,
  rutas = RUTAS_SHELL_MOCK,
  pie = <PieMock />,
}: {
  children: React.ReactNode;
  titulo: string;
  tituloMobile?: string;
  subtitulo?: string;
  subtituloMobile?: string;
  atras?: { href: string; etiqueta?: string };
  club?: ClubConEscudo & { slug: string };
  rol: RolShell;
  activo?: ActivoShell;
  como?: string;
  esMultiClub?: boolean;
  accion?: React.ReactNode;
  salirHref?: string;
  salirEnMobile?: boolean;
  rutas?: RutasShell;
  pie?: React.ReactNode;
}) {
  const items = itemsNav({ club, rol, activo, como, esMultiClub, rutas });

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
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
              {tituloMobile ?? titulo}
            </h1>
            {(subtituloMobile ?? subtitulo) ? (
              <p className="truncate text-xs text-muted-foreground">
                {subtituloMobile ?? subtitulo}
              </p>
            ) : null}
          </div>
          {accion ? <div className="hidden md:block">{accion}</div> : null}
          {salirEnMobile ? (
            <Button asChild variant="ghost" className="h-11 px-3 text-sm">
              <Link href={salirHref}>Salir</Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="hidden h-11 px-3 text-sm md:inline-flex lg:hidden"
            >
              <Link href={salirHref}>Salir</Link>
            </Button>
          )}
        </div>
        {items.length > 0 ? (
          <nav className="hidden gap-1 border-t border-border px-3 py-1.5 md:flex lg:hidden">
            {items.map((item) => (
              <Link
                key={`${item.etiqueta}-${item.href}`}
                href={item.href}
                aria-current={item.activo ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  item.activo
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.etiqueta}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
          <div className="flex items-center gap-3 border-b border-border px-4 py-4">
            {club ? (
              <>
                <EscudoClub club={club} tamano="sm" />
                <div className="min-w-0">
                  <p className="text-sm leading-snug font-medium">{club.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {rol === "super-admin" ? "Super Admin" : "Admin"}
                  </p>
                </div>
              </>
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-medium">El Club App</p>
                <p className="text-xs text-muted-foreground">
                  {rol === "super-admin" ? "Super Admin" : "Admin"}
                </p>
              </div>
            )}
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {items.map((item) => (
              <Link
                key={`${item.etiqueta}-${item.href}`}
                href={item.href}
                aria-current={item.activo ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm",
                  item.activo
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.etiqueta}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-3">
            <Link
              href={salirHref}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <LogOut className="size-4" />
              Salir
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 hidden border-b border-border bg-background/90 px-8 py-3 backdrop-blur lg:flex">
            <div className="flex w-full items-center gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-medium tracking-tight">
                  {titulo}
                </h1>
                {subtitulo ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {subtitulo}
                  </p>
                ) : null}
              </div>
              {accion}
            </div>
          </header>
          <main className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
            {children}
          </main>
          {pie}
        </div>
      </div>
    </div>
  );
}
