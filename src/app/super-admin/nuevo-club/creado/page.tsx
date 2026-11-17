import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { BotonPrincipal } from "@/ui/features/mocks-roles/marco-mock";
import {
  RUTAS_SHELL_APP,
  ShellAdmin,
} from "@/ui/features/mocks-roles/shell-admin";
import { VistaPreviaClub } from "@/ui/features/club/vista-previa-club";
import { superAdminRequerido } from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { derivarPaleta } from "@/dominio/paleta";
import { urlEscudoPublico } from "@/dominio/nuevo-club";

export const dynamic = "force-dynamic";

export default async function PaginaClubCreado({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  await superAdminRequerido("/super-admin");
  const params = await searchParams;
  const slug = params.slug ?? "";
  if (!slug) redirect("/super-admin");

  const club = await clubPorSlug(slug);
  if (!club) redirect("/super-admin");

  const paleta = derivarPaleta(
    club.color_principal,
    club.color_claro,
    [club.color_2 ?? "", club.color_3 ?? ""],
  );
  const escudo = urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta);

  return (
    <ShellAdmin
      titulo="Club creado"
      subtitulo="Super Admin"
      atras={{ href: "/super-admin", etiqueta: "Volver a clubes" }}
      rol="super-admin"
      activo="clubes"
      salirHref="/auth/salir"
      rutas={RUTAS_SHELL_APP}
      pie={null}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <CircleCheck className="size-6" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-medium tracking-tight">{club.nombre}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              El club ya está creado. Identificador:{" "}
              <span className="font-medium text-foreground">{club.slug}</span>.
            </p>
            {club.dominio_base ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Dominio del sitio web:{" "}
                <span className="font-medium text-foreground">
                  {club.dominio_base}
                </span>
                . La app usa{" "}
                <span className="font-medium text-foreground">
                  admin.{club.dominio_base}
                </span>{" "}
                y{" "}
                <span className="font-medium text-foreground">
                  vivo.{club.dominio_base}
                </span>
                .
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Todavía no tiene dominio propio. Se entra por{" "}
                <span className="font-medium text-foreground">
                  /c/{club.slug}/admin
                </span>
                .
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ahora podés nombrar a sus Admins, o volver a la lista de clubes.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:max-w-sm">
            <BotonPrincipal asChild>
              <Link href={`/c/${club.slug}/admin/admins`}>
                Agregar Admins
              </Link>
            </BotonPrincipal>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-xl text-base"
            >
              <Link href="/super-admin">Ir a clubes</Link>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-80 lg:w-[22rem] md:shrink-0">
          <VistaPreviaClub
            nombre={club.nombre}
            slug={club.slug}
            escudo={escudo}
            paleta={paleta}
            dominioBase={club.dominio_base ?? ""}
          />
        </div>
      </div>
    </ShellAdmin>
  );
}
