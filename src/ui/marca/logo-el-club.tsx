import { cn } from "@/lib/utils";

/** Ícono de producto (cuadrado redondeado naranja con el escudo-C). */
export function LogoElClub({
  className,
  titulo = "El Club App",
}: {
  className?: string;
  titulo?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG de marca, color fijo
    <img
      src="/marca/logo-icon.svg"
      alt={titulo}
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-[22%]", className)}
    />
  );
}

/** Ícono + nombre del producto, para cabeceras e ingreso genéricos. */
export function MarcaElClub({
  className,
  logoClassName,
  nombreClassName,
}: {
  className?: string;
  logoClassName?: string;
  nombreClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoElClub className={logoClassName} />
      <span className={cn("font-medium tracking-tight", nombreClassName)}>
        El Club App
      </span>
    </span>
  );
}
