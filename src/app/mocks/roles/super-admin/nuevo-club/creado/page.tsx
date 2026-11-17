"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import {
  CLUB_CREADO_EJEMPLO,
  RUTAS_MOCK,
} from "@/ui/features/mocks-roles/datos-ejemplo";
import {
  BotonPrincipal,
  EtiquetaEjemplo,
} from "@/ui/features/mocks-roles/marco-mock";
import { CLAVE_ESCUDO, VistaPreviaClub } from "@/ui/features/mocks-roles/formulario-nuevo-club";
import { ShellAdmin } from "@/ui/features/mocks-roles/shell-admin";
import { Button } from "@/ui/nativos/button";


function leerEscudoMock(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_ESCUDO);
  } catch {
    return null;
  }
}

function suscribirEscudoMock(alCambiar: () => void) {
  window.addEventListener("storage", alCambiar);
  return () => window.removeEventListener("storage", alCambiar);
}

function PaginaClubCreadoContenido() {
  const params = useSearchParams();
  const nombre = params.get("nombre")?.trim() || CLUB_CREADO_EJEMPLO.nombre;
  const slug = params.get("slug")?.trim() || CLUB_CREADO_EJEMPLO.slug;
  const primario = params.get("primario")?.trim() || CLUB_CREADO_EJEMPLO.primario;
  const secundario =
    params.get("secundario")?.trim() || CLUB_CREADO_EJEMPLO.secundario;
  const dominioBase = params.get("dominio")?.trim() ?? "";
  const escudo = useSyncExternalStore(
    suscribirEscudoMock,
    leerEscudoMock,
    () => null,
  );

  return (
    <ShellAdmin
      titulo="Club creado"
      atras={{ href: RUTAS_MOCK.superAdmin, etiqueta: "Volver a clubes" }}
      rol="super-admin"
      activo="clubes"
      salirEnMobile={false}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <CircleCheck className="size-6" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-medium tracking-tight">{nombre}</h1>
              <EtiquetaEjemplo />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              El club ya está creado. Identificador:{" "}
              <span className="font-medium text-foreground">{slug}</span>.
            </p>
            {dominioBase ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sitio web:{" "}
                <span className="font-medium text-foreground">{dominioBase}</span>
                . La app queda en{" "}
                <span className="font-medium text-foreground">
                  admin.{dominioBase}
                </span>{" "}
                y{" "}
                <span className="font-medium text-foreground">
                  vivo.{dominioBase}
                </span>
                .
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Todavía no tiene un dominio propio. Se entra por{" "}
                <span className="font-medium text-foreground">
                  /c/{slug}/admin
                </span>
                .
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ahora podés nombrar a sus Admins.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:max-w-sm">
            <BotonPrincipal asChild>
              <Link href={RUTAS_MOCK.admins(slug)}>Agregar Admins</Link>
            </BotonPrincipal>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-xl text-base"
            >
              <Link href={RUTAS_MOCK.superAdmin}>Ir a clubes</Link>
            </Button>
          </div>
        </div>
        <div className="w-full lg:w-72">
          <VistaPreviaClub
            nombre={nombre}
            slug={slug}
            escudo={escudo}
            primario={primario}
            secundario={secundario}
            dominioBase={dominioBase}
          />
        </div>
      </div>
    </ShellAdmin>
  );
}

export default function PaginaClubCreado() {
  return (
    <Suspense>
      <PaginaClubCreadoContenido />
    </Suspense>
  );
}
