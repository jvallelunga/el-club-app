import Link from "next/link";
import { Button } from "@/ui/nativos/button";
import { Separator } from "@/ui/nativos/separator";
import {
  CLUB_NORTE,
  PERSONA_LUCIA,
  RUTAS_MOCK,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import { IconoGoogle } from "@/ui/features/mocks-roles/icono-google";
import { MarcaElClub } from "@/ui/marca/logo-el-club";
import { EscudoClub } from "@/ui/features/mocks-roles/escudo-club";
import {
  ContenidoMock,
  MarcoAcceso,
} from "@/ui/features/mocks-roles/marco-mock";

const CASOS = [
  {
    href: RUTAS_MOCK.superAdmin,
    etiqueta: "Entrar como Super Admin",
  },
  {
    href: `${RUTAS_MOCK.inicioClub(CLUB_NORTE.slug)}?como=${PERSONA_LUCIA.id}`,
    etiqueta: "Entrar como Admin de un club",
  },
  {
    href: RUTAS_MOCK.elegirClub,
    etiqueta: "Entrar como Admin de dos clubes",
  },
  {
    href: RUTAS_MOCK.sinAcceso,
    etiqueta: "Entrar sin acceso",
  },
];

export default function PaginaIngreso() {
  return (
    <MarcoAcceso
      panel={
        <div className="flex max-w-sm flex-col gap-8">
          <EscudoClub club={CLUB_NORTE} tamano="xl" />
          <div className="flex flex-col gap-3">
            <MarcaElClub nombreClassName="text-sm font-medium tracking-wide text-muted-foreground" />
            <p className="text-4xl font-medium tracking-tight">
              La app del club.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para el administrador del club y, más adelante, el día a día.
            </p>
          </div>
        </div>
      }
    >
      <ContenidoMock className="justify-center gap-8 py-10 md:px-0 md:py-0">
        <div className="flex flex-col gap-3">
          <MarcaElClub
            className="lg:hidden"
            nombreClassName="text-sm font-medium tracking-wide text-muted-foreground"
          />
          <h1 className="text-3xl font-medium tracking-tight">Ingresá</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Entrá con tu cuenta de Google. El Super Admin te da de alta con tu
            email: la primera vez que entres, ya tenés el club asignado.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-xl border-border bg-white text-base text-foreground hover:bg-muted"
        >
          <Link href={RUTAS_MOCK.superAdmin}>
            <IconoGoogle className="size-5" />
            Continuar con Google
          </Link>
        </Button>

        <Separator />

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Recorridos de ejemplo
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            En la app real, Google te lleva directo según tu rol. Acá podés
            elegir un caso para recorrer el mock.
          </p>
          <ul className="flex flex-col">
            {CASOS.map((caso) => (
              <li key={caso.href}>
                <Link
                  href={caso.href}
                  className="flex h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
                >
                  {caso.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ContenidoMock>
    </MarcoAcceso>
  );
}
