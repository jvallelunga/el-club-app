import { Suspense } from "react";
import { FormularioNuevoClub } from "@/ui/features/mocks-roles/formulario-nuevo-club";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";

export default function PaginaNuevoClub() {
  return (
    <ShellAdmin
      titulo="Crear club"
      subtitulo="Super Admin"
      atras={{ href: RUTAS_MOCK.superAdmin, etiqueta: "Volver a clubes" }}
      rol="super-admin"
      activo="clubes"
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Completá el nombre, el identificador, el escudo, la paleta y, si
            ya lo tiene, el dominio del sitio web. Nada viene precargado: cada
            club se arma con sus datos.
          </p>
        </div>
        <Suspense>
          <FormularioNuevoClub />
        </Suspense>
      </div>
    </ShellAdmin>
  );
}
