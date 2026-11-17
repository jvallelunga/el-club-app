import { BotonSalir } from "@/ui/features/mocks-roles/boton-salir";
import { ShieldOff } from "lucide-react";
import {
  ContenidoMock,
  MarcoAcceso,
} from "@/ui/features/mocks-roles/marco-mock";
import { sesionRequerida } from "@/datos/consultas/acceso";

export const dynamic = "force-dynamic";

export default async function PaginaSinAcceso() {
  const sesion = await sesionRequerida("/sin-acceso");

  return (
    <MarcoAcceso pie={null}>
      <ContenidoMock className="justify-center gap-6 py-10 md:px-0 md:py-0">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ShieldOff className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-medium tracking-tight">
            Todavía no tenés acceso
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ingresaste con{" "}
            <span className="font-medium text-foreground">{sesion.email}</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ese email no está como Super Admin ni como Admin de un club.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pedile al Super Admin que te dé de alta. Cuando lo haga, la próxima
            vez que entres ya vas a ver tu club.
          </p>
        </div>
        <BotonSalir
          href="/auth/salir"
          variant="outline"
          className="h-12 w-full rounded-xl text-base"
        >
          Cerrar sesión
        </BotonSalir>
      </ContenidoMock>
    </MarcoAcceso>
  );
}
