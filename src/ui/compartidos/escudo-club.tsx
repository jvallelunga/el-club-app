import { cn } from "@/lib/utils";
import { inicialesDesdeNombre } from "@/dominio/slug";

export type ClubConEscudo = {
  nombre: string;
  escudo?: string | null;
  iniciales?: string;
};

export function EscudoClub({
  club,
  tamano = "md",
}: {
  club: ClubConEscudo;
  tamano?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const medida =
    tamano === "xl"
      ? "size-28"
      : tamano === "lg"
        ? "size-16"
        : tamano === "sm"
          ? "size-10"
          : tamano === "xs"
            ? "size-7"
            : "size-12";
  const texto =
    tamano === "xl"
      ? "text-2xl"
      : tamano === "lg"
        ? "text-lg"
        : tamano === "sm"
          ? "text-xs"
          : tamano === "xs"
            ? "text-[10px]"
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
          {club.iniciales ?? inicialesDesdeNombre(club.nombre)}
        </span>
      )}
    </div>
  );
}
