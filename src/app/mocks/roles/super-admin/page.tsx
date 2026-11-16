import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import {
  ADMINS_POR_CLUB,
  CLUBES_EJEMPLO,
  RUTAS_MOCK,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import { EscudoClub } from "@/ui/features/mocks-roles/escudo-club";
import {
  BotonPrincipal,
  CabeceraMock,
  ContenidoMock,
  EtiquetaEjemplo,
  MarcoMock,
  PieMock,
} from "@/ui/features/mocks-roles/marco-mock";
import { Button } from "@/ui/nativos/button";

function textoAdmins(cantidad: number): string {
  if (cantidad === 0) return "Sin Admins";
  if (cantidad === 1) return "1 Admin";
  return `${cantidad} Admins`;
}

export default function PaginaSuperAdmin() {
  return (
    <MarcoMock>
      <CabeceraMock
        titulo="Super Admin"
        subtitulo="Todos los clubes"
        accion={
          <Button asChild variant="ghost" className="h-11 px-3 text-sm">
            <Link href={RUTAS_MOCK.ingreso}>Salir</Link>
          </Button>
        }
      />
      <ContenidoMock className="gap-6">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium tracking-tight">Clubes</h1>
            <p className="text-sm text-muted-foreground">
              {CLUBES_EJEMPLO.length} clubes
            </p>
          </div>
        </div>

        <BotonPrincipal asChild>
          <Link href={RUTAS_MOCK.nuevoClub}>
            <Plus className="size-4" />
            Crear club
          </Link>
        </BotonPrincipal>

        <ul className="flex flex-col gap-3">
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
      </ContenidoMock>
      <PieMock />
    </MarcoMock>
  );
}
