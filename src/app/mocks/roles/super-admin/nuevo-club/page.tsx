import { FormularioNuevoClub } from "@/ui/features/mocks-roles/formulario-nuevo-club";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import { TarjetaFormulario } from "@/ui/features/mocks-roles/marco-mock";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";

export default function PaginaNuevoClub() {
  return (
    <ShellAdmin
      titulo="Nuevo club"
      atras={{ href: RUTAS_MOCK.superAdmin, etiqueta: "Volver a clubes" }}
      rol="super-admin"
      activo="clubes"
      salirEnMobile={false}
    >
      <TarjetaFormulario>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Creá el club con su nombre. Después le podés nombrar Admins.
        </p>
        <FormularioNuevoClub />
      </TarjetaFormulario>
    </ShellAdmin>
  );
}
