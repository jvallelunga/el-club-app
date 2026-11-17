"use client";

import { Input } from "@/ui/nativos/input";
import { Label } from "@/ui/nativos/label";
import { COLOR_CLARO_DEFAULT, normalizarHex } from "@/dominio/paleta";

export function CampoColor({
  id,
  etiqueta,
  valor,
  invalido,
  onChange,
  ayuda,
  opcional,
  sugerido,
  onQuitar,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  invalido?: boolean;
  onChange: (valor: string) => void;
  ayuda: string;
  opcional?: boolean;
  sugerido?: string;
  onQuitar?: () => void;
}) {
  const paraPicker =
    normalizarHex(valor) ?? normalizarHex(sugerido ?? "") ?? COLOR_CLARO_DEFAULT;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm">
          {etiqueta}{" "}
          {opcional ? (
            <span className="font-normal text-muted-foreground">(opcional)</span>
          ) : null}
        </Label>
        {onQuitar ? (
          <button
            type="button"
            onClick={onQuitar}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Quitar
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={paraPicker}
          onChange={(evento) => onChange(evento.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1"
        />
        <Input
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          placeholder={sugerido ?? "#ffffff"}
          spellCheck={false}
          aria-invalid={invalido}
          className="h-11 rounded-xl font-mono text-sm"
          aria-label={`${etiqueta} en hexadecimal`}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{ayuda}</p>
    </div>
  );
}
