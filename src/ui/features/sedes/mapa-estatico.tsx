import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  coordenadasDesdeLinkMaps,
  textoCoordenadas,
} from "@/dominio/maps";

/**
 * Mapa de vista previa estático (sin API ni claves).
 * Si el link trae coordenadas, se coloca un pin; si no, un estado vacío.
 */
export function MapaEstatico({
  link,
  direccion,
  className,
}: {
  link: string;
  direccion?: string;
  className?: string;
}) {
  const coords = coordenadasDesdeLinkMaps(link);
  const x = coords ? 18 + Math.abs((coords.lng + 180) % 37) * (64 / 37) : 50;
  const y = coords ? 20 + Math.abs((coords.lat + 90) % 19) * (52 / 19) : 48;

  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        <svg
          viewBox="0 0 320 200"
          className="block h-44 w-full md:h-52"
          role="img"
          aria-label={
            coords
              ? `Vista previa de la ubicación${direccion ? `: ${direccion}` : ""}`
              : "Todavía no hay una ubicación para mostrar"
          }
        >
          <rect width="320" height="200" fill="var(--color-muted)" />
          <g stroke="var(--color-border)" strokeWidth="1" fill="none">
            <path d="M0 40 H320 M0 80 H320 M0 120 H320 M0 160 H320" />
            <path d="M40 0 V200 M80 0 V200 M140 0 V200 M200 0 V200 M260 0 V200" />
          </g>
          <path
            d="M0 92 C40 84, 70 110, 120 104 S200 70, 260 88 L320 96 V200 H0 Z"
            fill="color-mix(in oklch, var(--color-primary) 8%, var(--color-muted))"
          />
          <path
            d="M0 150 C60 140, 110 170, 180 158 S260 140, 320 150 V200 H0 Z"
            fill="color-mix(in oklch, var(--color-primary) 14%, var(--color-muted))"
          />
          <rect
            x="168"
            y="28"
            width="64"
            height="48"
            rx="8"
            fill="color-mix(in oklch, var(--color-primary) 12%, white)"
            stroke="var(--color-border)"
          />
          {coords ? (
            <g transform={`translate(${(x / 100) * 320} ${(y / 100) * 200})`}>
              <circle r="16" fill="var(--color-primary)" opacity="0.2" />
              <path
                d="M0 -16 C-8 -16 -14 -9 -14 -2 C-14 8 0 18 0 18 S14 8 14 -2 C14 -9 8 -16 0 -16 Z"
                fill="var(--color-primary)"
              />
              <circle cy="-5" r="4" fill="var(--color-primary-foreground)" />
            </g>
          ) : null}
        </svg>
        {!coords ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
            <MapPin className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Pegá un link de Google Maps para ver la ubicación
            </p>
          </div>
        ) : null}
      </div>
      {coords ? (
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          {direccion ? <span className="text-foreground">{direccion}. </span> : null}
          Vista de ejemplo (sin API de mapas) en {textoCoordenadas(coords)}.
          {link.trim() ? (
            <>
              {" "}
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-enlace underline-offset-2 hover:underline"
              >
                Abrir en Google Maps
              </a>
            </>
          ) : null}
        </figcaption>
      ) : (
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Usá un link de Google Maps que incluya las coordenadas (por ejemplo
          uno que termine en @lat,lng). Los links cortos no se pueden leer
          acá, porque no llamamos a ninguna API.
        </figcaption>
      )}
    </figure>
  );
}
