"use client";

/** PROTOTIPO (#26): barra flotante para cambiar de variante (también con ← y →). */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SelectorVariantes({
  variantes,
  actual,
}: {
  variantes: { clave: string; nombre: string }[];
  actual: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const i = Math.max(0, variantes.findIndex((v) => v.clave === actual));
  const ir = (delta: number) => {
    const v = variantes[(i + delta + variantes.length) % variantes.length];
    router.replace(`${ruta}?variant=${v.clave}`, { scroll: false });
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") ir(-1);
      if (e.key === "ArrowRight") ir(1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full bg-fuchsia-700 px-1.5 py-1.5 text-sm text-white shadow-2xl ring-2 ring-white">
      <button type="button" onClick={() => ir(-1)} className="rounded-full p-1.5 hover:bg-white/20" aria-label="Variante anterior">
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-2 font-medium whitespace-nowrap">
        {variantes[i].clave} · {variantes[i].nombre}
      </span>
      <button type="button" onClick={() => ir(1)} className="rounded-full p-1.5 hover:bg-white/20" aria-label="Variante siguiente">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
