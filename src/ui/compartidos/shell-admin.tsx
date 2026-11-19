import Link from "next/link";
import { ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { cn } from "@/lib/utils";
import { EscudoClub, type ClubConEscudo } from "./escudo-club";
import { BotonSalir, EnlaceSalir } from "./boton-salir";
import { LogoElClub } from "@/ui/marca/logo-el-club";
import { MenuMovil } from "./menu-movil";

export type RolShell = "super-admin" | "admin";
export type ActivoShell =
  | "clubes"
  | "deportes"
  | "inicio"
  | "club"
  | "sedes"
  | "admins";

export type RutasShell = {
  inicioClub: (slug: string) => string;
  superAdmin: string;
  deportes: string;
  elegirClub: string;
  club: (slug: string) => string;
  sedes: (slug: string) => string;
  admins: (slug: string) => string;
};

export const RUTAS_SHELL_APP: RutasShell = {
  inicioClub: (slug) => `/c/${slug}/admin`,
  superAdmin: "/super-admin",
  deportes: "/super-admin/deportes",
  elegirClub: "/elegir-club",
  club: (slug) => `/c/${slug}/admin/club`,
  sedes: (slug) => `/c/${slug}/admin/sedes`,
  admins: (slug) => `/c/${slug}/admin/admins`,
};

/** Cabeceras de escritorio (sidebar y barra superior): misma altura fija para que el borde inferior quede alineado. */
const CABECERA_ESCRITORIO =
  "flex h-[72px] shrink-0 items-center border-b border-border";

export type ItemNav = {
  etiqueta: string;
  href: string;
  activo: boolean;
};

export function itemsNav({
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
    items.push({
      etiqueta: "Deportes",
      href: rutas.deportes,
      activo: activo === "deportes",
    });
  } else if (esMultiClub) {
    items.push({
      etiqueta: "Clubes",
      href: rutas.elegirClub,
      activo: false,
    });
  }

  if (club) {
    const queryClub = como ? `?como=${como}` : "";
    items.push({
      etiqueta: "Club",
      href: `${rutas.club(club.slug)}${queryClub}`,
      activo: activo === "club",
    });
    items.push({
      etiqueta: "Sedes",
      href: `${rutas.sedes(club.slug)}${queryClub}`,
      activo: activo === "sedes",
    });
    items.push({
      etiqueta: "Admins",
      href: `${rutas.admins(club.slug)}${queryClub}`,
      activo: activo === "admins",
    });
  }

  return items;
}

function CabeceraBarra({
  club,
  rol,
}: {
  club?: ClubConEscudo & { slug: string };
  rol: RolShell;
}) {
  if (club) {
    return (
      <>
        <EscudoClub club={club} tamano="sm" />
        <div className="min-w-0">
          <p className="text-sm leading-snug font-medium">{club.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {rol === "super-admin" ? "Super Admin" : "Admin"}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoElClub />
      <div className="min-w-0">
        <p className="text-sm font-medium">El Club App</p>
        <p className="text-xs text-muted-foreground">
          {rol === "super-admin" ? "Super Admin" : "Admin"}
        </p>
      </div>
    </div>
  );
}

function NavegacionBarra({
  items,
}: {
  items: ItemNav[];
}) {
  return (
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
  );
}

function ContenidoBarra({
  club,
  rol,
  items,
}: {
  club?: ClubConEscudo & { slug: string };
  rol: RolShell;
  items: ItemNav[];
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn(CABECERA_ESCRITORIO, "gap-3 px-4")}>
        <CabeceraBarra club={club} rol={rol} />
      </div>
      <NavegacionBarra items={items} />
      <div className="border-t border-border p-3">
        <EnlaceSalir
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Salir
        </EnlaceSalir>
      </div>
    </div>
  );
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
  salirEnMobile = true,
  rutas = RUTAS_SHELL_APP,
  pie,
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
  salirEnMobile?: boolean;
  rutas?: RutasShell;
  pie?: React.ReactNode;
}) {
  const items = itemsNav({ club, rol, activo, como, esMultiClub, rutas });
  const tituloMenu = club?.nombre ?? "El Club App";
  const descripcionMenu =
    rol === "super-admin" ? "Super Admin" : "Admin";
  const propsBarra = { club, rol, items };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <MenuMovil titulo={tituloMenu} descripcion={descripcionMenu}>
            <ContenidoBarra {...propsBarra} />
          </MenuMovil>
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
            <BotonSalir className="h-11 px-3 text-sm">
              Salir
            </BotonSalir>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
          <ContenidoBarra {...propsBarra} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className={cn(CABECERA_ESCRITORIO, "sticky top-0 z-10 hidden bg-background/90 px-8 backdrop-blur lg:flex")}>
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
