import Link from "next/link";
import { notFound } from "next/navigation";
import { EscudoClub } from "@/ui/compartidos/escudo-club";
import {
  ShellAdmin,
} from "@/ui/compartidos/shell-admin";
import { inicialesDesdeNombre } from "@/dominio/slug";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { predioEnVisorDeSede } from "@/datos/consultas/predio";
import { listarSedes, sedePorId } from "@/datos/consultas/sedes";
import type { PredioEnVisor } from "@/dominio/predio-3d";
import { BloquePredio } from "@/ui/features/predio/bloque-predio";
import { urlYClaveAnon } from "@/datos/env-supabase";

export const dynamic = "force-dynamic";

export default async function PaginaAdminClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sesion = await sesionRequerida(`/c/${slug}/admin`);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, `/c/${slug}/admin`);

  const predioDeLaSede = await predioDeLaUnicaSede(club.id);

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  const hostAdmin = club.dominio_base
    ? `admin.${club.dominio_base}`
    : null;

  return (
    <ShellAdmin
      titulo={club.nombre}
      subtitulo="Inicio"
      tituloMobile={club.nombre}
      subtituloMobile="Inicio"
      club={clubShell}
      rol={sesion.esSuperAdmin ? "super-admin" : "admin"}
      activo="inicio"
      esMultiClub={!sesion.esSuperAdmin && sesion.membresias.length > 1}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <EscudoClub club={clubShell} tamano="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-medium tracking-tight">
              {club.nombre}
            </h2>
            <p className="text-sm text-muted-foreground">
              {sesion.esSuperAdmin ? "Entraste como Super Admin" : "Admin"}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Este es el inicio del administrador del club. Acá van a vivir las
          herramientas del día a día. Todavía no hay más secciones.
        </p>

        {hostAdmin ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cuando el dominio esté configurado, el admin también va a estar en{" "}
            <span className="font-medium text-foreground">{hostAdmin}</span>.
            Por ahora se entra por esta URL.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            El acceso de este club, hasta que tenga un dominio propio, es{" "}
            <span className="font-medium text-foreground">
              /c/{club.slug}/admin
            </span>
            . El dominio raíz del club queda para el sitio web; la app usa
            subdominios (admin, vivo).
          </p>
        )}

        <p className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-4">
          <Link
            href={`/c/${club.slug}/admin/club`}
            className="underline-offset-4 hover:underline"
          >
            Datos del club
          </Link>
          <Link
            href={`/c/${club.slug}/admin/admins`}
            className="underline-offset-4 hover:underline"
          >
            Administrar Admins
          </Link>
        </p>

        {predioDeLaSede ? (
          <BloquePredio
            predio={predioDeLaSede.predio}
            sedeNombre={predioDeLaSede.sede.nombre}
            hrefSede={`/c/${club.slug}/admin/sedes/${predioDeLaSede.sede.id}`}
            className="border-t border-border pt-6"
          />
        ) : null}
      </div>
    </ShellAdmin>
  );
}

/**
 * Si el club tiene una sola sede y su predio está armado, la Inicio también
 * muestra el predio 3D (#44). Con más de una sede, no.
 */
async function predioDeLaUnicaSede(
  clubId: string,
): Promise<{ sede: { id: string; nombre: string }; predio: PredioEnVisor } | null> {
  const sedes = await listarSedes(clubId);
  if (sedes.length !== 1) return null;
  const sede = await sedePorId(clubId, sedes[0].id);
  if (!sede) return null;
  const predio = await predioEnVisorDeSede(sede);
  return predio ? { sede: { id: sede.id, nombre: sede.nombre }, predio } : null;
}
