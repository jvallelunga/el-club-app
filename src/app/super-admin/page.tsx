import Link from "next/link";
import { Plus } from "lucide-react";
import { BotonPrincipal } from "@/ui/compartidos/marco";
import {
  ShellAdmin,
} from "@/ui/compartidos/shell-admin";
import { Button } from "@/ui/nativos/button";
import { inicialesDesdeNombre } from "@/dominio/slug";
import { urlEscudoPublico } from "@/dominio/nuevo-club";
import { superAdminRequerido } from "@/datos/consultas/acceso";
import { panelesDeLaSesion } from "@/datos/consultas/paneles";
import { urlYClaveAnon } from "@/datos/env-supabase";
import {
  cantidadAdminsPorClub,
  listarClubes,
  listarClubesEliminados,
} from "@/datos/consultas/clubes";
import { eliminarClub, restaurarClub } from "@/datos/comandos/clubes";
import type { Club } from "@/datos/tipos";
import { ListaClubes, type ClubDeLaLista } from "@/ui/features/admin/lista-clubes";

export const dynamic = "force-dynamic";

function textoAdmins(cantidad: number): string {
  if (cantidad === 0) return "Sin Admins";
  if (cantidad === 1) return "1 Admin";
  return `${cantidad} Admins`;
}

const botonCrear = (
  <Button asChild className="h-10 rounded-lg px-3 text-sm">
    <Link href="/super-admin/nuevo-club">
      <Plus className="size-4" />
      Crear club
    </Link>
  </Button>
);

export default async function PaginaSuperAdmin() {
  const sesion = await superAdminRequerido("/super-admin");
  const paneles = await panelesDeLaSesion(sesion);
  const [clubes, eliminados] = await Promise.all([
    listarClubes(),
    listarClubesEliminados(),
  ]);
  const conteo = await cantidadAdminsPorClub(clubes.map((club) => club.id));
  const supabaseUrl = urlYClaveAnon().url;
  const clubDeLaLista = (club: Club): ClubDeLaLista => ({
    id: club.id,
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: urlEscudoPublico(supabaseUrl, club.escudo_ruta),
    textoAdmins: textoAdmins(conteo[club.id] ?? 0),
  });

  return (
    <ShellAdmin
      titulo="Clubes"
      subtitulo="Super Admin"
      tituloMobile="Super Admin"
      subtituloMobile="Todos los clubes"
      paneles={paneles}
      activo="clubes"
      accion={botonCrear}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium tracking-tight lg:hidden">
              Clubes
            </h1>
            <p className="text-sm text-muted-foreground">
              {clubes.length === 1 ? "1 club" : `${clubes.length} clubes`}
            </p>
          </div>
        </div>

        <div className="md:hidden">
          <BotonPrincipal asChild>
            <Link href="/super-admin/nuevo-club">
              <Plus className="size-4" />
              Crear club
            </Link>
          </BotonPrincipal>
        </div>

        <ListaClubes
          clubes={clubes.map(clubDeLaLista)}
          eliminados={eliminados.map(clubDeLaLista)}
          eliminar={eliminarClub}
          restaurar={restaurarClub}
        />
      </div>
    </ShellAdmin>
  );
}
