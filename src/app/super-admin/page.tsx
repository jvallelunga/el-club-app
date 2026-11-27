import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { EscudoClub } from "@/ui/compartidos/escudo-club";
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
} from "@/datos/consultas/clubes";

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
  const clubes = await listarClubes();
  const conteo = await cantidadAdminsPorClub(clubes.map((club) => club.id));
  const supabaseUrl = urlYClaveAnon().url;

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

        {clubes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay clubes. Creá el primero para empezar.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clubes.map((club) => {
              const cantidad = conteo[club.id] ?? 0;
              return (
                <li
                  key={club.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <Link
                    href={`/c/${club.slug}/admin`}
                    aria-label={`Entrar a ${club.nombre}`}
                    className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <EscudoClub
                      club={{
                        nombre: club.nombre,
                        iniciales: inicialesDesdeNombre(club.nombre),
                        escudo: urlEscudoPublico(supabaseUrl, club.escudo_ruta),
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{club.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {textoAdmins(cantidad)}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      Entrar
                      <ChevronRight className="size-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ShellAdmin>
  );
}
