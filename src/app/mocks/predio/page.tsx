/**
 * PROTOTIPO (#26): mocks del bloque «Predio» en la pantalla de la sede.
 * Cinco variantes con ?variant=: A, B y C son el editor (Super Admin);
 * D y E, el visor (Admin). Datos de ejemplo, nada se guarda.
 * Se tira cuando se aprueben los mocks.
 */

import { ShellAdmin } from "@/ui/compartidos/shell-admin";
import { SelectorVariantes } from "@/ui/features/predio-prototipo/selector-variantes";
import {
  EditorA,
  EditorB,
  EditorC,
  VisorD,
  VisorE,
} from "@/ui/features/predio-prototipo/variantes";

const VARIANTES = [
  { clave: "A", nombre: "Editor · como el frame", rol: "super-admin" as const, C: EditorA },
  { clave: "B", nombre: "Editor · pantalla completa", rol: "super-admin" as const, C: EditorB },
  { clave: "C", nombre: "Editor · 2D y 3D lado a lado", rol: "super-admin" as const, C: EditorC },
  { clave: "D", nombre: "Visor · leyenda abajo", rol: "admin" as const, C: VisorD },
  { clave: "E", nombre: "Visor · leyenda al costado", rol: "admin" as const, C: VisorE },
];

const INSTALACIONES = [
  { nombre: "Cancha 1", tipo: "Cancha de rugby" },
  { nombre: "Cancha 2", tipo: "Cancha de rugby" },
  { nombre: "Cancha de hockey", tipo: "Cancha de hockey" },
  { nombre: "Cancha de tenis", tipo: "Cancha de tenis" },
  { nombre: "Pileta", tipo: "Pileta" },
  { nombre: "House", tipo: "House" },
  { nombre: "Vestuarios", tipo: "Vestuario" },
  { nombre: "Quincho", tipo: "Quincho" },
];

export default async function MockPredio({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  const v = VARIANTES.find((x) => x.clave === variant) ?? VARIANTES[0];
  const Variante = v.C;

  return (
    <ShellAdmin
      titulo="Los Cardos"
      subtitulo="Sede"
      atras={{ href: "#", etiqueta: "Volver a sedes" }}
      club={{ slug: "los-cardos", nombre: "Los Cardos Rugby Club", iniciales: "LC" }}
      rol={v.rol}
      activo="sedes"
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 pb-24">
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Nombre", "Los Cardos"],
            ["Dirección", "C. Las Margaritas 1525, Tandil"],
            ["Link de Google Maps", "maps.google.com/…/@-37.3360,-59.0807"],
          ].map(([k, val]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{k}</span>
              <span className="flex h-11 items-center rounded-xl border border-border bg-background px-3 text-sm text-muted-foreground">
                {val}
              </span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium tracking-tight">Instalaciones</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Se crean acá; las nuevas aparecen en el predio como «sin ubicar».
              </p>
            </div>
            <span className="rounded-xl bg-foreground px-4 py-2.5 text-sm text-background">
              + Agregar instalación
            </span>
          </div>
          <ul className="grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 sm:divide-y-0">
            {INSTALACIONES.map((i) => (
              <li key={i.nombre} className="border-border px-4 py-3 sm:border-b">
                <p className="font-medium">{i.nombre}</p>
                <p className="text-sm text-muted-foreground">{i.tipo}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t border-border pt-8">
          <Variante />
        </div>
      </div>
      <SelectorVariantes
        variantes={VARIANTES.map(({ clave, nombre }) => ({ clave, nombre }))}
        actual={v.clave}
      />
    </ShellAdmin>
  );
}
