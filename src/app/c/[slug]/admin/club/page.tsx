import { notFound } from "next/navigation";
import {
  RUTAS_SHELL_APP,
  ShellAdmin,
} from "@/ui/features/mocks-roles/shell-admin";
import { FormularioNuevoClubReal } from "@/ui/features/admin/formulario-nuevo-club";
import { actualizarClub } from "@/datos/comandos/clubes";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { puedeEditarRutasDelClub } from "@/dominio/permisos";
import { inicialesDesdeNombre } from "@/dominio/slug";

export const dynamic = "force-dynamic";

export default async function PaginaDatosDelClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sesion = await sesionRequerida(`/c/${slug}/admin/club`);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, `/c/${slug}/admin/club`);

  const clubId = club.id;
  const editaRutas = puedeEditarRutasDelClub(sesion);
  const destino = `/c/${club.slug}/admin/club`;

  async function guardar(formData: FormData) {
    "use server";
    return actualizarClub(clubId, formData);
  }

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  return (
    <ShellAdmin
      titulo="Datos del club"
      subtitulo={club.nombre}
      atras={{ href: `/c/${club.slug}/admin`, etiqueta: "Volver al inicio" }}
      club={clubShell}
      rol={sesion.esSuperAdmin ? "super-admin" : "admin"}
      activo="club"
      esMultiClub={!sesion.esSuperAdmin && sesion.membresias.length > 1}
      salirHref="/auth/salir"
      rutas={RUTAS_SHELL_APP}
      pie={null}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {editaRutas ? (
            <>
              Podés cambiar el nombre, el escudo, la paleta (el principal es
              obligatorio; 2 y 3 son opcionales) y el dominio del sitio web. El
              identificador no se modifica. Si no cargás un escudo nuevo, se
              mantiene el actual.
            </>
          ) : (
            <>
              Podés cambiar el nombre, el escudo y la paleta (el principal es
              obligatorio; 2 y 3 son opcionales) de tu club. El identificador y
              el dominio no se modifican acá: solo el Super Admin puede
              cambiarlos. Si no cargás un escudo nuevo, se mantiene el actual.
            </>
          )}
        </p>
        <FormularioNuevoClubReal
          modo="editar"
          crear={guardar}
          puedeEditarRutas={editaRutas}
          despuesDeGuardar={destino}
          inicial={{
            nombre: club.nombre,
            slug: club.slug,
            escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
            colorPrincipal: club.color_principal,
            colorClaro: club.color_claro,
            color2: club.color_2,
            color3: club.color_3,
            dominioBase: club.dominio_base,
          }}
        />
      </div>
    </ShellAdmin>
  );
}
