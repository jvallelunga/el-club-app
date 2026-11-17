import { redirect } from "next/navigation";
import { Button } from "@/ui/nativos/button";
import { IconoGoogle } from "@/ui/features/mocks-roles/icono-google";
import {
  ContenidoMock,
  MarcoAcceso,
} from "@/ui/features/mocks-roles/marco-mock";
import { destinoTrasIngreso } from "@/dominio/permisos";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { cargarSesion } from "@/datos/consultas/sesion";

export const dynamic = "force-dynamic";

export default async function PaginaIngreso({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string; error?: string }>;
}) {
  const params = await searchParams;
  if (hayConfiguracionSupabase()) {
    const sesion = await cargarSesion();
    if (sesion) {
      redirect(
        destinoTrasIngreso({
          esSuperAdmin: sesion.esSuperAdmin,
          clubes: sesion.membresias,
          siguiente: params.siguiente,
        }),
      );
    }
  }

  const mensajeError =
    params.error === "google"
      ? "No se pudo entrar con Google. Probá de nuevo."
      : params.error === "config"
        ? "El ingreso todavía no está configurado."
        : null;

  return (
    <MarcoAcceso
      pie={null}
      panel={
        <div className="flex max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              El Club App
            </p>
            <p className="text-4xl font-medium tracking-tight">
              La app del club.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Para el administrador del club y, más adelante, el día a día.
            </p>
          </div>
        </div>
      }
    >
      <ContenidoMock className="justify-center gap-8 py-10 md:px-0 md:py-0">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-muted-foreground lg:hidden">
            El Club App
          </p>
          <h1 className="text-3xl font-medium tracking-tight">Ingresá</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Entrá con tu cuenta de Google. El Super Admin te da de alta con tu
            email: la primera vez que entres, ya tenés el club asignado.
          </p>
        </div>

        {mensajeError ? (
          <p className="text-sm text-destructive" role="alert">
            {mensajeError}
          </p>
        ) : null}

        <form action="/auth/google" method="post">
          {params.siguiente ? (
            <input type="hidden" name="siguiente" value={params.siguiente} />
          ) : null}
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full rounded-xl border-border bg-white text-base text-foreground hover:bg-muted"
          >
            <IconoGoogle className="size-5" />
            Continuar con Google
          </Button>
        </form>
      </ContenidoMock>
    </MarcoAcceso>
  );
}
