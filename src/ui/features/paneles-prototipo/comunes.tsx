"use client";

/**
 * PROTOTIPO (#85): piezas que comparten las variantes del selector de panel.
 * Datos de ejemplo, nada se guarda. Se tira con los mocks.
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Map as IconoMapa, Menu, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/ui/nativos/sheet";
import { cn } from "@/lib/utils";

// ---------- datos de ejemplo ----------

export type Club = { slug: string; nombre: string; iniciales: string; color: string };

export const CLUBES: Club[] = [
  { slug: "atletico-san-isidro", nombre: "Atlético San Isidro", iniciales: "AS", color: "bg-sky-700" },
  { slug: "belgrano", nombre: "Belgrano Athletic", iniciales: "BA", color: "bg-red-700" },
  { slug: "champagnat", nombre: "Champagnat", iniciales: "CH", color: "bg-blue-900" },
  { slug: "cuba", nombre: "Club Universitario de Buenos Aires", iniciales: "CU", color: "bg-emerald-800" },
  { slug: "hindu", nombre: "Hindú Club", iniciales: "HC", color: "bg-neutral-800" },
  { slug: "la-plata", nombre: "La Plata Rugby Club", iniciales: "LP", color: "bg-indigo-700" },
  { slug: "los-cardos", nombre: "Los Cardos Rugby Club", iniciales: "LC", color: "bg-violet-700" },
  { slug: "los-tilos", nombre: "Los Tilos", iniciales: "LT", color: "bg-green-700" },
  { slug: "newman", nombre: "Newman", iniciales: "NW", color: "bg-amber-700" },
  { slug: "pucara", nombre: "Pucará", iniciales: "PU", color: "bg-rose-700" },
  { slug: "regatas", nombre: "Regatas Bella Vista", iniciales: "RB", color: "bg-cyan-700" },
  { slug: "san-luis", nombre: "San Luis", iniciales: "SL", color: "bg-orange-700" },
];

import type { Perfil } from "./datos";
export type { Perfil } from "./datos";

export type Panel = { tipo: "super" } | { tipo: "club"; club: Club };

export const esSuper = (perfil: Perfil) => perfil === "super-club" || perfil === "super-panel";

const LOS_CARDOS = CLUBES.find((c) => c.slug === "los-cardos")!;

/** Los clubes que puede elegir cada perfil. */
export function clubesDe(perfil: Perfil): Club[] {
  if (esSuper(perfil)) return CLUBES;
  if (perfil === "multi") return [LOS_CARDOS, CLUBES[1], CLUBES[9]];
  return [LOS_CARDOS];
}

export function panelInicial(perfil: Perfil): Panel {
  return perfil === "super-panel" ? { tipo: "super" } : { tipo: "club", club: LOS_CARDOS };
}

export const mismoPanel = (a: Panel, b: Panel) =>
  a.tipo === b.tipo && (a.tipo === "super" || (b.tipo === "club" && a.club.slug === b.club.slug));

export function itemsDe(panel: Panel): string[] {
  return panel.tipo === "super" ? ["Clubes", "Deportes"] : ["Inicio", "Club", "Sedes", "Deportes", "Admins"];
}

const activoInicial = (panel: Panel) => (panel.tipo === "super" ? "Clubes" : "Sedes");

/** Estado del mock: panel actual y página activa. Elegir un club lleva a su Inicio. La página remonta la variante al cambiar de perfil (key). */
export function useMock(perfil: Perfil) {
  const [panel, setPanel] = useState<Panel>(() => panelInicial(perfil));
  const [activo, setActivo] = useState(() => activoInicial(panelInicial(perfil)));
  const elegir = (p: Panel) => {
    setPanel(p);
    setActivo(p.tipo === "super" ? "Clubes" : "Inicio");
  };
  return { panel, activo, setActivo, elegir, clubes: clubesDe(perfil), super: esSuper(perfil) };
}

// ---------- piezas visuales ----------

export function Escudo({ club, chico }: { club: Club; chico?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-foreground/10",
        club.color,
        chico ? "size-7 text-[10px]" : "size-10 text-xs",
      )}
    >
      {club.iniciales}
    </span>
  );
}

export function LogoApp({ chico }: { chico?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- prototipo
    <img src="/marca/logo-icon.svg" alt="El Club App" className={cn("shrink-0 rounded-[22%]", chico ? "size-7" : "size-10")} />
  );
}

export function nombrePanel(panel: Panel) {
  return panel.tipo === "super" ? "Panel del Super Admin" : panel.club.nombre;
}

export function IconoPanel({ panel, chico }: { panel: Panel; chico?: boolean }) {
  return panel.tipo === "super" ? <LogoApp chico={chico} /> : <Escudo club={panel.club} chico={chico} />;
}

export function Nav({ panel, activo, onElegir }: { panel: Panel; activo: string; onElegir: (i: string) => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {itemsDe(panel).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onElegir(item)}
          className={cn(
            "rounded-lg px-3 py-2.5 text-left text-sm",
            item === activo ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {item}
        </button>
      ))}
    </nav>
  );
}

export function Salir() {
  return (
    <div className="border-t border-border p-3">
      <span className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
        <LogOut className="size-4" />
        Salir
      </span>
    </div>
  );
}

export function EtiquetaSoloSuperAdmin() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800">
      <ShieldCheck className="size-3" />
      Solo Super Admin
    </span>
  );
}

