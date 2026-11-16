"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "./marco-mock";
import { RUTAS_MOCK, slugDesdeNombre } from "./datos-ejemplo";

export function FormularioNuevoClub() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const slug = useMemo(() => slugDesdeNombre(nombre), [nombre]);

  function crear(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nombre.trim() || !slug) return;
    const params = new URLSearchParams({ nombre: nombre.trim(), slug });
    router.push(`${RUTAS_MOCK.nuevoClubCreado}?${params.toString()}`);
  }

  return (
    <form onSubmit={crear} className="flex flex-col gap-5">
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
            Identificador: <span className="font-medium text-foreground">{slug}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            El identificador se arma a partir del nombre, para las URLs.
          </p>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        El escudo, los colores y el dominio se definen después, en
        personalización.
      </p>

      <BotonPrincipal type="submit" disabled={!nombre.trim()}>
        Crear club
      </BotonPrincipal>
    </form>
  );
}
