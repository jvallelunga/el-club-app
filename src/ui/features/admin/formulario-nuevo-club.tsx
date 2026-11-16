"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "@/ui/features/mocks-roles/marco-mock";
import { slugDesdeNombre } from "@/dominio/slug";

export function FormularioNuevoClubReal({
  crear,
}: {
  crear: (nombre: string) => Promise<{ ok: true; slug: string } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const slug = useMemo(() => slugDesdeNombre(nombre), [nombre]);

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nombre.trim() || !slug || pending) return;
    setError(null);
    startTransition(async () => {
      const resultado = await crear(nombre.trim());
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      const params = new URLSearchParams({
        nombre: nombre.trim(),
        slug: resultado.slug,
      });
      router.push(`/super-admin/nuevo-club/creado?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre-club" className="text-sm">
          Nombre
        </Label>
        <Input
          id="nombre-club"
          name="nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          placeholder="Nombre del club"
          autoComplete="off"
          className="h-12 rounded-xl px-3 text-base"
          required
        />
        {slug ? (
          <p className="text-xs text-muted-foreground">
            Identificador:{" "}
            <span className="font-medium text-foreground">{slug}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            El identificador se arma a partir del nombre, para las URLs.
          </p>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        El escudo, los colores y el dominio se definen después, en
        personalización. El dominio raíz del club queda para el sitio web; la
        app usa subdominios (admin, vivo).
      </p>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <BotonPrincipal type="submit" disabled={!nombre.trim() || pending}>
        {pending ? "Creando…" : "Crear club"}
      </BotonPrincipal>
    </form>
  );
}
