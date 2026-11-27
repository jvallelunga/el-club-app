import Link from "next/link";
import { ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { cn } from "@/lib/utils";
import { EscudoClub, type ClubConEscudo } from "./escudo-club";
import { BotonSalir, EnlaceSalir } from "./boton-salir";
import { LogoElClub } from "@/ui/marca/logo-el-club";
import type { ClubDelSelector, PanelesSesion } from "@/dominio/permisos";
import { MenuMovil } from "./menu-movil";
import { SelectorPanel } from "./selector-panel";

export type ActivoShell =
  | "clubes"
  | "deportes"
  | "inicio"
  | "club"
  | "sedes"
  | "deportes-club"
  | "admins";

export type RutasShell = {
  inicioClub: (slug: string) => string;
  superAdmin: string;
  deportes: string;
  club: (slug: string) => string;
  sedes: (slug: string) => string;
  deportesClub: (slug: string) => string;
  admins: (slug: string) => string;
};

export const RUTAS_SHELL_APP: RutasShell = {
  inicioClub: (slug) => `/c/${slug}/admin`,
  superAdmin: "/super-admin",
  deportes: "/super-admin/deportes",
  club: (slug) => `/c/${slug}/admin/club`,
  sedes: (slug) => `/c/${slug}/admin/sedes`,
  deportesClub: (slug) => `/c/${slug}/admin/deportes`,
  admins: (slug) => `/c/${slug}/admin/admins`,
};

/** El nombre del Panel del Super Admin, como lo muestran la cabecera y el selector. */
export const NOMBRE_PANEL_SUPER_ADMIN = "Panel del Super Admin";

/** Cabeceras de escritorio (sidebar y barra superior): misma altura fija para que el borde inferior quede alineado. */
const CABECERA_ESCRITORIO =
  "flex h-[72px] shrink-0 items-center border-b border-border";

export type ItemNav = {
  etiqueta: string;
  href: string;
  activo: boolean;
};

/**
 * El menú del panel en el que se está: con club, el Panel del club (igual
 * para su Admin y para el Super Admin); sin club, el Panel del Super Admin.
 */
export function itemsNav({
  club,
  activo,
  rutas,
}: {
  club?: { slug: string };
  activo?: ActivoShell;
  rutas: RutasShell;
}): ItemNav[] {
  const item = (etiqueta: string, href: string, clave: ActivoShell): ItemNav => ({
    etiqueta,
    href,
    activo: activo === clave,
  });

  if (!club) {
    return [
      item("Clubes", rutas.superAdmin, "clubes"),
      item("Deportes", rutas.deportes, "deportes"),
    ];
  }

  return [
    item("Inicio", rutas.inicioClub(club.slug), "inicio"),
    item("Club", rutas.club(club.slug), "club"),
    item("Sedes", rutas.sedes(club.slug), "sedes"),
    item("Deportes", rutas.deportesClub(club.slug), "deportes-club"),
    item("Admins", rutas.admins(club.slug), "admins"),
  ];
}

export type OpcionesSelector = {
  panelSuperAdmin: { href: string; activo: boolean } | null;
  clubes: (ClubDelSelector & { href: string; activo: boolean })[];
  conBuscador: boolean;
};

/** A partir de cuántos clubes el selector de panel suma el buscador. */
const CLUBES_PARA_BUSCADOR = 8;

/**
 * Qué lista el selector de panel. Devuelve null si hay un solo panel (el
 * Admin de un solo club): entonces la cabecera solo lo muestra.
 */
export function opcionesSelector({
  paneles,
  clubActual,
  rutas,
}: {
  paneles: PanelesSesion;
  clubActual?: string;
  rutas: RutasShell;
}): OpcionesSelector | null {
  if (!paneles.esSuperAdmin && paneles.clubes.length <= 1) return null;
  return {
    panelSuperAdmin: paneles.esSuperAdmin
      ? { href: rutas.superAdmin, activo: !clubActual }
      : null,
    clubes: paneles.clubes.map((club) => ({
      ...club,
      href: rutas.inicioClub(club.slug),
      activo: club.slug === clubActual,
    })),
    conBuscador: paneles.clubes.length >= CLUBES_PARA_BUSCADOR,
  };
}

function CabeceraBarra({
  club,
  paneles,
  rutas,
}: {
  club?: ClubConEscudo & { slug: string };
  paneles: PanelesSesion;
  rutas: RutasShell;
}) {
  const actual = (
    <>
      {club ? <EscudoClub club={club} tamano="sm" /> : <LogoElClub className="size-10" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-snug font-medium">
          {club ? club.nombre : NOMBRE_PANEL_SUPER_ADMIN}
        </p>
        <p className="text-xs text-muted-foreground">{textoRol(paneles)}</p>
      </div>
    </>
  );
  const opciones = opcionesSelector({ paneles, clubActual: club?.slug, rutas });

  if (!opciones) {
    return <div className="flex min-w-0 flex-1 items-center gap-3 px-2">{actual}</div>;
  }
  return <SelectorPanel opciones={opciones}>{actual}</SelectorPanel>;
}

function textoRol(paneles: PanelesSesion): string {
  return paneles.esSuperAdmin ? "Super Admin" : "Admin";
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
  paneles,
  rutas,
  items,
  enMovil = false,
}: {
  club?: ClubConEscudo & { slug: string };
  paneles: PanelesSesion;
  rutas: RutasShell;
  items: ItemNav[];
  /** En el menú del celular deja lugar a la ✕ del costado. */
  enMovil?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn(CABECERA_ESCRITORIO, "px-2", enMovil && "pr-12")}>
        <CabeceraBarra club={club} paneles={paneles} rutas={rutas} />
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
  paneles,
  activo,
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
  /** A qué paneles puede ir quien está en sesión (ver `panelesDeLaSesion`). */
  paneles: PanelesSesion;
  activo?: ActivoShell;
  accion?: React.ReactNode;
  salirEnMobile?: boolean;
  rutas?: RutasShell;
  pie?: React.ReactNode;
}) {
  const items = itemsNav({ club, activo, rutas });
  const tituloMenu = club?.nombre ?? NOMBRE_PANEL_SUPER_ADMIN;
  const descripcionMenu = textoRol(paneles);
  const propsBarra = { club, paneles, rutas, items };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <MenuMovil titulo={tituloMenu} descripcion={descripcionMenu}>
            <ContenidoBarra {...propsBarra} enMovil />
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
