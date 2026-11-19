"use client";

/** PROTOTIPO (#54): piezas chicas que comparten las variantes. Se tira con los mocks. */

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bike,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  Goal,
  Medal,
  Mountain,
  Sailboat,
  Target,
  Trophy,
  Volleyball,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/ui/nativos/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/nativos/dialog";
import { cn } from "@/lib/utils";
import type { Campo, Chequeo, Deporte } from "./datos";
import { CAMPOS, nuevoChequeo } from "./datos";

// ---------- barra flotante del prototipo ----------

export function SelectorPrototipo({
  variantes,
  pantallas,
}: {
  variantes: { clave: string; nombre: string }[];
  pantallas: { clave: string; nombre: string }[];
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const variante = params.get("variant") ?? variantes[0].clave;
  const pantalla = params.get("pantalla") ?? pantallas[0].clave;
  const i = Math.max(0, variantes.findIndex((v) => v.clave === variante));

  const ir = (v: string, p: string) => router.replace(`${ruta}?variant=${v}&pantalla=${p}`, { scroll: false });
  const mover = (delta: number) => ir(variantes[(i + delta + variantes.length) % variantes.length].clave, pantalla);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-2xl bg-fuchsia-700 p-1.5 text-sm text-white shadow-2xl ring-2 ring-white">
      <div className="flex items-center">
        <button type="button" onClick={() => mover(-1)} className="rounded-full p-1.5 hover:bg-white/20" aria-label="Variante anterior">
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-1 font-medium whitespace-nowrap">
          {variantes[i].clave} · {variantes[i].nombre}
        </span>
        <button type="button" onClick={() => mover(1)} className="rounded-full p-1.5 hover:bg-white/20" aria-label="Variante siguiente">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="flex gap-0.5 rounded-full bg-white/10 p-0.5">
        {pantallas.map((p) => (
          <button
            key={p.clave}
            type="button"
            onClick={() => ir(variante, p.clave)}
            className={cn("rounded-full px-2.5 py-1 text-xs whitespace-nowrap", p.clave === pantalla ? "bg-white text-fuchsia-800" : "hover:bg-white/20")}
          >
            {p.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- confirmación (regla de la app: todo borrado se confirma) ----------

export function Confirmar({
  abierto,
  titulo,
  children,
  accion,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  children: React.ReactNode;
  accion: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-col gap-2">{children}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirmar();
              onCerrar();
            }}
          >
            {accion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- íconos ----------

export const SET_ICONOS: Record<string, LucideIcon> = {
  goal: Goal,
  hockey: Dumbbell,
  volleyball: Volleyball,
  target: Target,
  waves: Waves,
  trophy: Trophy,
  bike: Bike,
  medal: Medal,
  footprints: Footprints,
  sailboat: Sailboat,
  mountain: Mountain,
};

export function IconoSet({ clave, className }: { clave: string; className?: string }) {
  const I = SET_ICONOS[clave] ?? Trophy;
  return <I className={className} />;
}

export function IconoSubido({ deporte, className }: { deporte: Deporte; className?: string }) {
  const ini = deporte.nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white", className)}
      style={{ background: deporte.color }}
    >
      {ini}
    </span>
  );
}

// ---------- valores de un chequeo ----------

const claseCampo = "h-8 rounded-md border border-border bg-background px-2 text-sm";

export function SelectorCampo({ valor, onChange, className }: { valor: Campo; onChange: (c: Chequeo) => void; className?: string }) {
  return (
    <select className={cn(claseCampo, className)} value={valor} onChange={(e) => onChange(nuevoChequeo(e.target.value as Campo))}>
      {CAMPOS.map((c) => (
        <option key={c.campo} value={c.campo}>
          {c.etiqueta}
        </option>
      ))}
    </select>
  );
}

const num = (v: string) => (v === "" ? undefined : Number(v));

export function ValorChequeo({ ch, onChange }: { ch: Chequeo; onChange: (c: Chequeo) => void }) {
  if (ch.campo === "sexo") {
    return (
      <select className={claseCampo} value={ch.valor} onChange={(e) => onChange({ ...ch, valor: e.target.value as "M" | "F" })}>
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
      </select>
    );
  }
  const placeholder = ch.campo === "edad" ? ["—", "—"] : ["año", "año"];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      desde
      <input
        type="number"
        className={cn(claseCampo, "w-20")}
        placeholder={placeholder[0]}
        value={ch.desde ?? ""}
        onChange={(e) => onChange({ ...ch, desde: num(e.target.value) })}
      />
      hasta
      <input
        type="number"
        className={cn(claseCampo, "w-20")}
        placeholder={placeholder[1]}
        value={ch.hasta ?? ""}
        onChange={(e) => onChange({ ...ch, hasta: num(e.target.value) })}
      />
      {ch.campo === "edad" ? "años" : null}
    </span>
  );
}

export const claseInput = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm";
