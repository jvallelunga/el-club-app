import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EscudoClub } from "@/ui/features/mocks-roles/escudo-club";
import {
  CabeceraMock,
  ContenidoMock,
  MarcoPagina,
} from "@/ui/features/mocks-roles/marco-mock";
import { BotonSalir } from "@/ui/features/mocks-roles/boton-salir";
import { destinoTrasIngreso } from "@/dominio/permisos";
import { inicialesDesdeNombre } from "@/dominio/slug";
import { sesionRequerida } from "@/datos/consultas/acceso";

export const dynamic = "force-dynamic";

export default async function PaginaElegirClub() {
  const sesion = await sesionRequerida("/elegir-club");
  const clubes = sesion.membresias;

  if (sesion.esSuperAdmin || clubes.length <= 1) {
    redirect(
      destinoTrasIngreso({
        esSuperAdmin: sesion.esSuperAdmin,
        clubes,
      }),
    );
  }

  const primerNombre = sesion.nombre.split(" ")[0] ?? sesion.nombre;

  return (
    <MarcoPagina
      ancho="completo"
      cabecera={
        <CabeceraMock
          titulo="El Club App"
          accion={
            <BotonSalir href="/auth/salir" className="h-11 px-3 text-sm">
              Salir
            </BotonSalir>
          }
        />
      }
    >
      <ContenidoMock className="mx-auto w-full max-w-5xl gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight">
            Hola, {primerNombre}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Estás como Admin en más de un club. Elegí a cuál querés entrar.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {clubes.map((club) => (
            <li key={club.slug}>
              <Link
                href={`/c/${club.slug}/admin`}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 ring-1 ring-transparent transition-colors hover:bg-muted/50"
              >
                <EscudoClub
                  club={{
                    nombre: club.nombre,
                    iniciales: inicialesDesdeNombre(club.nombre),
                    escudo: null,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{club.nombre}</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </ContenidoMock>
    </MarcoPagina>
  );
}
