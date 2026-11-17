import { redirect } from "next/navigation";
import { superAdminRequerido } from "@/datos/consultas/acceso";

export const dynamic = "force-dynamic";

export default async function PaginaAdminsSuperAdmin({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await superAdminRequerido();
  const { slug } = await params;
  redirect(`/c/${slug}/admin/admins`);
}
