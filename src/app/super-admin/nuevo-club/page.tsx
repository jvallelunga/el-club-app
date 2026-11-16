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
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <p className="text-sm leading-relaxed text-muted-foreground lg:hidden">
          Super Admin
        </p>
        <FormularioNuevoClubReal crear={crearClub} />
      </div>
    </ShellAdmin>
  );
}
