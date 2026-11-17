import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import { contextoMockClub } from "@/ui/features/sedes/contexto-mock";
import { sedePorId, tipoInstalacionPorId } from "@/ui/features/sedes/datos-ejemplo";
import { FormularioSede } from "@/ui/features/sedes/formulario-sede";

export default async function PaginaSedeMock({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; sedeId: string }>;
  searchParams: Promise<{ como?: string }>;
}) {
  const { slug, sedeId } = await params;
  const { como } = await searchParams;
  const ctx = contextoMockClub(slug, como);
  const sede = sedePorId(sedeId);
  if (!ctx || !sede) notFound();
  const { club, rol, esMultiClub, q } = ctx;

  return (
    <ShellAdmin
      titulo={sede.nombre}
      subtitulo="Sede"
      atras={{
        href: `${RUTAS_MOCK.sedes(club.slug)}${q}`,
        etiqueta: "Volver a sedes",
      }}
      club={club}
      rol={rol}
      activo="sedes"
      como={como}
      esMultiClub={esMultiClub}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <FormularioSede
          inicial={sede}
          destino={`${RUTAS_MOCK.sede(club.slug, sede.id)}${q}`}
        />

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-medium tracking-tight">
                Instalaciones
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Canchas, house, pileta, vestuarios y lo que el club agregue
                como tipo propio. Cada una tiene un nombre (por ejemplo
                «Cancha 1») y notas opcionales.
              </p>
            </div>
            <Button asChild className="h-11 shrink-0 rounded-xl px-4">
              <Link
                href={`${RUTAS_MOCK.instalacionNueva(club.slug, sede.id)}${q}`}
              >
                <Plus className="size-4" />
                Agregar instalación
              </Link>
            </Button>
          </div>

          {sede.instalaciones.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Esta sede todavía no tiene instalaciones.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {sede.instalaciones.map((item) => {
                const tipo = tipoInstalacionPorId(item.tipoId);
                return (
                  <li key={item.id} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {tipo?.nombre ?? item.tipoId}
                        {tipo && !tipo.base ? " · tipo del club" : ""}
                      </p>
                    </div>
                    {item.notas ? (
                      <p className="text-sm text-muted-foreground sm:max-w-sm sm:text-right">
                        {item.notas}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </ShellAdmin>
  );
}
