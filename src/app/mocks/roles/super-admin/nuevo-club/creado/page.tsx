import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { RUTAS_MOCK, slugDesdeNombre } from "@/ui/features/mocks-roles/datos-ejemplo";
import {
  BotonPrincipal,
  EtiquetaEjemplo,
  TarjetaFormulario,
} from "@/ui/features/mocks-roles/marco-mock";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { Button } from "@/ui/nativos/button";

export default async function PaginaClubCreado({
  searchParams,
}: {
  searchParams: Promise<{ nombre?: string; slug?: string }>;
}) {
  const params = await searchParams;
  const nombre = params.nombre?.trim() || "Club Nuevo Ejemplo";
  const slug = params.slug?.trim() || slugDesdeNombre(nombre) || "club-nuevo-ejemplo";

  return (
    <ShellAdmin
      titulo="Club creado"
      atras={{ href: RUTAS_MOCK.superAdmin, etiqueta: "Volver a clubes" }}
      rol="super-admin"
      activo="clubes"
      salirEnMobile={false}
    >
      <TarjetaFormulario>
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <CircleCheck className="size-6" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-medium tracking-tight">{nombre}</h1>
            <EtiquetaEjemplo />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            El club ya está creado. Identificador:{" "}
            <span className="font-medium text-foreground">{slug}</span>.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ahora podés nombrar a sus Admins, o volver a la lista de clubes.
            El escudo, los colores y el dominio se definen después.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <BotonPrincipal asChild>
            <Link href={RUTAS_MOCK.admins(slug)}>Agregar Admins</Link>
          </BotonPrincipal>
          <Button asChild variant="outline" className="h-12 w-full rounded-xl text-base">
            <Link href={RUTAS_MOCK.superAdmin}>Ir a clubes</Link>
          </Button>
        </div>
      </TarjetaFormulario>
    </ShellAdmin>
  );
}
