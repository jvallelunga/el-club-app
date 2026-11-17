import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import {
  ShellAdmin,
} from "@/ui/compartidos/shell-admin";
import { FormularioSede } from "@/ui/features/sedes/formulario-sede";
import { BotonEliminarInstalacion } from "@/ui/features/sedes/boton-eliminar-instalacion";
import { actualizarSede, eliminarInstalacion } from "@/datos/comandos/sedes";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { sedePorId } from "@/datos/consultas/sedes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { inicialesDesdeNombre } from "@/dominio/slug";

export const dynamic = "force-dynamic";

export default async function PaginaSede({
  params,
}: {
  params: Promise<{ slug: string; sedeId: string }>;
}) {
  const { slug, sedeId } = await params;
  const sesion = await sesionRequerida(`/c/${slug}/admin/sedes/${sedeId}`);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, `/c/${slug}/admin/sedes/${sedeId}`);
  const sede = await sedePorId(club.id, sedeId);
  if (!sede) notFound();

  const clubId = club.id;
  const slugClub = club.slug;

  async function guardar(formData: FormData) {
    "use server";
    return actualizarSede(clubId, sedeId, formData);
  }

  async function eliminar(instalacionId: string) {
    "use server";
    return eliminarInstalacion(clubId, sedeId, instalacionId);
  }

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  return (
    <ShellAdmin
      titulo={sede.nombre}
      subtitulo="Sede"
      atras={{
        href: `/c/${club.slug}/admin/sedes`,
        etiqueta: "Volver a sedes",
      }}
      club={clubShell}
      rol={sesion.esSuperAdmin ? "super-admin" : "admin"}
      activo="sedes"
      esMultiClub={!sesion.esSuperAdmin && sesion.membresias.length > 1}
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <FormularioSede
          inicial={{
            nombre: sede.nombre,
            direccion: sede.direccion ?? "",
            mapsUrl: sede.maps_url ?? "",
          }}
          destino={`/c/${slugClub}/admin/sedes/${sedeId}`}
          guardar={guardar}
        />

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-medium tracking-tight">
                Instalaciones
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Canchas, house, pileta, vestuarios y lo que el club agregue
                como tipo propio. Cada una tiene un nombre (por ejemplo
                «Cancha 1») y notas opcionales.
              </p>
            </div>
            <Button asChild className="h-11 shrink-0 rounded-xl px-4">
              <Link
                href={`/c/${club.slug}/admin/sedes/${sede.id}/instalaciones/nueva`}
              >
                <Plus className="size-4" />
                Agregar instalación
              </Link>
            </Button>
          </div>

          {sede.instalaciones.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Esta sede todavía no tiene instalaciones.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {sede.instalaciones.map((item) => {
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.tipoNombre}
                        {!item.tipoBase ? " · tipo del club" : ""}
                      </p>
                      {item.notas ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.notas}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button asChild variant="ghost" className="h-10">
                        <Link
                          href={`/c/${club.slug}/admin/sedes/${sede.id}/instalaciones/${item.id}`}
                        >
                          Editar
                        </Link>
                      </Button>
                      <BotonEliminarInstalacion
                        nombre={item.nombre}
                        eliminar={eliminar.bind(null, item.id)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </ShellAdmin>
  );
}
