import { cn } from "@/lib/utils";
import type { ClubEjemplo } from "./datos-ejemplo";

export function EscudoClub({
  club,
  tamano = "md",
}: {
  club: ClubEjemplo;
  tamano?: "sm" | "md" | "lg" | "xl";
}) {
  const medida =
    tamano === "xl"
      ? "size-28"
      : tamano === "lg"
        ? "size-16"
        : tamano === "sm"
          ? "size-10"
          : "size-12";
  const texto =
    tamano === "xl"
      ? "text-2xl"
      : tamano === "lg"
        ? "text-lg"
        : tamano === "sm"
          ? "text-xs"
          : "text-sm";

  return (
    <div
      className={cn(
        club.escudo
          ? "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-foreground/10"
          : "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10",
        medida,
      )}
    >
      {club.escudo ? (
        // Escudo de Los Cardos, copiado de los mocks de copa-raices.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={club.escudo}
          alt=""
          className="size-full object-contain p-0.5"
        />
      ) : (
        <span
          className={cn(
            "font-medium tracking-tight text-muted-foreground",
            texto,
          )}
        >
          {club.iniciales}
        </span>
      )}
    </div>
  );
}
