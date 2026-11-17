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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Nombre, identificador, escudo, hasta 4 colores (el principal es
            obligatorio; 2, 3 y 4 son opcionales), el color claro de fondo y,
            si ya lo tiene, el dominio del sitio web. Si no cargás los
            opcionales, se derivan del principal. Nada de un club real viene
            precargado.
          </p>
        </div>
        <Suspense>
          <FormularioNuevoClub />
        </Suspense>
      </div>
    </ShellAdmin>
  );
}
