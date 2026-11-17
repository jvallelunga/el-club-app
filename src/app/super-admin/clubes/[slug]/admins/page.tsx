import { notFound } from "next/navigation";
import { PantallaAdminsReal } from "@/ui/features/admin/pantalla-admins";
import {
  cancelarInvitacionClub,
  invitarAdminClub,
  quitarAdminClub,
} from "@/datos/comandos/clubes";
import { superAdminRequerido } from "@/datos/consultas/acceso";
import { adminsYInvitaciones, clubPorSlug } from "@/datos/consultas/clubes";
import { urlYClaveAnon } from "@/datos/env-supabase";
import { urlEscudoPublico } from "@/dominio/nuevo-club";

export const dynamic = "force-dynamic";

export default async function PaginaAdminsClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await superAdminRequerido();
  const { slug } = await params;
  const club = await clubPorSlug(slug);
  if (!club) notFound();
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

  return (
    <PantallaAdminsReal
      club={clubVisible}
      admins={admins}
      invitaciones={invitaciones}
      invitar={invitar}
      quitar={quitar}
      cancelar={cancelar}
    />
  );
}
