import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import {
  ADMINS_POR_CLUB,
  CLUBES_EJEMPLO,
  RUTAS_MOCK,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import { EscudoClub } from "@/ui/features/mocks-roles/escudo-club";
import { EtiquetaEjemplo, BotonPrincipal } from "@/ui/features/mocks-roles/marco-mock";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { Button } from "@/ui/nativos/button";

function textoAdmins(cantidad: number): string {
  if (cantidad === 0) return "Sin Admins";
  if (cantidad === 1) return "1 Admin";
  return `${cantidad} Admins`;
}

const botonCrear = (
  <Button asChild className="h-10 rounded-lg px-3 text-sm">
    <Link href={RUTAS_MOCK.nuevoClub}>
      <Plus className="size-4" />
      Crear club
    </Link>
  </Button>
);

export default function PaginaSuperAdmin() {
  return (
    <ShellAdmin
      titulo="Clubes"
      subtitulo="Super Admin"
      tituloMobile="Super Admin"
      subtituloMobile="Todos los clubes"
      rol="super-admin"
      activo="clubes"
      accion={botonCrear}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium tracking-tight lg:hidden">
              Clubes
            </h1>
            <p className="text-sm text-muted-foreground">
              {CLUBES_EJEMPLO.length} clubes
            </p>
          </div>
        </div>

        <div className="md:hidden">
          <BotonPrincipal asChild>
            <Link href={RUTAS_MOCK.nuevoClub}>
              <Plus className="size-4" />
              Crear club
            </Link>
          </BotonPrincipal>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {CLUBES_EJEMPLO.map((club) => {
            const admins = ADMINS_POR_CLUB[club.slug] ?? [];
            return (
              <li
                key={club.slug}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <Link
                  href={`${RUTAS_MOCK.inicioClub(club.slug)}?como=super-admin`}
                  className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <EscudoClub club={club} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium">{club.nombre}</p>
                      {club.esEjemplo ? <EtiquetaEjemplo /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {textoAdmins(admins.length)}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
                <div className="flex border-t border-border">
                  <Button
                    asChild
                    variant="ghost"
                    className="h-11 flex-1 rounded-none text-sm"
                  >
                    <Link href={`${RUTAS_MOCK.inicioClub(club.slug)}?como=super-admin`}>
                      Entrar
                    </Link>
                  </Button>
                  <div className="w-px bg-border" />
                  <Button
                    asChild
                    variant="ghost"
                    className="h-11 flex-1 rounded-none text-sm"
                  >
                    <Link href={RUTAS_MOCK.admins(club.slug)}>Admins</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ShellAdmin>
  );
}
