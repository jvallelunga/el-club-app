import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import { contextoMockClub } from "@/ui/features/sedes/contexto-mock";
import { SEDES_CLUB_NORTE } from "@/ui/features/sedes/datos-ejemplo";

export default async function PaginaSedesMock({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ como?: string; vacio?: string }>;
}) {
  const { slug } = await params;
  const { como, vacio } = await searchParams;
  const ctx = contextoMockClub(slug, como);
  if (!ctx) notFound();
  const { club, rol, esMultiClub, q, atrasInicio } = ctx;
  const sedes = vacio === "1" ? [] : SEDES_CLUB_NORTE;

  return (
    <ShellAdmin
      titulo="Sedes"
      subtitulo={club.nombre}
      atras={atrasInicio}
      club={club}
      rol={rol}
      activo="sedes"
      como={como}
      esMultiClub={esMultiClub}
      accion={
        <Button asChild className="h-11 rounded-xl px-4">
          <Link href={`${RUTAS_MOCK.sedeNueva(club.slug)}${q}`}>
            <Plus className="size-4" />
            Nueva sede
          </Link>
        </Button>
      }
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-start justify-between gap-3 md:hidden">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Un club puede tener varias sedes. En cada una se cargan la
            dirección, un link de Google Maps y las instalaciones.
          </p>
        </div>
        <p className="hidden max-w-2xl text-sm leading-relaxed text-muted-foreground md:block">
          Un club puede tener varias sedes. En cada una se cargan la dirección,
          un link de Google Maps (con una vista previa del pin) y las
          instalaciones: canchas, house, pileta, vestuarios y lo que el club
          sume.
        </p>

        {sedes.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border px-5 py-10">
            <MapPin className="size-6 text-muted-foreground" />
            <div className="max-w-md">
              <h2 className="text-base font-medium">Todavía no hay sedes</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Agregá la primera sede del club: un campo de deportes, una sede
                social o el lugar que usen.
              </p>
            </div>
            <Button asChild className="h-11 rounded-xl px-4">
              <Link href={`${RUTAS_MOCK.sedeNueva(club.slug)}${q}`}>
                <Plus className="size-4" />
                Nueva sede
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sedes.map((sede) => (
              <li key={sede.id}>
                <Link
                  href={`${RUTAS_MOCK.sede(club.slug, sede.id)}${q}`}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-medium tracking-tight">
                        {sede.nombre}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {sede.direccion}
                      </p>
                    </div>
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sede.instalaciones.length === 1
                      ? "1 instalación"
                      : `${sede.instalaciones.length} instalaciones`}
                    {sede.instalaciones.length
                      ? ` · ${sede.instalaciones
                          .slice(0, 3)
                          .map((item) => item.nombre)
                          .join(", ")}`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ShellAdmin>
  );
}
