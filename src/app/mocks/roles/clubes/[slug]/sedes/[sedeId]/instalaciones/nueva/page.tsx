import { notFound } from "next/navigation";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import { contextoMockClub } from "@/ui/features/sedes/contexto-mock";
import { sedePorId } from "@/ui/features/sedes/datos-ejemplo";
import { FormularioInstalacion } from "@/ui/features/sedes/formulario-instalacion";

export default async function PaginaNuevaInstalacionMock({
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
      titulo="Agregar instalación"
      subtitulo={sede.nombre}
      atras={{
        href: `${RUTAS_MOCK.sede(club.slug, sede.id)}${q}`,
        etiqueta: "Volver a la sede",
      }}
      club={club}
      rol={rol}
      activo="sedes"
      como={como}
      esMultiClub={esMultiClub}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Elegí un tipo de la lista de base o agregá uno propio del club. El
          nombre distingue esta instalación de otras del mismo tipo.
        </p>
        <FormularioInstalacion
          destino={`${RUTAS_MOCK.sede(club.slug, sede.id)}${q}`}
        />
      </div>
    </ShellAdmin>
  );
}
