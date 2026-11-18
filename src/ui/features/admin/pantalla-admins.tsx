"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/ui/nativos/button";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/nativos/dialog";
import { BotonPrincipal } from "@/ui/compartidos/marco";
import { EscudoClub } from "@/ui/compartidos/escudo-club";
import {
  ShellAdmin,
  type RolShell,
} from "@/ui/compartidos/shell-admin";
import { avisoTrasInvitar } from "@/dominio/ingreso-email";
import { errorAlQuitarAdmin } from "@/dominio/permisos";
import { inicialesDesdeNombre } from "@/dominio/slug";

export type AdminVisible = {
  usuarioId: string;
  nombre: string;
  email: string;
};

export type InvitacionVisible = {
  id: string;
  email: string;
};

type ClubVisible = {
  id: string;
  slug: string;
  nombre: string;
  escudo: string | null;
};

export function PantallaAdminsReal({
  club,
  admins,
  invitaciones,
  usuarioId,
  rol,
  atras,
  esMultiClub = false,
  invitar,
  quitar,
  cancelar,
  reenviar,
}: {
  club: ClubVisible;
  admins: AdminVisible[];
  invitaciones: InvitacionVisible[];
  usuarioId: string;
  rol: RolShell;
  atras: { href: string; etiqueta: string };
  esMultiClub?: boolean;
  invitar: (
    email: string,
  ) => Promise<
    | {
        ok: true;
        aceptadaDeInmediato: boolean;
        linkEnviado: boolean;
        errorLink?: string;
      }
    | { ok: false; error: string }
  >;
  quitar: (usuarioId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  cancelar: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  reenviar: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const confirmarId = searchParams.get("confirmar");
  const [email, setEmail] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const aQuitar = useMemo(
    () => admins.find((admin) => admin.usuarioId === confirmarId) ?? null,
    [admins, confirmarId],
  );

  function limpiarConfirmar() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("confirmar");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function pedirQuitar(persona: AdminVisible) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("confirmar", persona.usuarioId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function confirmarQuitar() {
    if (!aQuitar || pending) return;
    const persona = aQuitar;
    startTransition(async () => {
      const resultado = await quitar(persona.usuarioId);
      if (!resultado.ok) {
        // Cerrar el diálogo: el error se muestra en la página y el overlay lo tapaba.
        setAviso(null);
        setError(resultado.error);
        limpiarConfirmar();
        return;
      }
      setError(null);
      setAviso(`Listo, ${persona.nombre} ya no es Admin de este club.`);
      limpiarConfirmar();
      router.refresh();
    });
  }

  function reenviarLink(invitacion: InvitacionVisible) {
    if (pending) return;
    startTransition(async () => {
      const resultado = await reenviar(invitacion.id);
      if (!resultado.ok) {
        setAviso(null);
        setError(resultado.error);
        return;
      }
      setError(null);
      setAviso(`Le mandamos el link a ${invitacion.email}.`);
    });
  }

  function cancelarInvitacion(invitacion: InvitacionVisible) {
    if (pending) return;
    startTransition(async () => {
      const resultado = await cancelar(invitacion.id);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setError(null);
      setAviso(`Cancelamos la invitación a ${invitacion.email}.`);
      router.refresh();
    });
  }

  function agregar(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = email.trim().toLowerCase();
    if (!valor || pending) return;
    setError(null);
    startTransition(async () => {
      const resultado = await invitar(valor);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setEmail("");
      const aviso = avisoTrasInvitar({
        email: valor,
        aceptadaDeInmediato: resultado.aceptadaDeInmediato,
        linkEnviado: resultado.linkEnviado,
        errorLink: resultado.errorLink,
      });
      if (resultado.linkEnviado) {
        setError(null);
        setAviso(aviso);
      } else {
        setAviso(null);
        setError(aviso);
      }
      router.refresh();
    });
  }

  const total = admins.length + invitaciones.length;
  const clubShell = {
    slug: club.slug,
    nombre: club.nombre,
    iniciales: inicialesDesdeNombre(club.nombre),
    escudo: club.escudo,
  };

  return (
    <ShellAdmin
      titulo="Admins"
      subtitulo={club.nombre}
      atras={atras}
      club={clubShell}
      rol={rol}
      activo="admins"
      esMultiClub={esMultiClub}
      salirEnMobile={false}
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <EscudoClub club={clubShell} />
          <div className="min-w-0">
            <p className="truncate font-medium">{club.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "Todavía no hay Admins"
                : total === 1
                  ? "1 Admin"
                  : `${total} Admins`}
            </p>
          </div>
        </div>

        <form onSubmit={agregar} className="flex flex-col gap-3">
          <Label htmlFor="email-admin" className="text-sm">
            Agregar Admin por email
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="email-admin"
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="nina.v@example.com"
              autoComplete="off"
              className="h-12 rounded-xl px-3 text-base sm:flex-1"
              required
            />
            <BotonPrincipal
              type="submit"
              disabled={!email.trim() || pending}
              className="sm:w-auto sm:px-6"
            >
              {pending ? "Agregando…" : "Agregar"}
            </BotonPrincipal>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Si esa persona todavía no entró, queda invitada y le mandamos un
            link por email para entrar. También puede pedirlo desde Ingresá.
          </p>
        </form>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {aviso ? (
          <p className="text-sm text-muted-foreground" role="status">
            {aviso}
          </p>
        ) : null}

        {admins.length === 0 && invitaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay Admins en este club.
          </p>
        ) : (
          <ul className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {admins.map((admin, indice) => (
              <li
                key={admin.usuarioId}
                className={
                  indice === 0 ? "flex items-center gap-3 px-3 py-3" : "flex items-center gap-3 border-t border-border px-3 py-3"
                }
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {inicialesDesdeNombre(admin.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{admin.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {admin.email}
                  </p>
                </div>
                {errorAlQuitarAdmin({
                  actorUsuarioId: usuarioId,
                  objetivoUsuarioId: admin.usuarioId,
                  cantidadAdmins: admins.length,
                }) ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 px-3 text-sm"
                    onClick={() => pedirQuitar(admin)}
                  >
                    Quitar
                  </Button>
                )}
              </li>
            ))}
            {invitaciones.map((invitacion) => (
              <li
                key={invitacion.id}
                className="flex items-center gap-3 border-t border-border px-3 py-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  @
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{invitacion.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invitación pendiente
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 px-3 text-sm"
                    onClick={() => reenviarLink(invitacion)}
                    disabled={pending}
                  >
                    Reenviar link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 px-3 text-sm"
                    onClick={() => cancelarInvitacion(invitacion)}
                    disabled={pending}
                  >
                    Cancelar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={Boolean(aQuitar)}
        onOpenChange={(abierto) => {
          if (!abierto) limpiarConfirmar();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Quitar a {aQuitar?.nombre}?</DialogTitle>
            <DialogDescription>
              Deja de ser Admin de {club.nombre}. Puede volver a serlo si lo
              agregás de nuevo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={limpiarConfirmar}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarQuitar}
              disabled={pending}
            >
              Quitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShellAdmin>
  );
}
