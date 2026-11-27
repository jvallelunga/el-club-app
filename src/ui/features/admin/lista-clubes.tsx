"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { ResultadoSimple } from "@/dominio/resultado";
import { DialogoConfirmar } from "@/ui/compartidos/dialogo-confirmar";
import { EscudoClub } from "@/ui/compartidos/escudo-club";
import { Button } from "@/ui/nativos/button";

export type ClubDeLaLista = {
  id: string;
  slug: string;
  nombre: string;
  iniciales: string;
  escudo: string | null;
  /** «Sin Admins», «1 Admin», «3 Admins». */
  textoAdmins: string;
};

/**
 * Los clubes del Panel del Super Admin: cada uno se edita, se entra o se
 * elimina (soft delete, con confirmación). Los eliminados quedan en «Ver
 * eliminados» y se pueden restaurar.
 */
export function ListaClubes({
  clubes,
  eliminados,
  eliminar,
  restaurar,
}: {
  clubes: ClubDeLaLista[];
  eliminados: ClubDeLaLista[];
  eliminar: (clubId: string) => Promise<ResultadoSimple>;
  restaurar: (clubId: string) => Promise<ResultadoSimple>;
}) {
  const router = useRouter();
  const [aEliminar, setAEliminar] = useState<ClubDeLaLista | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [eliminando, iniciarEliminar] = useTransition();
  const [verEliminados, setVerEliminados] = useState(false);
  const [restaurando, iniciarRestaurar] = useTransition();
  const [errorRestaurar, setErrorRestaurar] = useState<string | null>(null);

  function confirmarEliminar() {
    if (!aEliminar) return;
    const club = aEliminar;
    iniciarEliminar(async () => {
      const resultado = await eliminar(club.id);
      if (!resultado.ok) {
        setErrorEliminar(resultado.error);
        return;
      }
      setAEliminar(null);
      router.refresh();
    });
  }

  function restaurarClub(club: ClubDeLaLista) {
    setErrorRestaurar(null);
    iniciarRestaurar(async () => {
      const resultado = await restaurar(club.id);
      if (!resultado.ok) {
        setErrorRestaurar(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {clubes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay clubes. Creá el primero para empezar.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clubes.map((club) => (
            <li key={club.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <Link
                href={`/super-admin/clubes/${club.slug}/editar`}
                aria-label={`Editar ${club.nombre}`}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50"
              >
                <EscudoClub club={club} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{club.nombre}</p>
                  <p className="text-xs text-muted-foreground">{club.textoAdmins}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              <div className="flex border-t border-border">
                <Button asChild variant="ghost" className="h-11 flex-1 rounded-none text-sm">
                  <Link href={`/c/${club.slug}/admin`}>Entrar</Link>
                </Button>
                <div className="w-px bg-border" />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 flex-1 rounded-none text-sm text-destructive hover:text-destructive"
                  onClick={() => {
                    setErrorEliminar(null);
                    setAEliminar(club);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {eliminados.length > 0 ? (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            aria-expanded={verEliminados}
            className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setVerEliminados((valor) => !valor)}
          >
            {verEliminados ? "Ocultar" : "Ver"} eliminados ({eliminados.length})
          </button>
          {verEliminados ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {eliminados.map((club) => (
                <li key={club.id} className="flex items-center gap-3 px-3 py-3">
                  <EscudoClub club={club} tamano="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">{club.nombre}</p>
                    <p className="text-xs text-muted-foreground">Eliminado</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 text-sm"
                    disabled={restaurando}
                    onClick={() => restaurarClub(club)}
                  >
                    Restaurar
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          {errorRestaurar ? <p className="text-sm text-destructive">{errorRestaurar}</p> : null}
        </section>
      ) : null}

      <DialogoConfirmar
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        titulo={`¿Eliminar ${aEliminar?.nombre ?? "el club"}?`}
        accion="Eliminar club"
        accionPendiente="Eliminando…"
        pendiente={eliminando}
        error={errorEliminar}
        onConfirmar={confirmarEliminar}
      >
        <p>
          Sus Admins dejan de verlo y de administrarlo, y su sitio deja de estar a la vista. Sus
          datos quedan guardados.
        </p>
        <p>Lo podés restaurar desde «Ver eliminados».</p>
      </DialogoConfirmar>
    </div>
  );
}
