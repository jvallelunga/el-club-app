import { notFound } from "next/navigation";
import { ShellAdmin } from "@/ui/compartidos/shell-admin";
import { DeportesDelClub } from "@/ui/features/deportes/deportes-del-club";
import {
  guardarCondicionDelClub,
  quitarDeporteDelClub,
  sumarDeporteAlClub,
} from "@/datos/comandos/deportes-del-club";
import { adminDelClubRequerido, sesionRequerida } from "@/datos/consultas/acceso";
import { clubPorSlug } from "@/datos/consultas/clubes";
import { panelesDeLaSesion } from "@/datos/consultas/paneles";
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
  const [catalogo, elegidos, paneles] = await Promise.all([
    listarDeportes(),
    deportesElegidosPorElClub(club.id),
    panelesDeLaSesion(sesion),
  ]);

  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  return (
    <ShellAdmin
      titulo="Deportes"
      subtitulo={club.nombre}
      atras={{ href: `/c/${club.slug}/admin`, etiqueta: "Volver al inicio" }}
      club={clubShell}
      paneles={paneles}
      activo="deportes-club"
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
