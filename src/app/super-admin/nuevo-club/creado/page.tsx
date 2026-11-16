import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/ui/nativos/button";
import {
  BotonPrincipal,
  TarjetaFormulario,
} from "@/ui/features/mocks-roles/marco-mock";
import {
  RUTAS_SHELL_APP,
  ShellAdmin,
} from "@/ui/features/mocks-roles/shell-admin";
import { superAdminRequerido } from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";

export const dynamic = "force-dynamic";

export default async function PaginaClubCreado({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; nombre?: string }>;
}) {
  await superAdminRequerido("/super-admin");
  const params = await searchParams;
  const slug = params.slug ?? "";
  if (!slug) redirect("/super-admin");

  const club = await clubPorSlug(slug);
  const nombre = club?.nombre ?? params.nombre ?? slug;

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
      <TarjetaFormulario className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-medium tracking-tight">{nombre}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            El club ya está creado. Identificador:{" "}
            <span className="font-medium text-foreground">{slug}</span>.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ahora podés nombrar a sus Admins, o volver a la lista de clubes. El
            escudo, los colores y el dominio se definen después. El dominio raíz
            queda para el sitio web del club; la app usa subdominios (admin,
            vivo).
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <BotonPrincipal asChild>
            <Link href={`/super-admin/clubes/${slug}/admins`}>
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
      </TarjetaFormulario>
    </ShellAdmin>
  );
}
