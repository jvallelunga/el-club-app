"use client";

import { useMemo, useState } from "react";
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
import type { ClubEjemplo, PersonaEjemplo } from "./datos-ejemplo";
import { BotonPrincipal, EtiquetaEjemplo } from "./marco-mock";
import { EscudoClub } from "./escudo-club";
import { RUTAS_MOCK } from "./datos-ejemplo";
import { ShellAdmin } from "./shell-admin";

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export function PantallaAdmins({
  club,
  adminsIniciales,
}: {
  club: ClubEjemplo;
  adminsIniciales: PersonaEjemplo[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const confirmarId = searchParams.get("confirmar");
  const emailInicial = searchParams.get("email") ?? "";

  const [admins, setAdmins] = useState<PersonaEjemplo[]>(adminsIniciales);
  const [email, setEmail] = useState(emailInicial);
  const [aviso, setAviso] = useState<string | null>(null);

  const aQuitar = useMemo(
    () => admins.find((admin) => admin.id === confirmarId) ?? null,
    [admins, confirmarId],
  );

  function limpiarConfirmar() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("confirmar");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function pedirQuitar(persona: PersonaEjemplo) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("confirmar", persona.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function cancelarQuitar() {
    limpiarConfirmar();
  }

  function confirmarQuitar() {
    if (!aQuitar) return;
    const nombre = aQuitar.nombre;
    setAdmins((actuales) => actuales.filter((admin) => admin.id !== aQuitar.id));
    setAviso(`Listo, ${nombre} ya no es Admin de este club.`);
    limpiarConfirmar();
  }

  function agregar(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = email.trim().toLowerCase();
    if (!valor) return;
    if (admins.some((admin) => admin.email.toLowerCase() === valor)) {
      setAviso("Ese email ya es Admin de este club.");
      return;
    }
    const local = valor.split("@")[0] ?? "admin";
    const nombre = local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(" ");
    const nuevo: PersonaEjemplo = {
      id: valor.replace(/[^a-z0-9]+/g, "-"),
      nombre: nombre || "Nueva persona",
      email: valor,
      esEjemplo: true,
    };
    setAdmins((actuales) => [...actuales, nuevo]);
    setEmail("");
    setAviso(
      `Agregamos a ${nuevo.nombre}. Cuando entre con Google, ya tiene el club.`,
    );
  }

  return (
    <ShellAdmin
      titulo="Admins"
      subtitulo={club.nombre}
      atras={{ href: RUTAS_MOCK.superAdmin, etiqueta: "Volver a clubes" }}
      club={club}
      rol="super-admin"
      activo="admins"
      como="super-admin"
      salirEnMobile={false}
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <EscudoClub club={club} />
          <div className="min-w-0">
            <p className="truncate font-medium">{club.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {admins.length === 0
                ? "Todavía no hay Admins"
                : admins.length === 1
                  ? "1 Admin"
                  : `${admins.length} Admins`}
              {club.esEjemplo ? (
                <>
                  {" "}
                  <EtiquetaEjemplo />
                </>
              ) : null}
            </p>
          </div>
        </div>

        <form onSubmit={agregar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="email-admin">Agregar por email</Label>
              <Input
                id="email-admin"
                type="email"
                name="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="email@ejemplo.com"
                autoComplete="off"
                className="h-12 rounded-xl px-3 text-base"
                required
              />
            </div>
            <BotonPrincipal
              type="submit"
              disabled={!email.trim()}
              className="md:w-auto md:px-5"
            >
              Agregar Admin
            </BotonPrincipal>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cuando esa persona entre con Google por primera vez, ya tiene el
            club asignado.
          </p>
        </form>

        {aviso ? (
          <p className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
            {aviso}
          </p>
        ) : null}

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Personas con acceso
          </h2>
          {admins.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Todavía no hay Admins en este club. Cargá un email para nombrar al
              primero.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {iniciales(admin.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">
                        {admin.nombre}
                      </p>
                      <EtiquetaEjemplo />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {admin.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 shrink-0 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => pedirQuitar(admin)}
                  >
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Dialog
        open={aQuitar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) cancelarQuitar();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2.5rem)] sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>¿Quitamos a {aQuitar?.nombre}?</DialogTitle>
            <DialogDescription>
              Va a dejar de poder entrar al admin de {club.nombre}. Si más
              adelante hace falta, se lo puede volver a agregar con el email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={cancelarQuitar}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              onClick={confirmarQuitar}
            >
              Quitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShellAdmin>
  );
}
