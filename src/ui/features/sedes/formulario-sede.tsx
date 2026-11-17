"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "@/ui/features/mocks-roles/marco-mock";
import { MapaEstatico } from "./mapa-estatico";
import type { SedeEjemplo } from "./datos-ejemplo";

const CAMPO = "h-12 rounded-xl px-3 text-base";

export function FormularioSede({
  inicial,
  destino,
}: {
  inicial?: Pick<SedeEjemplo, "nombre" | "direccion" | "mapsUrl">;
  destino: string;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [direccion, setDireccion] = useState(inicial?.direccion ?? "");
  const [mapsUrl, setMapsUrl] = useState(inicial?.mapsUrl ?? "");
  const [intento, setIntento] = useState(false);

  const errorNombre = nombre.trim() ? null : "Poné un nombre para la sede.";
  const preview = useMemo(
    () => ({ link: mapsUrl, direccion }),
    [mapsUrl, direccion],
  );

  return (
    <form
      className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8"
      onSubmit={(evento) => {
        evento.preventDefault();
        setIntento(true);
        if (errorNombre) return;
        router.push(destino);
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sede-nombre" className="text-sm">
            Nombre
          </Label>
          <Input
            id="sede-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Campo de deportes"
            className={CAMPO}
            aria-invalid={intento && Boolean(errorNombre)}
          />
          {intento && errorNombre ? (
            <p className="text-sm text-destructive" role="alert">
              {errorNombre}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Cómo la van a reconocer en el club, por ejemplo «Campo de
              deportes» o «Sede social».
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sede-direccion" className="text-sm">
            Dirección{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="sede-direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle y número, ciudad"
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sede-maps" className="text-sm">
            Ubicación (link de Google Maps){" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="sede-maps"
            type="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://www.google.com/maps/@-34.60,-58.38,16z"
            className={CAMPO}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Pegá el link de la ubicación. Si trae coordenadas, mostramos una
            vista previa con un pin (sin usar la API de Google).
          </p>
        </div>
        <div className="lg:hidden">
          <MapaEstatico link={preview.link} direccion={preview.direccion} />
        </div>
        <BotonPrincipal type="submit">
          {inicial ? "Guardar sede" : "Crear sede"}
        </BotonPrincipal>
      </div>
      <div className="hidden lg:sticky lg:top-6 lg:block">
        <MapaEstatico link={preview.link} direccion={preview.direccion} />
      </div>
    </form>
  );
}
