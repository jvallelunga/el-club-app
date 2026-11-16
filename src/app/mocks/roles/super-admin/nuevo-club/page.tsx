import { FormularioNuevoClub } from "@/ui/features/mocks-roles/formulario-nuevo-club";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import {
  CabeceraMock,
  ContenidoMock,
  MarcoMock,
  PieMock,
} from "@/ui/features/mocks-roles/marco-mock";

export default function PaginaNuevoClub() {
  return (
    <MarcoMock>
      <CabeceraMock
        atras={{ href: RUTAS_MOCK.superAdmin, etiqueta: "Volver a clubes" }}
        titulo="Nuevo club"
      />
      <ContenidoMock className="gap-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Creá el club con su nombre. Después le podés nombrar Admins.
        </p>
        <FormularioNuevoClub />
      </ContenidoMock>
      <PieMock />
    </MarcoMock>
  );
}
