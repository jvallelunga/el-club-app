import { notFound } from "next/navigation";
import {
  RUTAS_SHELL_APP,
  ShellAdmin,
} from "@/ui/features/mocks-roles/shell-admin";
import { FormularioNuevoClubReal } from "@/ui/features/admin/formulario-nuevo-club";
import { actualizarClub } from "@/datos/comandos/clubes";
import { superAdminRequerido } from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";

export const dynamic = "force-dynamic";

export default async function PaginaEditarClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await superAdminRequerido("/super-admin");
  const { slug } = await params;
  const club = await clubPorSlug(slug);
  if (!club) notFound();

  const clubId = club.id;

  async function guardar(formData: FormData) {
    "use server";
    return actualizarClub(clubId, formData);
  }

  return (
    <ShellAdmin
      titulo="Editar club"
      subtitulo={club.nombre}
      atras={{ href: "/super-admin", etiqueta: "Volver a clubes" }}
      rol="super-admin"
      activo="clubes"
      salirHref="/auth/salir"
      rutas={RUTAS_SHELL_APP}
      pie={null}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Podés cambiar el nombre, el escudo, la paleta (el principal es
          obligatorio; 2 y 3 son opcionales) y el dominio del sitio web. El
          identificador no se modifica. Si no cargás un escudo nuevo, se
          mantiene el actual.
        </p>
        <FormularioNuevoClubReal
          modo="editar"
          crear={guardar}
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
