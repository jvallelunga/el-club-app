import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  CLUB_CARDOS,
  CLUB_EJEMPLO,
  PERSONA_MARTIN,
  RUTAS_MOCK,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import { EscudoClub } from "@/ui/features/mocks-roles/escudo-club";
import {
  CabeceraMock,
  ContenidoMock,
  EtiquetaEjemplo,
  MarcoMock,
  PieMock,
} from "@/ui/features/mocks-roles/marco-mock";
import { Button } from "@/ui/nativos/button";

const CLUBES_DE_MARTIN = [CLUB_CARDOS, CLUB_EJEMPLO];

export default function PaginaElegirClub() {
  return (
    <MarcoMock>
      <CabeceraMock
        titulo="El Club App"
        accion={
          <Button asChild variant="ghost" className="h-11 px-3 text-sm">
            <Link href={RUTAS_MOCK.ingreso}>Salir</Link>
          </Button>
        }
      />
      <ContenidoMock className="gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight">
            Hola, {PERSONA_MARTIN.nombre.split(" ")[0]}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Estás como Admin en más de un club. Elegí a cuál querés entrar.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {CLUBES_DE_MARTIN.map((club) => (
            <li key={club.slug}>
              <Link
                href={`${RUTAS_MOCK.inicioClub(club.slug)}?como=${PERSONA_MARTIN.id}`}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 ring-1 ring-transparent transition-colors hover:bg-muted/50"
              >
                <EscudoClub club={club} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium">{club.nombre}</p>
                    {club.esEjemplo ? <EtiquetaEjemplo /> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </ContenidoMock>
      <PieMock />
    </MarcoMock>
  );
}
