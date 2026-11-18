"use client";

/**
 * PROTOTIPO (#26): mapa satelital 2D con MapLibre.
 * Usa las imágenes públicas de Esri solo para el mock (la decisión es la Map
 * Tiles API de Google, que necesita clave). El dibujo real va con Terra Draw;
 * acá se arrastran las huellas y los vértices a mano para ver cómo se siente.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapaML, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  aLngLat,
  aMetros,
  etiqueta,
  huella,
  numeros,
  ORIGEN,
  tipoDe,
  ubicado,
} from "./datos";
import type { EstadoPredio } from "./estado";

// Turbopack no resuelve el worker de MapLibre; para el mock va copiado en public/mocks/ (ruta pública del proxy).
maplibregl.setWorkerUrl("/mocks/maplibre-gl-worker.mjs");

const ESTILO: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satelital: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "satelital", type: "raster", source: "satelital" }],
};

function geojson(estado: EstadoPredio) {
  const features: GeoJSON.Feature[] = [];
  for (const el of estado.elementos) {
    if (!ubicado(el)) continue;
    const def = tipoDe(el.tipo);
    const props = {
      id: el.id,
      color: def.color,
      sel: el.id === estado.seleccion ? 1 : 0,
    };
    if (el.puntos) {
      features.push({
        type: "Feature",
        properties: { ...props, ancho: el.tipo === "camino" ? 4 : 2 },
        geometry: { type: "LineString", coordinates: el.puntos.map(aLngLat) },
      });
    } else {
      const anillo = huella(el).map(aLngLat);
      features.push({
        type: "Feature",
        properties: props,
        geometry: { type: "Polygon", coordinates: [[...anillo, anillo[0]]] },
      });
    }
  }
  return { type: "FeatureCollection" as const, features };
}

function geojsonArea(estado: EstadoPredio) {
  const anillo = estado.area.map(aLngLat);
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [[...anillo, anillo[0]]] },
  };
}

export function Mapa2D({
  estado,
  className = "",
  controles = "top-right",
}: {
  estado: EstadoPredio;
  className?: string;
  controles?: "top-right" | "bottom-right";
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaML | null>(null);
  const marcadores = useRef<maplibregl.Marker[]>([]);
  const ref = useRef(estado);
  useLayoutEffect(() => {
    ref.current = estado;
  });

  useEffect(() => {
    if (!contenedor.current) return;
    const m = new maplibregl.Map({
      container: contenedor.current,
      style: ESTILO,
      center: [ORIGEN.lng + 0.0004, ORIGEN.lat - 0.0003],
      zoom: 17.4,
      maxZoom: 19,
      bearing: -43,
      attributionControl: { compact: true },
    });
    mapa.current = m;
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), controles);

    m.on("load", () => {
      m.addSource("area", { type: "geojson", data: geojsonArea(ref.current) });
      m.addSource("elementos", { type: "geojson", data: geojson(ref.current) });
      m.addLayer({
        id: "area-borde",
        type: "line",
        source: "area",
        paint: { "line-color": "#ffd23f", "line-width": 3, "line-dasharray": [2, 1] },
      });
      m.addLayer({
        id: "area-relleno",
        type: "fill",
        source: "area",
        paint: { "fill-color": "#ffd23f", "fill-opacity": 0.06 },
      });
      m.addLayer({
        id: "el-relleno",
        type: "fill",
        source: "elementos",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", ["==", ["get", "sel"], 1], 0.75, 0.5],
        },
      });
      m.addLayer({
        id: "el-borde",
        type: "line",
        source: "elementos",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "line-color": ["case", ["==", ["get", "sel"], 1], "#ffffff", "#1d1d1d"],
          "line-width": ["case", ["==", ["get", "sel"], 1], 3, 1],
        },
      });
      m.addLayer({
        id: "el-linea",
        type: "line",
        source: "elementos",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": ["case", ["==", ["get", "sel"], 1], "#ffffff", ["get", "color"]],
          "line-width": ["get", "ancho"],
        },
      });

      let arrastrando: string | null = null;
      let desfase: [number, number] = [0, 0];
      const empezar = (e: maplibregl.MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        e.preventDefault();
        ref.current.setSeleccion(id);
        const el = ref.current.elementos.find((x) => x.id === id);
        const [px, py] = aMetros(e.lngLat.lng, e.lngLat.lat);
        let cx = el?.x ?? 0;
        let cy = el?.y ?? 0;
        if (el?.puntos) {
          cx = el.puntos.reduce((s, p) => s + p[0], 0) / el.puntos.length;
          cy = el.puntos.reduce((s, p) => s + p[1], 0) / el.puntos.length;
        }
        desfase = [cx - px, cy - py];
        arrastrando = id;
        m.dragPan.disable();
      };
      m.on("mousedown", "el-relleno", empezar);
      m.on("mousedown", "el-linea", empezar);
      m.on("mousemove", (e: MapMouseEvent) => {
        if (!arrastrando) return;
        const [px, py] = aMetros(e.lngLat.lng, e.lngLat.lat);
        ref.current.mover(arrastrando, px + desfase[0], py + desfase[1]);
      });
      m.on("mouseup", () => {
        arrastrando = null;
        m.dragPan.enable();
      });
      m.on("click", (e: MapMouseEvent) => {
        const hay = m.queryRenderedFeatures(e.point, {
          layers: ["el-relleno", "el-linea"],
        });
        if (hay.length === 0) ref.current.setSeleccion(null);
      });
      for (const capa of ["el-relleno", "el-linea"]) {
        m.on("mouseenter", capa, () => (m.getCanvas().style.cursor = "move"));
        m.on("mouseleave", capa, () => (m.getCanvas().style.cursor = ""));
      }
      sincronizar();
    });

    return () => {
      m.remove();
      mapa.current = null;
    };
    // El mapa se crea una sola vez; sincronizar() lo actualiza.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sincronizar() {
    const m = mapa.current;
    if (!m || !m.getSource("elementos")) return;
    const e = ref.current;
    (m.getSource("elementos") as GeoJSONSource | undefined)?.setData(geojson(e));
    (m.getSource("area") as GeoJSONSource | undefined)?.setData(geojsonArea(e));

    for (const mk of marcadores.current) mk.remove();
    marcadores.current = [];
    const nums = numeros(e.elementos);
    for (const el of e.elementos) {
      if (!ubicado(el)) continue;
      const n = nums.get(el.id);
      const def = tipoDe(el.tipo);
      if (!n && !el.nombre && def.clase === "referencia" && def.clave !== "arbol" && def.clave !== "bebedero") continue;
      const div = document.createElement("div");
      div.style.pointerEvents = "none";
      div.innerHTML = n
        ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#111c;color:#fff;border-radius:999px;padding:2px 8px 2px 2px;font:600 11px system-ui"><span style="background:#ffd23f;color:#111;border-radius:999px;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center">${n}</span>${etiqueta(el)}</span>`
        : `<span style="font-size:16px">${def.icono}</span>`;
      let pos: [number, number];
      if (el.puntos) {
        const mid = el.puntos[Math.floor(el.puntos.length / 2)];
        pos = aLngLat(mid);
      } else {
        pos = aLngLat([el.x ?? 0, el.y ?? 0]);
      }
      marcadores.current.push(new maplibregl.Marker({ element: div }).setLngLat(pos).addTo(m));
    }

    if (e.dibujandoArea) {
      e.area.forEach((v, i) => {
        const punto = document.createElement("div");
        punto.style.cssText =
          "width:14px;height:14px;border-radius:999px;background:#ffd23f;border:2px solid #111;cursor:grab";
        const mk = new maplibregl.Marker({ element: punto, draggable: true })
          .setLngLat(aLngLat(v))
          .addTo(m);
        mk.on("dragend", () => {
          const ll = mk.getLngLat();
          ref.current.moverVertice(i, aMetros(ll.lng, ll.lat));
        });
        marcadores.current.push(mk);
      });
    }
  }

  useEffect(sincronizar, [estado.elementos, estado.area, estado.seleccion, estado.dibujandoArea]);

  return <div ref={contenedor} className={`relative overflow-hidden ${className}`} />;
}
