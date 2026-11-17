import {
  RUTAS_SHELL_APP,
  ShellAdmin,
} from "@/ui/features/mocks-roles/shell-admin";
import { FormularioNuevoClubReal } from "@/ui/features/admin/formulario-nuevo-club";
import { crearClub } from "@/datos/comandos/clubes";
import { superAdminRequerido } from "@/datos/consultas/acceso";

export const dynamic = "force-dynamic";

export default async function PaginaNuevoClub() {
  await superAdminRequerido("/super-admin/nuevo-club");

  return (
    <ShellAdmin
      titulo="Crear club"
      subtitulo="Super Admin"
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
          Nombre, identificador, escudo, hasta 3 colores (el principal es
          obligatorio; 2 y 3 son opcionales), el color claro de fondo y, si ya
          lo tiene, el dominio del sitio web. Si no cargás los opcionales, se
          derivan del principal.
        </p>
        <FormularioNuevoClubReal crear={crearClub} />
      </div>
    </ShellAdmin>
  );
}
