import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/ui/nativos/button";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { Separator } from "@/ui/nativos/separator";
import { IconoGoogle } from "@/ui/features/mocks-roles/icono-google";
import {
  BotonPrincipal,
  ContenidoMock,
  MarcoAcceso,
} from "@/ui/features/mocks-roles/marco-mock";
import { emailValido, normalizarEmail } from "@/dominio/email";
import { MarcaElClub } from "@/ui/marca/logo-el-club";
import { destinoTrasIngreso } from "@/dominio/permisos";
import { hayConfiguracionSupabase } from "@/datos/env-supabase";
import { cargarSesion } from "@/datos/consultas/sesion";

export const dynamic = "force-dynamic";

function mensajeError(codigo: string | undefined): string | null {
  if (codigo === "google") return "No se pudo entrar con Google. Probá de nuevo.";
  if (codigo === "link") {
    return "No se pudo enviar o usar el link. Esperá un rato y probá de nuevo.";
  }
  if (codigo === "ingreso") return "No se pudo entrar. Probá de nuevo.";
  if (codigo === "email") return "Revisá el email: no se ve válido.";
  if (codigo === "config") return "El ingreso todavía no está configurado.";
  return null;
}

export default async function PaginaIngreso({
  searchParams,
}: {
  searchParams: Promise<{
    siguiente?: string;
    error?: string;
    enviado?: string;
    email?: string;
  }>;
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

  const error = mensajeError(params.error);
  const emailEnviado =
    params.enviado === "1" && params.email && emailValido(params.email)
      ? normalizarEmail(params.email)
      : params.enviado === "1"
        ? "tu email"
        : null;

  const ingresoBase = params.siguiente
    ? `/ingreso?siguiente=${encodeURIComponent(params.siguiente)}`
    : "/ingreso";

  return (
    <MarcoAcceso
      pie={null}
      panel={
        <div className="flex max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-3">
            <MarcaElClub nombreClassName="text-sm font-medium tracking-wide text-muted-foreground" />
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
          <MarcaElClub
            className="lg:hidden"
            nombreClassName="text-sm font-medium tracking-wide text-muted-foreground"
          />
          <h1 className="text-3xl font-medium tracking-tight">Ingresá</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Entrá con tu email o con Google. El Super Admin te da de alta con
            tu email: la primera vez que entres, ya tenés el club asignado.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {emailEnviado ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" role="status">
              Te mandamos un link a{" "}
              <span className="font-medium">{emailEnviado}</span>.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Revisá tu correo (también el spam). El link vence en una hora y
              se usa una sola vez. Si no llega, esperá un rato y volvé a
              pedirlo.
            </p>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-xl text-base"
            >
              <Link href={ingresoBase}>Usar otro email</Link>
            </Button>
          </div>
        ) : (
          <form action="/auth/email" method="post" className="flex flex-col gap-3">
            {params.siguiente ? (
              <input type="hidden" name="siguiente" value={params.siguiente} />
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-ingreso" className="text-sm">
                Email
              </Label>
              <Input
                id="email-ingreso"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="tu@email.com"
                aria-invalid={params.error === "email"}
                className="h-12 rounded-xl px-3 text-base"
              />
            </div>
            <BotonPrincipal type="submit">Enviarme el link</BotonPrincipal>
          </form>
        )}

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            o
          </p>
          <Separator className="flex-1" />
        </div>

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
