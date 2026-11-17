"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { BotonPrincipal } from "@/ui/compartidos/marco";
import { MapaEstatico } from "./mapa-estatico";

const CAMPO = "h-12 rounded-xl px-3 text-base";

export type ResultadoGuardarSede =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export function FormularioSede({
  inicial,
  destino,
  destinoCreada,
  guardar,
}: {
  inicial?: { nombre: string; direccion: string; mapsUrl: string };
  destino: string;
  destinoCreada?: (id: string) => string;
  guardar: (formData: FormData) => Promise<ResultadoGuardarSede>;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [direccion, setDireccion] = useState(inicial?.direccion ?? "");
  const [mapsUrl, setMapsUrl] = useState(inicial?.mapsUrl ?? "");
  const [intento, setIntento] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        setErrorServidor(null);
        if (errorNombre) return;
        const formData = new FormData();
        formData.set("nombre", nombre);
        formData.set("direccion", direccion);
        formData.set("maps_url", mapsUrl);
        startTransition(async () => {
          const resultado = await guardar(formData);
          if (!resultado.ok) {
            setErrorServidor(resultado.error);
            return;
          }
          const url =
            resultado.id && destinoCreada
              ? destinoCreada(resultado.id)
              : destino;
          router.push(url);
          router.refresh();
        });
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
        {errorServidor ? (
          <p className="text-sm text-destructive" role="alert">
            {errorServidor}
          </p>
        ) : null}
        <div className="lg:hidden">
          <MapaEstatico link={preview.link} direccion={preview.direccion} />
        </div>
        <BotonPrincipal type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : inicial
              ? "Guardar sede"
              : "Crear sede"}
        </BotonPrincipal>
      </div>
      <div className="hidden lg:sticky lg:top-6 lg:block">
        <MapaEstatico link={preview.link} direccion={preview.direccion} />
      </div>
    </form>
  );
}
