"use client";

/** PROTOTIPO (#26): piezas chicas que comparten las variantes. */

import { ArrowDown, ArrowUp, Check, Circle, Save, Trash2, X } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { type Elemento, TIPOS, etiqueta, numeros, tipoDe, ubicado } from "./datos";
import type { EstadoPredio } from "./estado";

const campo =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-foreground/40";

export function Propiedades({ estado, compacto = false }: { estado: EstadoPredio; compacto?: boolean }) {
  const el = estado.seleccionado;
  if (!el) {
    return (
      <p className="text-sm text-muted-foreground">
        Tocá algo en el mapa para ver sus propiedades.
      </p>
    );
  }
  const def = tipoDe(el.tipo);
  const n = numeros(estado.elementos).get(el.id);
  const set = (c: Partial<Elemento>) => estado.actualizar(el.id, c);
  return (
    <div className={`flex flex-col gap-3 ${compacto ? "" : "sm:gap-4"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {def.clase === "instalacion" ? "Instalación" : "Elemento de referencia"} · {def.nombre}
          </p>
          <p className="font-medium">
            {n ? <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#ffd23f] text-xs text-black">{n}</span> : null}
            {etiqueta(el)}
          </p>
        </div>
        <button type="button" onClick={() => estado.setSeleccion(null)} className="text-muted-foreground" aria-label="Cerrar">
          <X className="size-4" />
        </button>
      </div>

      <div className={`grid gap-3 ${compacto ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
        {def.clase === "referencia" ? (
          <label className="col-span-2 flex flex-col gap-1 text-xs text-muted-foreground">
            Nombre (opcional)
            <input className={campo} value={el.nombre ?? ""} placeholder="Por ejemplo «El ombú»" onChange={(e) => set({ nombre: e.target.value || undefined })} />
          </label>
        ) : null}
        <label className="col-span-2 flex flex-col gap-1 text-xs text-muted-foreground">
          Descripción (opcional, se ve en la leyenda)
          <input className={campo} maxLength={280} value={el.descripcion ?? ""} placeholder="Por ejemplo «En homenaje a…»" onChange={(e) => set({ descripcion: e.target.value || undefined })} />
        </label>
        {!el.puntos ? (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Rotación
            <span className="flex items-center gap-1">
              <input className={campo} type="number" value={Math.round(el.rot ?? 0)} onChange={(e) => set({ rot: Number(e.target.value) })} />°
            </span>
          </label>
        ) : null}
        {def.medidas.map((md) => (
          <label key={md.clave} className="flex flex-col gap-1 text-xs text-muted-foreground">
            {md.etiqueta}
            <span className="flex items-center gap-1">
              <input
                className={campo}
                type="number"
                value={el.medidas[md.clave] ?? 0}
                onChange={(e) => set({ medidas: { ...el.medidas, [md.clave]: Number(e.target.value) } })}
              />
              {md.unidad}
            </span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={el.enLeyenda} onChange={(e) => set({ enLeyenda: e.target.checked })} className="size-4" />
          Mostrar en la leyenda (con número)
        </label>
        <Button variant="ghost" className="h-9 text-destructive" onClick={() => estado.quitar(el.id)}>
          <Trash2 className="size-4" />
          {def.clase === "instalacion" ? "Quitar del predio" : "Borrar"}
        </Button>
      </div>
      {el.puntos ? (
        <p className="text-xs text-muted-foreground">
          En la versión real, los vértices del {def.nombre.toLowerCase()} se arrastran uno por uno (Terra Draw).
        </p>
      ) : null}
    </div>
  );
}

export function ListaInstalaciones({ estado }: { estado: EstadoPredio }) {
  const inst = estado.elementos.filter((e) => e.clase === "instalacion");
  return (
    <ul className="flex flex-col gap-0.5">
      {inst.map((el) => {
        const ok = ubicado(el);
        return (
          <li key={el.id}>
            <button
              type="button"
              onClick={() => (ok ? estado.setSeleccion(el.id) : estado.ubicar(el.id))}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted ${estado.seleccion === el.id ? "bg-muted font-medium" : ""}`}
            >
              {ok ? <Check className="size-3.5 text-emerald-600" /> : <Circle className="size-3.5 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate">{el.nombre}</span>
              {!ok ? <span className="text-xs text-muted-foreground">Ubicar</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PaletaReferencias({ estado, columnas = 2 }: { estado: EstadoPredio; columnas?: number }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
      {TIPOS.filter((t) => t.clase === "referencia").map((t) => (
        <button
          key={t.clave}
          type="button"
          onClick={() => estado.agregarReferencia(t.clave)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-left text-sm hover:bg-muted"
        >
          <span className="w-5 text-center">{t.icono}</span>
          {t.nombre}
        </button>
      ))}
    </div>
  );
}

export function OrdenLeyenda({ estado }: { estado: EstadoPredio }) {
  const nums = numeros(estado.elementos);
  const enLey = estado.elementos.filter((e) => nums.has(e.id));
  return (
    <ol className="flex flex-col gap-0.5">
      {enLey.map((el, i) => (
        <li key={el.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${estado.seleccion === el.id ? "bg-muted" : ""}`}>
          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background">{nums.get(el.id)}</span>
          <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => estado.setSeleccion(el.id)}>
            {etiqueta(el)}
          </button>
          <button type="button" disabled={i === 0} onClick={() => estado.moverEnLeyenda(el.id, -1)} className="text-muted-foreground disabled:opacity-30" aria-label="Subir">
            <ArrowUp className="size-3.5" />
          </button>
          <button type="button" disabled={i === enLey.length - 1} onClick={() => estado.moverEnLeyenda(el.id, 1)} className="text-muted-foreground disabled:opacity-30" aria-label="Bajar">
            <ArrowDown className="size-3.5" />
          </button>
        </li>
      ))}
    </ol>
  );
}

export function BotonGuardar({ estado }: { estado: EstadoPredio }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">
        {estado.cambios
          ? "Cambios sin guardar"
          : estado.guardadoEn
            ? `Guardado ${estado.guardadoEn.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
            : "Sin cambios"}
      </span>
      <Button className="h-9 rounded-lg" disabled={!estado.cambios} onClick={estado.guardar}>
        <Save className="size-4" />
        Guardar
      </Button>
    </div>
  );
}

export function FichaLeyenda({ el, n, onCerrar }: { el: Elemento; n: number; onCerrar: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ffd23f] font-bold text-black">{n}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{etiqueta(el)}</p>
        <p className="text-xs text-muted-foreground">{tipoDe(el.tipo).nombre}</p>
        {el.descripcion ? <p className="mt-1.5 text-sm leading-relaxed">{el.descripcion}</p> : null}
      </div>
      <button type="button" onClick={onCerrar} className="text-muted-foreground" aria-label="Cerrar">
        <X className="size-4" />
      </button>
    </div>
  );
}
