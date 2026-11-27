import { notFound } from "next/navigation";
import { PantallaAdminsReal } from "@/ui/features/admin/pantalla-admins";
import {
  cancelarInvitacionClub,
  invitarAdminClub,
  quitarAdminClub,
  reenviarLinkInvitacionClub,
} from "@/datos/comandos/clubes";
import {
  adminDelClubRequerido,
  sesionRequerida,
} from "@/datos/consultas/acceso";
import { adminsYInvitaciones, clubPorSlug } from "@/datos/consultas/clubes";
import { panelesDeLaSesion } from "@/datos/consultas/paneles";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";

export const dynamic = "force-dynamic";

export default async function PaginaAdminsDelClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sesion = await sesionRequerida(`/c/${slug}/admin/admins`);
  const club = await clubPorSlug(slug);
  if (!club) notFound();
  await adminDelClubRequerido(club.id, `/c/${slug}/admin/admins`);
  const paneles = await panelesDeLaSesion(sesion);

  const clubId = club.id;
  const clubVisible = {
    id: club.id,
    slug: club.slug,
    nombre: club.nombre,
    escudo: urlEscudoPublico(urlYClaveAnon().url, club.escudo_ruta),
  };

  const { admins, invitaciones } = await adminsYInvitaciones(clubId);

  async function invitar(email: string) {
    "use server";
    return invitarAdminClub(clubId, email);
  }

  async function quitar(usuarioId: string) {
    "use server";
    return quitarAdminClub(clubId, usuarioId);
  }

  async function cancelar(id: string) {
    "use server";
    return cancelarInvitacionClub(clubId, id);
  }

  async function reenviar(id: string) {
    "use server";
    return reenviarLinkInvitacionClub(clubId, id);
  }

  return (
    <PantallaAdminsReal
      club={clubVisible}
      admins={admins}
      invitaciones={invitaciones}
      usuarioId={sesion.usuarioId}
      paneles={paneles}
      atras={{ href: `/c/${club.slug}/admin`, etiqueta: "Volver al inicio" }}
      invitar={invitar}
      quitar={quitar}
      cancelar={cancelar}
      reenviar={reenviar}
    />
  );
}
