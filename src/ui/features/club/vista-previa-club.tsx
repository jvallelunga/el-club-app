"use client";

import type { ReactNode } from "react";
import { inicialesDesdeNombre } from "@/dominio/slug";
import {
  ESTADOS_SISTEMA,
  acentoVisible,
  textoConContrasteAA,
  type PaletaDerivada,
} from "@/dominio/paleta";

export function VistaPreviaClub({
  nombre,
  slug,
  escudo,
  paleta,
  dominioBase,
}: {
  nombre: string;
  slug: string;
  escudo: string | null;
  paleta: PaletaDerivada;
  dominioBase: string;
}) {
  const hayNombre = Boolean(nombre.trim());
  const visible = hayNombre ? nombre.trim() : "Nombre del club";
  const iniciales = hayNombre ? inicialesDesdeNombre(visible) || "?" : "?";
  const rival = "Rival de ejemplo";

  return (
    <aside className="flex flex-col gap-3">
      <p className="text-sm font-medium">Vista previa</p>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <EncabezadoPreview
          visible={visible}
          iniciales={iniciales}
          escudo={escudo}
          paleta={paleta}
        />
        <div className="flex flex-col gap-3 p-3" style={{ background: paleta.claro }}>
          <FilaColores paleta={paleta} />
          <div className="flex gap-2">
            <BotonMarca paleta={paleta} tono="marca">
              Ver club
            </BotonMarca>
            <BotonMarca paleta={paleta} tono="hover">
              Hover
            </BotonMarca>
            <BotonMarca paleta={paleta} tono="pressed">
              Pressed
            </BotonMarca>
          </div>
          <TarjetaEjemplo
            visible={visible}
            rival={rival}
            paleta={paleta}
            variante="clara"
          />
          <TarjetaEjemplo
            visible={visible}
            rival={rival}
            paleta={paleta}
            variante="oscura"
          />
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: paleta.textoSobreClaro, opacity: 0.7 }}
          >
            {dominioBase.trim()
              ? `App: admin.${dominioBase.trim()} y vivo.${dominioBase.trim()}`
              : `Sin dominio: /c/${slug || "identificador"}/admin`}
          </p>
        </div>
        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Estados del sistema (fijos)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(ESTADOS_SISTEMA).map((estado) => (
              <span
                key={estado.etiqueta}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                style={{ background: estado.claro, color: "#ffffff" }}
              >
                {estado.etiqueta}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function FilaColores({ paleta }: { paleta: PaletaDerivada }) {
  return (
    <div className="flex gap-1.5" aria-label="Paleta de hasta 3 colores">
      {paleta.colores.map((color, indice) => (
        <span
          key={`${color}-${indice}`}
          className="flex h-7 flex-1 flex-col overflow-hidden rounded-md ring-1 ring-black/10"
          title={`Color ${indice + 1}${paleta.explicitos[indice] ? "" : " (derivado)"}`}
        >
          <span className="min-h-0 flex-1" style={{ background: color }} />
          <span
            className="px-1 py-0.5 text-center text-[9px] leading-none"
            style={{
              background: paleta.claro,
              color: paleta.textoSobreClaro,
              opacity: 0.7,
            }}
          >
            {indice + 1}
            {paleta.explicitos[indice] ? "" : "*"}
          </span>
        </span>
      ))}
    </div>
  );
}

function EncabezadoPreview({
  visible,
  iniciales,
  escudo,
  paleta,
}: {
  visible: string;
  iniciales: string;
  escudo: string | null;
  paleta: PaletaDerivada;
}) {
  return (
    <div
      className="flex items-center gap-3 border-b-2 px-3 py-3"
      style={{
        background: paleta.marca,
        color: paleta.textoSobreMarca,
        borderColor: paleta.colores[1],
      }}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-black/10"
        style={{ borderRadius: escudo ? "0.6rem" : "9999px" }}
      >
        {escudo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={escudo} alt="" className="size-full object-contain p-0.5" />
        ) : (
          <span
            className="text-xs font-medium"
            style={{ color: paleta.marca }}
          >
            {iniciales}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{visible}</p>
        <p className="truncate text-[11px] opacity-80">Admin</p>
      </div>
    </div>
  );
}

function BotonMarca({
  paleta,
  tono,
  children,
}: {
  paleta: PaletaDerivada;
  tono: "marca" | "hover" | "pressed";
  children: ReactNode;
}) {
  const fondo =
    tono === "hover" ? paleta.hover : tono === "pressed" ? paleta.pressed : paleta.marca;
  const texto = textoConContrasteAA(fondo);
  return (
    <span
      className="inline-flex h-8 flex-1 items-center justify-center rounded-lg px-2 text-[11px] font-medium"
      style={{ background: fondo, color: texto }}
    >
      {children}
    </span>
  );
}


function TarjetaEjemplo({
  visible,
  rival,
  paleta,
  variante,
}: {
  visible: string;
  rival: string;
  paleta: PaletaDerivada;
  variante: "clara" | "oscura";
}) {
  const fondo = variante === "clara" ? paleta.claro : paleta.oscuro;
  const texto =
    variante === "clara" ? paleta.textoSobreClaro : paleta.textoSobreOscuro;
  const linea = acentoVisible(paleta.colores[1], fondo);
  const chipFondo = acentoVisible(paleta.colores[2], fondo);
  const chipTexto = textoConContrasteAA(chipFondo);
  const destacado = linea;

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-3"
      style={{
        background: fondo,
        color: texto,
        borderColor: variante === "clara" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)",
        boxShadow: `inset 3px 0 0 ${destacado}`,
      }}
    >
      <div
        className="h-0.5 w-full rounded-full"
        style={{ background: linea }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide uppercase opacity-70">
          Próximo partido
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase"
          style={{ background: chipFondo, color: chipTexto }}
        >
          En vivo
        </span>
      </div>
      <p className="text-sm font-medium leading-snug">
        {visible} vs {rival}
      </p>
      <p className="text-[11px] opacity-70">Sáb 15:00 · Cancha 1</p>
    </div>
  );
}
