"use client";

/** PROTOTIPO (#26): estado en memoria del editor de predio. Nada se guarda. */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AREA_INICIAL,
  ELEMENTOS_INICIALES,
  type Elemento,
  type Punto,
  tipoDe,
} from "./datos";

export type EstadoPredio = ReturnType<typeof useEstadoPredio>;

export function useEstadoPredio() {
  const [elementos, setElementos] = useState<Elemento[]>(ELEMENTOS_INICIALES);
  const [area, setArea] = useState<Punto[]>(AREA_INICIAL);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [cambios, setCambios] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);
  const [dibujandoArea, setDibujandoArea] = useState(false);

  const tocar = () => setCambios(true);

  useEffect(() => {
    if (!cambios) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [cambios]);

  const actualizar = useCallback((id: string, cambio: Partial<Elemento>) => {
    setElementos((els) => els.map((e) => (e.id === id ? { ...e, ...cambio } : e)));
    tocar();
  }, []);

  const mover = useCallback((id: string, x: number, y: number) => {
    setElementos((els) =>
      els.map((e) => {
        if (e.id !== id) return e;
        if (e.puntos) {
          const cx = e.puntos.reduce((s, p) => s + p[0], 0) / e.puntos.length;
          const cy = e.puntos.reduce((s, p) => s + p[1], 0) / e.puntos.length;
          return {
            ...e,
            puntos: e.puntos.map(([px, py]) => [px + x - cx, py + y - cy] as Punto),
          };
        }
        return { ...e, x, y };
      }),
    );
    tocar();
  }, []);

  const ubicar = useCallback((id: string, x = 40, y = -60) => {
    setElementos((els) =>
      els.map((e) => (e.id === id ? { ...e, x, y, rot: 47 } : e)),
    );
    setSeleccion(id);
    tocar();
  }, []);

  const quitar = useCallback((id: string) => {
    setElementos((els) =>
      els.flatMap((e) => {
        if (e.id !== id) return [e];
        // Una instalación vuelve a «sin ubicar»; un elemento de referencia se borra.
        if (e.clase === "instalacion") return [{ ...e, x: undefined, y: undefined }];
        return [];
      }),
    );
    setSeleccion(null);
    tocar();
  }, []);

  const agregarReferencia = useCallback((tipo: string, x = 40, y = -60) => {
    const def = tipoDe(tipo);
    const id = `n${Date.now()}`;
    const nuevo: Elemento = def.linea
      ? {
          id,
          clase: "referencia",
          tipo,
          enLeyenda: false,
          medidas: { ...def.porDefecto },
          puntos: [
            [x - 20, y],
            [x + 20, y],
          ],
        }
      : {
          id,
          clase: "referencia",
          tipo,
          enLeyenda: false,
          x,
          y,
          rot: 0,
          medidas: { ...def.porDefecto },
        };
    setElementos((els) => [...els, nuevo]);
    setSeleccion(id);
    tocar();
  }, []);

  const moverEnLeyenda = useCallback((id: string, delta: -1 | 1) => {
    setElementos((els) => {
      const enLey = els.filter((e) => e.enLeyenda);
      const i = enLey.findIndex((e) => e.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= enLey.length) return els;
      const a = els.indexOf(enLey[i]);
      const b = els.indexOf(enLey[j]);
      const copia = [...els];
      [copia[a], copia[b]] = [copia[b], copia[a]];
      return copia;
    });
    tocar();
  }, []);

  const moverVertice = useCallback((i: number, p: Punto) => {
    setArea((a) => a.map((v, k) => (k === i ? p : v)));
    tocar();
  }, []);

  const guardar = useCallback(() => {
    setCambios(false);
    setGuardadoEn(new Date());
  }, []);

  const seleccionado = useMemo(
    () => elementos.find((e) => e.id === seleccion) ?? null,
    [elementos, seleccion],
  );

  return {
    elementos,
    area,
    seleccion,
    seleccionado,
    cambios,
    guardadoEn,
    dibujandoArea,
    setDibujandoArea,
    setSeleccion,
    actualizar,
    mover,
    ubicar,
    quitar,
    agregarReferencia,
    moverEnLeyenda,
    moverVertice,
    guardar,
  };
}
