import { notFound } from "next/navigation";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import { contextoMockClub } from "@/ui/features/sedes/contexto-mock";
import { FormularioSede } from "@/ui/features/sedes/formulario-sede";

export default async function PaginaNuevaSedeMock({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ como?: string }>;
}) {
  const { slug } = await params;
  const { como } = await searchParams;
  const ctx = contextoMockClub(slug, como);
  if (!ctx) notFound();
  const { club, rol, esMultiClub, q } = ctx;

  return (
    <ShellAdmin
      titulo="Nueva sede"
      subtitulo={club.nombre}
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          El nombre identifica la sede. La dirección y el link de Google Maps
          son opcionales; si el link trae coordenadas, se muestra una vista
          previa con un pin (sin API).
        </p>
        <FormularioSede destino={`${RUTAS_MOCK.sedes(club.slug)}${q}`} />
      </div>
    </ShellAdmin>
  );
}
