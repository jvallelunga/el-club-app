import { redirect } from "next/navigation";
import { RUTAS_MOCK } from "@/ui/features/mocks-roles/datos-ejemplo";

export default async function PaginaMockCrearClub({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (typeof valor === "string") qs.set(clave, valor);
    else if (Array.isArray(valor)) {
      for (const item of valor) qs.append(clave, item);
    }
  }
  const cola = qs.toString();
  redirect(`${RUTAS_MOCK.nuevoClub}${cola ? `?${cola}` : ""}`);
}
