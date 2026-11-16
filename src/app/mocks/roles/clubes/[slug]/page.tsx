import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CLUB_CARDOS,
  CLUB_EJEMPLO,
  PERSONA_LUCIA,
  PERSONA_MARTIN,
  PERSONA_SOFIA,
  clubPorSlug,
  RUTAS_MOCK,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import { EscudoClub } from "@/ui/features/mocks-roles/escudo-club";
import { EtiquetaEjemplo } from "@/ui/features/mocks-roles/marco-mock";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { Button } from "@/ui/nativos/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/nativos/card";

const PERSONAS = {
  [PERSONA_LUCIA.id]: PERSONA_LUCIA,
  [PERSONA_MARTIN.id]: PERSONA_MARTIN,
  [PERSONA_SOFIA.id]: PERSONA_SOFIA,
};

export default async function PaginaInicioClub({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ como?: string }>;
}) {
  const { slug } = await params;
  const { como } = await searchParams;
  const club = clubPorSlug(slug);
  if (!club) notFound();

  const esSuperAdmin = como === "super-admin";
  const persona = como && !esSuperAdmin ? PERSONAS[como] : undefined;
  const esMultiClub = persona?.id === PERSONA_MARTIN.id;
  const nombreSaludo = esSuperAdmin
    ? undefined
    : persona?.nombre.split(" ")[0] ?? "Lucía";

  const atras = esSuperAdmin
    ? { href: RUTAS_MOCK.superAdmin, etiqueta: "Volver a clubes" }
    : esMultiClub
      ? { href: RUTAS_MOCK.elegirClub, etiqueta: "Cambiar de club" }
      : undefined;

  return (
    <ShellAdmin
      titulo={club.nombre}
      subtitulo={esSuperAdmin ? "Super Admin" : "Admin"}
      atras={atras}
      club={club}
      rol={esSuperAdmin ? "super-admin" : "admin"}
      activo="inicio"
      como={como}
      esMultiClub={esMultiClub}
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-4">
          <EscudoClub club={club} tamano="lg" />
          <div className="min-w-0">
            {nombreSaludo ? (
              <h1 className="text-2xl font-medium tracking-tight">
                Hola, {nombreSaludo}
              </h1>
            ) : (
              <h1 className="text-2xl font-medium tracking-tight">{club.nombre}</h1>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {esSuperAdmin ? "Entraste como Super Admin" : "Admin de este club"}
              {club.esEjemplo ? (
                <>
                  {" "}
                  <EtiquetaEjemplo />
                </>
              ) : null}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inicio del club</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Acá va a estar el admin de {club.nombre}. Por ahora es un
              placeholder: lo armamos de a poco en los próximos ítems.
            </p>
          </CardContent>
        </Card>

        {esSuperAdmin ? (
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl text-base md:hidden"
          >
            <Link href={RUTAS_MOCK.admins(club.slug)}>Ver Admins</Link>
          </Button>
        ) : null}

        {club.slug === CLUB_CARDOS.slug && esMultiClub ? (
          <p className="text-xs text-muted-foreground md:hidden">
            También sos Admin de {CLUB_EJEMPLO.nombre}.{" "}
            <Link href={RUTAS_MOCK.elegirClub} className="underline-offset-2 hover:underline">
              Cambiar de club
            </Link>
          </p>
        ) : null}
      </div>
    </ShellAdmin>
  );
}
