import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import {
  RUTAS_SHELL_APP,
  ShellAdmin,
} from "@/ui/features/mocks-roles/shell-admin";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { listarSedes } from "@/datos/consultas/sedes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { inicialesDesdeNombre } from "@/dominio/slug";

export const dynamic = "force-dynamic";

export default async function PaginaSedes({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sesion = await sesionRequerida(`/c/${slug}/admin/sedes`);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, `/c/${slug}/admin/sedes`);
  const sedes = await listarSedes(club.id);

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  return (
    <ShellAdmin
      titulo="Sedes"
      subtitulo={club.nombre}
      atras={{ href: `/c/${club.slug}/admin`, etiqueta: "Volver al inicio" }}
      club={clubShell}
      rol={sesion.esSuperAdmin ? "super-admin" : "admin"}
      activo="sedes"
      esMultiClub={!sesion.esSuperAdmin && sesion.membresias.length > 1}
      salirHref="/auth/salir"
      rutas={RUTAS_SHELL_APP}
      pie={null}
      salirEnMobile={false}
      accion={
        <Button asChild className="h-11 rounded-xl px-4">
          <Link href={`/c/${club.slug}/admin/sedes/nueva`}>
            <Plus className="size-4" />
            Nueva sede
          </Link>
        </Button>
      }
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-start justify-between gap-3 md:hidden">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Un club puede tener varias sedes. En cada una se cargan la
            dirección, un link de Google Maps y las instalaciones.
          </p>
        </div>
        <p className="hidden max-w-2xl text-sm leading-relaxed text-muted-foreground md:block">
          Un club puede tener varias sedes. En cada una se cargan la dirección,
          un link de Google Maps (con una vista previa del pin) y las
          instalaciones: canchas, house, pileta, vestuarios y lo que el club
          sume.
        </p>

        {sedes.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border px-5 py-10">
            <MapPin className="size-6 text-muted-foreground" />
            <div className="max-w-md">
              <h2 className="text-base font-medium">Todavía no hay sedes</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Agregá la primera sede del club: un campo de deportes, una sede
                social o el lugar que usen.
              </p>
            </div>
            <Button asChild className="h-11 rounded-xl px-4">
              <Link href={`/c/${club.slug}/admin/sedes/nueva`}>
                <Plus className="size-4" />
                Nueva sede
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sedes.map((sede) => (
              <li key={sede.id}>
                <Link
                  href={`/c/${club.slug}/admin/sedes/${sede.id}`}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-medium tracking-tight">
                        {sede.nombre}
                      </h2>
                      {sede.direccion ? (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {sede.direccion}
                        </p>
                      ) : null}
                    </div>
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sede.cantidadInstalaciones === 1
                      ? "1 instalación"
                      : `${sede.cantidadInstalaciones} instalaciones`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ShellAdmin>
  );
}
