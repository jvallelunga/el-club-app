import { notFound } from "next/navigation";
import {
  ShellAdmin,
} from "@/ui/compartidos/shell-admin";
import { FormularioInstalacion } from "@/ui/features/sedes/formulario-instalacion";
import { actualizarInstalacion } from "@/datos/comandos/sedes";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import {
  instalacionPorId,
  sedePorId,
  tiposDeInstalacion,
} from "@/datos/consultas/sedes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { inicialesDesdeNombre } from "@/dominio/slug";

export const dynamic = "force-dynamic";

export default async function PaginaEditarInstalacion({
  params,
}: {
  params: Promise<{ slug: string; sedeId: string; instalacionId: string }>;
}) {
  const { slug, sedeId, instalacionId } = await params;
  const sesion = await sesionRequerida(
    `/c/${slug}/admin/sedes/${sedeId}/instalaciones/${instalacionId}`,
  );
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(
    club.id,
    `/c/${slug}/admin/sedes/${sedeId}/instalaciones/${instalacionId}`,
  );
  const sede = await sedePorId(club.id, sedeId);
  const instalacion = await instalacionPorId(club.id, sedeId, instalacionId);
  if (!sede || !instalacion) notFound();
  const tipos = await tiposDeInstalacion(club.id);

  const clubId = club.id;

  async function guardar(formData: FormData) {
    "use server";
    return actualizarInstalacion(clubId, sedeId, instalacionId, formData);
  }

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  return (
    <ShellAdmin
      titulo="Editar instalación"
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
          Podés cambiar el tipo, el nombre y las notas. Si elegís «Otra», se
          crea un tipo propio de este club.
        </p>
        <FormularioInstalacion
          tipos={tipos}
          destino={`/c/${club.slug}/admin/sedes/${sede.id}`}
          inicial={{
            tipoId: instalacion.tipoId,
            nombre: instalacion.nombre,
            notas: instalacion.notas,
          }}
          guardar={guardar}
          etiquetaBoton="Guardar instalación"
        />
      </div>
    </ShellAdmin>
  );
}
