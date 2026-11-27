import "server-only";

import { redirect } from "next/navigation";
import { puedeAdministrarClub, type SesionApp } from "@/dominio/permisos";
import { sesionDelPedido } from "./sesion";

export async function sesionRequerida(siguiente?: string): Promise<SesionApp> {
  const sesion = await sesionDelPedido();
  if (!sesion) {
    const dest = siguiente
      ? `/ingreso?siguiente=${encodeURIComponent(siguiente)}`
      : "/ingreso";
    redirect(dest);
  }
  return sesion;
}

export async function superAdminRequerido(siguiente?: string): Promise<SesionApp> {
  const sesion = await sesionRequerida(siguiente);
  if (!sesion.esSuperAdmin) {
    redirect("/sin-acceso");
  }
  return sesion;
}

export async function adminDelClubRequerido(
  clubId: string,
  siguiente?: string,
): Promise<SesionApp> {
  const sesion = await sesionRequerida(siguiente);
  if (!puedeAdministrarClub(sesion, clubId)) {
    redirect("/sin-acceso");
  }
  return sesion;
}
