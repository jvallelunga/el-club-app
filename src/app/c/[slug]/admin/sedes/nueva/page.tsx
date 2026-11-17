import { notFound } from "next/navigation";
import {
  RUTAS_SHELL_APP,
  ShellAdmin,
} from "@/ui/features/mocks-roles/shell-admin";
import { FormularioSede } from "@/ui/features/sedes/formulario-sede";
import { crearSede } from "@/datos/comandos/sedes";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { inicialesDesdeNombre } from "@/dominio/slug";

export const dynamic = "force-dynamic";

export default async function PaginaNuevaSede({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sesion = await sesionRequerida(`/c/${slug}/admin/sedes/nueva`);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, `/c/${slug}/admin/sedes/nueva`);

  const clubId = club.id;
  const slugClub = club.slug;

  async function guardar(formData: FormData) {
    "use server";
    return crearSede(clubId, formData);
  }

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  return (
    <ShellAdmin
      titulo="Nueva sede"
      subtitulo={club.nombre}
      atras={{
        href: `/c/${club.slug}/admin/sedes`,
        etiqueta: "Volver a sedes",
      }}
      club={clubShell}
      rol={sesion.esSuperAdmin ? "super-admin" : "admin"}
      activo="sedes"
      esMultiClub={!sesion.esSuperAdmin && sesion.membresias.length > 1}
      salirHref="/auth/salir"
      rutas={RUTAS_SHELL_APP}
      pie={null}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          El nombre identifica la sede. La dirección y el link de Google Maps
          son opcionales; si el link trae coordenadas, se muestra una vista
          previa con un pin (sin API).
        </p>
        <FormularioSede
          destino={`/c/${slugClub}/admin/sedes`}
          destinoCreada={(id) => `/c/${slugClub}/admin/sedes/${id}`}
          guardar={guardar}
        />
      </div>
    </ShellAdmin>
  );
}
