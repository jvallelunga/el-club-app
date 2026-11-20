import { notFound } from "next/navigation";
import { etiquetaDeportesDelClub, ShellAdmin } from "@/ui/compartidos/shell-admin";
import { DeportesDelClub } from "@/ui/features/deportes/deportes-del-club";
import {
  guardarCondicionDelClub,
  quitarDeporteDelClub,
  sumarDeporteAlClub,
} from "@/datos/comandos/deportes-del-club";
import { adminDelClubRequerido, sesionRequerida } from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { listarDeportes } from "@/datos/consultas/deportes";
import { deportesElegidosPorElClub } from "@/datos/consultas/deportes-del-club";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { deportesDelClub } from "@/dominio/deportes";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { inicialesDesdeNombre } from "@/dominio/slug";

export const dynamic = "force-dynamic";

export default async function PaginaDeportesDelClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ruta = `/c/${slug}/admin/deportes`;
  const sesion = await sesionRequerida(ruta);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, ruta);
  const [catalogo, elegidos] = await Promise.all([
    listarDeportes(),
    deportesElegidosPorElClub(club.id),
  ]);

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };
  const esSuperAdmin = sesion.esSuperAdmin;
  const rol = esSuperAdmin ? "super-admin" : "admin";

  return (
    <ShellAdmin
      titulo={etiquetaDeportesDelClub(rol)}
      subtitulo={club.nombre}
      atras={{ href: `/c/${club.slug}/admin`, etiqueta: "Volver al inicio" }}
      club={clubShell}
      rol={rol}
      activo="deportes-club"
      esMultiClub={!esSuperAdmin && sesion.membresias.length > 1}
      salirEnMobile={false}
    >
      <DeportesDelClub
        nombreClub={club.nombre}
        deportes={deportesDelClub(catalogo, elegidos)}
        sumar={sumarDeporteAlClub.bind(null, club.id)}
        quitar={quitarDeporteDelClub.bind(null, club.id)}
        guardarCondicion={guardarCondicionDelClub.bind(null, club.id)}
      />
    </ShellAdmin>
  );
}
