import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ADMINS_POR_CLUB,
  clubPorSlug,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import { PantallaAdmins } from "@/ui/features/mocks-roles/pantalla-admins";

export default async function PaginaAdminsClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = clubPorSlug(slug) ?? (slug ? {
    slug,
    nombre: slug
      .split("-")
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(" "),
    esEjemplo: true,
    escudo: null,
    iniciales: slug
      .split("-")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? "")
      .join("") || "CL",
  } : undefined);

  if (!club) notFound();

  const admins = ADMINS_POR_CLUB[club.slug] ?? [];

  return (
    <Suspense>
      <PantallaAdmins club={club} adminsIniciales={admins} />
    </Suspense>
  );
}
