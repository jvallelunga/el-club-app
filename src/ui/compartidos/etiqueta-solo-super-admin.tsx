import { ShieldCheck } from "lucide-react";

/**
 * Marca, dentro del Panel del club, lo que solo ve el Super Admin (por
 * ejemplo, el editor del predio): el Admin del club no lo tiene.
 */
export function EtiquetaSoloSuperAdmin() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800">
      <ShieldCheck className="size-3" aria-hidden />
      Solo Super Admin
    </span>
  );
}
