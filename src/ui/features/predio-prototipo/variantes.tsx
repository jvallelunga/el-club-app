"use client";

/**
 * PROTOTIPO (#26): variantes del bloque «Predio» dentro de la pantalla de la sede.
 * Editor (Super Admin): A, B, C. Visor (Admin): D, E.
 */

import dynamic from "next/dynamic";
import { useState } from "react";
import { Box, Expand, Map as IconoMapa, MousePointer2, Pencil, Shrink, Trees } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { etiqueta, numeros, tipoDe, ubicado } from "./datos";
import { type EstadoPredio, useEstadoPredio } from "./estado";
import {
  BotonGuardar,
  FichaLeyenda,
  ListaInstalaciones,
  OrdenLeyenda,
  PaletaReferencias,
  Propiedades,
} from "./piezas";

const Mapa2D = dynamic(() => import("./mapa-2d").then((m) => m.Mapa2D), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});
const Visor3D = dynamic(() => import("./visor-3d").then((m) => m.Visor3D), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

function Titulo({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-medium tracking-tight">Predio</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
      {extra}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
      {children}
    </div>
  );
}

function Interruptor2D3D({ modo, setModo }: { modo: "2d" | "3d"; setModo: (m: "2d" | "3d") => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
      {(["2d", "3d"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setModo(m)}
          className={`rounded-md px-3 py-1 ${modo === m ? "bg-foreground text-background" : "text-muted-foreground"}`}
        >
          {m.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** En el celular el Super Admin también ve solo el visor. */
function SoloEscritorio({ estado, children }: { estado: EstadoPredio; children: React.ReactNode }) {
  return (
    <>
      <div className="hidden lg:block">{children}</div>
      <div className="lg:hidden">
        <VisorD estado={estado} nota="El predio se edita desde una computadora." />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// A · Fiel al frame: lista a la izquierda, mapa, propiedades abajo.
// ---------------------------------------------------------------------------

export function EditorA() {
  const estado = useEstadoPredio();
  const [modo, setModo] = useState<"2d" | "3d">("2d");
  return (
    <SoloEscritorio estado={estado}>
      <section className="flex flex-col gap-4">
        <Titulo extra={<div className="flex items-center gap-3"><Interruptor2D3D modo={modo} setModo={setModo} /><BotonGuardar estado={estado} /></div>}>
          Dibujá el área sobre el mapa satelital y ubicá las instalaciones de la sede y los elementos de referencia.
        </Titulo>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[260px_1fr]">
            <aside className="flex max-h-[600px] flex-col gap-5 overflow-y-auto border-r border-border p-4">
              <Seccion titulo="Paso 1 · Área">
                <Button variant={estado.dibujandoArea ? "default" : "outline"} className="h-9 justify-start rounded-lg" onClick={() => estado.setDibujandoArea(!estado.dibujandoArea)}>
                  <Pencil className="size-4" />
                  {estado.dibujandoArea ? "Listo" : "Editar área del predio"}
                </Button>
              </Seccion>
              <Seccion titulo="Instalaciones de la sede">
                <ListaInstalaciones estado={estado} />
              </Seccion>
              <Seccion titulo="Elementos de referencia">
                <PaletaReferencias estado={estado} />
              </Seccion>
              <Seccion titulo="Leyenda">
                <OrdenLeyenda estado={estado} />
              </Seccion>
            </aside>
            <div className="h-[600px]">
              {modo === "2d" ? (
                <Mapa2D estado={estado} className="size-full" />
              ) : (
                <Visor3D elementos={estado.elementos} area={estado.area} seleccion={estado.seleccion} onElegir={estado.setSeleccion} className="size-full" />
              )}
            </div>
          </div>
          <div className="border-t border-border p-4">
            <Propiedades estado={estado} />
          </div>
        </div>
      </section>
    </SoloEscritorio>
  );
}

// ---------------------------------------------------------------------------
// B · Vista previa en la sede; se edita a pantalla completa con paneles flotantes.
// ---------------------------------------------------------------------------

export function EditorB() {
  const estado = useEstadoPredio();
  const [abierto, setAbierto] = useState(false);
  const [herramienta, setHerramienta] = useState<"mover" | "area" | "refs">("mover");
  const sinUbicar = estado.elementos.filter((e) => e.clase === "instalacion" && !ubicado(e));

  if (!abierto) {
    return (
      <SoloEscritorio estado={estado}>
        <section className="flex flex-col gap-4">
          <Titulo extra={<Button className="h-11 rounded-xl px-4" onClick={() => setAbierto(true)}><Expand className="size-4" />Editar predio</Button>}>
            Así lo ven los Admins del club. Para editarlo se abre el mapa a pantalla completa.
          </Titulo>
          <div className="h-[420px] overflow-hidden rounded-2xl border border-border">
            <Visor3D elementos={estado.elementos} area={estado.area} className="size-full" />
          </div>
          {sinUbicar.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {sinUbicar.length} instalaciones sin ubicar: {sinUbicar.map((e) => e.nombre).join(", ")}.
            </p>
          ) : null}
        </section>
      </SoloEscritorio>
    );
  }

  const herramientas = [
    { clave: "mover" as const, icono: MousePointer2, etiqueta: "Mover y elegir" },
    { clave: "area" as const, icono: Pencil, etiqueta: "Área del predio" },
    { clave: "refs" as const, icono: Trees, etiqueta: "Elementos de referencia" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <Mapa2D estado={estado} className="size-full" controles="bottom-right" />
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-4 rounded-2xl bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <div>
          <p className="text-xs text-muted-foreground">Sede Los Cardos · Editor de predio</p>
          <p className="font-medium">Predio</p>
        </div>
        <div className="flex items-center gap-3">
          <BotonGuardar estado={estado} />
          <Button variant="outline" className="h-9 rounded-lg" onClick={() => setAbierto(false)}>
            <Shrink className="size-4" />
            Cerrar
          </Button>
        </div>
      </div>

      <div className="absolute left-4 top-24 flex flex-col gap-1 rounded-2xl bg-background/95 p-1.5 shadow-lg">
        {herramientas.map((h) => (
          <button
            key={h.clave}
            type="button"
            title={h.etiqueta}
            onClick={() => {
              setHerramienta(h.clave);
              estado.setDibujandoArea(h.clave === "area");
            }}
            className={`flex size-10 items-center justify-center rounded-xl ${herramienta === h.clave ? "bg-foreground text-background" : "hover:bg-muted"}`}
          >
            <h.icono className="size-5" />
          </button>
        ))}
      </div>

      {herramienta === "refs" ? (
        <div className="absolute left-20 top-24 w-64 rounded-2xl bg-background/95 p-3 shadow-lg">
          <Seccion titulo="Agregar elemento de referencia">
            <PaletaReferencias estado={estado} columnas={1} />
          </Seccion>
        </div>
      ) : herramienta === "area" ? (
        <div className="absolute left-20 top-24 w-64 rounded-2xl bg-background/95 p-3 text-sm shadow-lg">
          Arrastrá los vértices amarillos. En la versión real se agregan vértices tocando el borde.
        </div>
      ) : null}

      {estado.seleccionado ? (
        <div className="absolute bottom-36 right-4 top-24 w-80 overflow-y-auto rounded-2xl bg-background/95 p-4 shadow-lg">
          <Propiedades estado={estado} compacto />
          <div className="mt-5 border-t border-border pt-4">
            <Seccion titulo="Leyenda">
              <OrdenLeyenda estado={estado} />
            </Seccion>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-20 left-4 right-16 flex items-center gap-2 overflow-x-auto rounded-2xl bg-background/95 p-2 shadow-lg">
        <span className="shrink-0 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Instalaciones</span>
        {estado.elementos
          .filter((e) => e.clase === "instalacion")
          .map((el) => {
            const ok = ubicado(el);
            return (
              <button
                key={el.id}
                type="button"
                onClick={() => (ok ? estado.setSeleccion(el.id) : estado.ubicar(el.id))}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${ok ? "border-border" : "border-dashed border-amber-500 text-amber-700"} ${estado.seleccion === el.id ? "bg-foreground text-background" : ""}`}
              >
                {tipoDe(el.tipo).icono} {el.nombre}
                {!ok ? " · ubicar" : ""}
              </button>
            );
          })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C · 2D y 3D lado a lado, con una tabla de todo lo ubicado.
// ---------------------------------------------------------------------------

export function EditorC() {
  const estado = useEstadoPredio();
  const nums = numeros(estado.elementos);
  const filas = estado.elementos;
  return (
    <SoloEscritorio estado={estado}>
      <section className="flex flex-col gap-4">
        <Titulo extra={<BotonGuardar estado={estado} />}>
          A la izquierda ubicás sobre el satelital; a la derecha ves el resultado en 3D mientras editás.
        </Titulo>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative h-[480px] overflow-hidden rounded-2xl border border-border">
            <Mapa2D estado={estado} className="size-full" />
            <div className="absolute left-3 top-3 flex gap-1.5">
              <Button size="sm" variant={estado.dibujandoArea ? "default" : "secondary"} className="rounded-lg" onClick={() => estado.setDibujandoArea(!estado.dibujandoArea)}>
                <Pencil className="size-3.5" />
                Área
              </Button>
            </div>
          </div>
          <div className="h-[480px] overflow-hidden rounded-2xl border border-border">
            <Visor3D elementos={estado.elementos} area={estado.area} seleccion={estado.seleccion} onElegir={estado.setSeleccion} className="size-full" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Agregar:</span>
          <div className="flex-1">
            <PaletaReferencias estado={estado} columnas={7} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">N°</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Medidas</th>
                <th className="px-3 py-2">Leyenda</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((el) => {
                const def = tipoDe(el.tipo);
                const ok = ubicado(el);
                return (
                  <tr key={el.id} onClick={() => ok && estado.setSeleccion(el.id)} className={`cursor-pointer ${estado.seleccion === el.id ? "bg-amber-50 dark:bg-amber-950/30" : "hover:bg-muted/40"}`}>
                    <td className="px-3 py-2">{nums.get(el.id) ?? "—"}</td>
                    <td className="px-3 py-2 font-medium">{etiqueta(el)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{def.icono} {def.nombre}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {def.medidas.map((m) => `${m.etiqueta} ${el.medidas[m.clave]}${m.unidad}`).join(" · ") || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={el.enLeyenda} onClick={(e) => e.stopPropagation()} onChange={(e) => estado.actualizar(el.id, { enLeyenda: e.target.checked })} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!ok ? (
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={(e) => { e.stopPropagation(); estado.ubicar(el.id); }}>
                          Ubicar
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {estado.seleccionado ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <Propiedades estado={estado} />
          </div>
        ) : null}
      </section>
    </SoloEscritorio>
  );
}

// ---------------------------------------------------------------------------
// D · Visor (Admin): 3D arriba, leyenda numerada abajo. Fiel al frame.
// ---------------------------------------------------------------------------

export function VisorD({ estado: externo, nota }: { estado?: EstadoPredio; nota?: string }) {
  const propio = useEstadoPredio();
  const estado = externo ?? propio;
  const [sel, setSel] = useState<string | null>(null);
  const nums = numeros(estado.elementos);
  const elSel = estado.elementos.find((e) => e.id === sel);
  return (
    <section className="flex flex-col gap-4">
      <Titulo>{nota ?? "Orbitá con el dedo o el mouse, acercate con zoom y tocá un número para ver qué es."}</Titulo>
      <div className="relative h-[380px] overflow-hidden rounded-2xl border border-border sm:h-[480px]">
        <Visor3D elementos={estado.elementos} area={estado.area} seleccion={sel} onElegir={setSel} className="size-full" />
        {elSel && nums.get(elSel.id) ? (
          <div className="absolute inset-x-3 bottom-3 sm:left-auto sm:w-96">
            <FichaLeyenda el={elSel} n={nums.get(elSel.id)!} onCerrar={() => setSel(null)} />
          </div>
        ) : null}
      </div>
      <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {estado.elementos
          .filter((e) => nums.has(e.id))
          .map((el) => (
            <li key={el.id}>
              <button type="button" onClick={() => setSel(el.id)} className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-muted ${sel === el.id ? "bg-muted" : ""}`}>
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{nums.get(el.id)}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{etiqueta(el)}</span>
                  {el.descripcion ? <span className="block text-sm text-muted-foreground">{el.descripcion}</span> : null}
                </span>
              </button>
            </li>
          ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------
// E · Visor (Admin): 3D grande con la leyenda como panel al costado.
// ---------------------------------------------------------------------------

export function VisorE() {
  const estado = useEstadoPredio();
  const [sel, setSel] = useState<string | null>(null);
  const nums = numeros(estado.elementos);
  return (
    <section className="flex flex-col gap-4">
      <Titulo>El predio de la sede. Tocá un número en el 3D o en la leyenda.</Titulo>
      <div className="grid overflow-hidden rounded-2xl border border-border lg:grid-cols-[1fr_300px]">
        <div className="relative h-[380px] lg:h-[560px]">
          <Visor3D elementos={estado.elementos} area={estado.area} seleccion={sel} onElegir={setSel} className="size-full" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs shadow">
            <Box className="size-3.5" /> 3D · arrastrá para girar
          </div>
        </div>
        <aside className="flex max-h-[560px] flex-col overflow-y-auto border-t border-border bg-card lg:border-l lg:border-t-0">
          <p className="sticky top-0 border-b border-border bg-card px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <IconoMapa className="mr-1.5 inline size-3.5" />
            Leyenda
          </p>
          {estado.elementos
            .filter((e) => nums.has(e.id))
            .map((el) => {
              const abierto = sel === el.id;
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => setSel(abierto ? null : el.id)}
                  className={`flex items-start gap-3 border-b border-border px-4 py-3 text-left ${abierto ? "bg-amber-50 dark:bg-amber-950/30" : "hover:bg-muted/50"}`}
                >
                  <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${abierto ? "bg-[#ffd23f] text-black" : "bg-foreground text-background"}`}>
                    {nums.get(el.id)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{etiqueta(el)}</span>
                    <span className="block text-xs text-muted-foreground">{tipoDe(el.tipo).nombre}</span>
                    {abierto && el.descripcion ? <span className="mt-1.5 block text-sm leading-relaxed">{el.descripcion}</span> : null}
                  </span>
                </button>
              );
            })}
        </aside>
      </div>
    </section>
  );
}