/** Cabecera de escritorio a 72px, como el shell real. */
export const CABECERA = "flex h-[72px] shrink-0 items-center border-b border-border";

/** El marco de la página: barra del celular, cabecera de escritorio y contenido. La barra lateral la pone cada variante. */
export function Pagina({
  barra,
  menuMovil,
  anchoMenuMovil = "w-64 sm:max-w-64",
  panel,
  activo,
  super: esSuperAdmin,
  onEntrar,
}: {
  barra: React.ReactNode;
  menuMovil: React.ReactNode;
  anchoMenuMovil?: string;
  panel: Panel;
  activo: string;
  super: boolean;
  onEntrar: (club: Club) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const titulo = panel.tipo === "club" && activo === "Sedes" ? "Sede Central" : activo;
  const subtitulo = panel.tipo === "club" ? panel.club.nombre : "Super Admin";

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Sheet open={abierto} onOpenChange={setAbierto}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="size-11 shrink-0" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" showCloseButton className={cn("gap-0 bg-background p-0", anchoMenuMovil)}>
              <SheetTitle className="sr-only">Menú</SheetTitle>
              {menuMovil}
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-medium tracking-tight">{titulo}</h1>
            <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="sticky top-0 hidden h-svh shrink-0 border-r border-border bg-background lg:flex">{barra}</aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className={cn(CABECERA, "sticky top-0 z-10 hidden bg-background/90 px-8 backdrop-blur lg:flex")}>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-medium tracking-tight">{titulo}</h1>
              <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
            </div>
          </header>
          <main className="flex flex-1 flex-col px-5 py-6 pb-28 md:px-8 md:py-8">
            <Contenido panel={panel} activo={activo} super={esSuperAdmin} onEntrar={onEntrar} />
          </main>
        </div>
      </div>
    </div>
  );
}

function Contenido({
  panel,
  activo,
  super: esSuperAdmin,
  onEntrar,
}: {
  panel: Panel;
  activo: string;
  super: boolean;
  onEntrar: (club: Club) => void;
}) {
  if (panel.tipo === "super" && activo === "Clubes") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex justify-end">
          <Button size="sm">
            <Plus className="size-4" /> Crear club
          </Button>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {CLUBES.map((club) => (
            <li key={club.slug} className="flex items-center gap-3 px-4 py-3">
              <Escudo club={club} chico />
              <span className="min-w-0 flex-1 truncate text-sm">{club.nombre}</span>
              <Button size="sm" variant="outline" onClick={() => onEntrar(club)}>
                Entrar
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (panel.tipo === "club" && activo === "Sedes") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium">Instalaciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cancha 1 · Cancha 2 · Pileta · Quincho</p>
        </section>
        {esSuperAdmin ? (
          <section className="rounded-xl border border-dashed border-amber-400 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium">Predio</h2>
              <EtiquetaSoloSuperAdmin />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Marcá el área sobre el mapa satelital y ubicá las instalaciones. El Admin del club ve solo el visor 3D.
            </p>
            <Button size="sm" className="mt-3">
              <IconoMapa className="size-4" /> Editar predio
            </Button>
          </section>
        ) : null}
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium">{esSuperAdmin ? "Visor 3D (lo que ve el Admin)" : "Predio"}</h2>
          <div className="mt-3 flex h-48 items-center justify-center rounded-lg bg-gradient-to-br from-green-200 to-green-400 text-sm text-green-900 dark:from-green-900 dark:to-green-700 dark:text-green-100">
            Visor 3D del predio
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="h-24 rounded-xl border border-dashed border-border" />
      <div className="h-24 rounded-xl border border-dashed border-border" />
      <p className="text-center text-xs text-muted-foreground">Contenido de «{activo}» (no cambia con este issue)</p>
    </div>
  );
}

// ---------- barra flotante del prototipo ----------

export function SelectorPrototipo({
  variantes,
  pantallas,
}: {
  variantes: { clave: string; nombre: string }[];
  pantallas: { clave: string; nombre: string }[];
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const variante = params.get("variant") ?? variantes[0].clave;
  const pantalla = params.get("pantalla") ?? pantallas[0].clave;
  const i = Math.max(0, variantes.findIndex((v) => v.clave === variante));

  const ir = (v: string, p: string) => router.replace(`${ruta}?variant=${v}&pantalla=${p}`, { scroll: false });
  const mover = (delta: number) => ir(variantes[(i + delta + variantes.length) % variantes.length].clave, pantalla);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-2xl bg-fuchsia-700 p-1.5 text-sm text-white shadow-2xl ring-2 ring-white">
      <div className="flex items-center">
        <button type="button" onClick={() => mover(-1)} className="rounded-full p-1.5 hover:bg-white/20" aria-label="Variante anterior">
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-1 font-medium whitespace-nowrap">
          {variantes[i].clave} · {variantes[i].nombre}
        </span>
        <button type="button" onClick={() => mover(1)} className="rounded-full p-1.5 hover:bg-white/20" aria-label="Variante siguiente">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-0.5 rounded-2xl bg-white/10 p-0.5">
        {pantallas.map((p) => (
          <button
            key={p.clave}
            type="button"
            onClick={() => ir(variante, p.clave)}
            className={cn("rounded-full px-2.5 py-1 text-xs whitespace-nowrap", p.clave === pantalla ? "bg-white text-fuchsia-800" : "hover:bg-white/20")}
          >
            {p.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
