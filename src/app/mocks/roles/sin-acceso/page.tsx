import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { PERSONA_ANA, RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";
import {
  BotonPrincipal,
  ContenidoMock,
  EtiquetaEjemplo,
  MarcoAcceso,
} from "@/ui/features/mocks-roles/marco-mock";

export default function PaginaSinAcceso() {
  return (
    <MarcoAcceso>
      <ContenidoMock className="justify-center gap-6 py-10 md:px-0 md:py-0">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ShieldOff className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-medium tracking-tight">
            Todavía no tenés acceso
          </h1>
          <p className="flex flex-wrap items-center gap-1.5 text-sm leading-relaxed text-muted-foreground">
            <span>
              Ingresaste con{" "}
              <span className="font-medium text-foreground">
                {PERSONA_ANA.email}
              </span>
            </span>
            <EtiquetaEjemplo />
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ese email no está como Super Admin ni como Admin de un club.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pedile al Super Admin que te dé de alta. Cuando lo haga, la próxima
            vez que entres ya vas a ver tu club.
          </p>
        </div>
        <BotonPrincipal asChild variant="outline">
          <Link href={RUTAS_MOCK.ingreso}>Cerrar sesión</Link>
        </BotonPrincipal>
      </ContenidoMock>
    </MarcoAcceso>
  );
}
