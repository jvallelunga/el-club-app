import { notFound } from "next/navigation";
import {
  ShellAdmin,
} from "@/ui/compartidos/shell-admin";
import { FormularioInstalacion } from "@/ui/features/sedes/formulario-instalacion";
import { crearInstalacion } from "@/datos/comandos/sedes";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { sedePorId } from "@/datos/consultas/sedes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { inicialesDesdeNombre } from "@/dominio/slug";

export const dynamic = "force-dynamic";

export default async function PaginaNuevaInstalacion({
  params,
}: {
  params: Promise<{ slug: string; sedeId: string }>;
}) {
  const { slug, sedeId } = await params;
  const sesion = await sesionRequerida(
    `/c/${slug}/admin/sedes/${sedeId}/instalaciones/nueva`,
  );
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(
    club.id,
    `/c/${slug}/admin/sedes/${sedeId}/instalaciones/nueva`,
  );
  const sede = await sedePorId(club.id, sedeId);
  if (!sede) notFound();

  const clubId = club.id;

  async function guardar(formData: FormData) {
    "use server";
    return crearInstalacion(clubId, sedeId, formData);
  }

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  return (
    <ShellAdmin
      titulo="Agregar instalación"
      subtitulo={sede.nombre}
      atras={{
        href: `/c/${club.slug}/admin/sedes/${sede.id}`,
        etiqueta: "Volver a la sede",
      }}
      club={clubShell}
      rol={sesion.esSuperAdmin ? "super-admin" : "admin"}
      activo="sedes"
      esMultiClub={!sesion.esSuperAdmin && sesion.membresias.length > 1}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Elegí un tipo de la lista. Si no está, elegí «Otra». El nombre
          distingue, por ejemplo, «Cancha 1».
        </p>
        <FormularioInstalacion
          destino={`/c/${club.slug}/admin/sedes/${sede.id}`}
          guardar={guardar}
        />
      </div>
    </ShellAdmin>
  );
}
