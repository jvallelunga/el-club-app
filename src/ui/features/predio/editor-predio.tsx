"use client";

/**
 * Editor de predio a pantalla completa (variante B del mock, #42 y #43).
 *
 * El área se dibuja con Terra Draw sobre el mapa satelital (MapLibre). Las
 * instalaciones de la sede se ubican, se arrastran y se giran sobre el mapa;
 * su huella sale de las medidas del tipo. El editor tiene el área y los
 * centros de las instalaciones en lat/lng, y los pasa a metros desde el origen
 * recién al comparar y al guardar: así, mover el origen no corre nada del mapa.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  ValidateNotSelfIntersecting,
  type GeoJSONStoreFeatures,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { Crosshair, MapPin, MousePointer2, Pencil, Shrink, Trash2 } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import type { Coordenadas } from "@/dominio/maps";
import {
  aCoordenadas,
  aMetros,
  errorDelPredio,
  hayCambiosEnPredio,
  huellaDeInstalacion,
  medidasDelTipo,
  type DatosPredio,
  type DesdeOrigen,
  type InstalacionDeLaSede,
  type OrigenInicial,
} from "@/dominio/predio";
import { tipoInstalacion } from "@/dominio/tipos-instalacion";
import {
  BarraInstalaciones,
  COLOR_POR_FORMA,
  PanelInstalacion,
} from "./instalaciones-editor";
import {
  ATRIBUCION_ESRI,
  esRechazoDeGoogle,
  fuenteEsri,
  fuenteSatelital,
  ZOOM_MAXIMO,
  type FuenteSatelital,
} from "./mapa-satelital";

// Turbopack no resuelve el worker de MapLibre: va copiado en public/maplibre/.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/** Logo de Google para fondos que no son blancos (la foto satelital). */
const LOGO_GOOGLE =
  "https://developers.google.com/static/maps/documentation/images/google_on_non_white.png";

const AMARILLO = "#ffd23f";

type LngLat = [number, number];

export type ResultadoGuardarPredio = { ok: true } | { ok: false; error: string };

type Herramienta = "mover" | "area";

/** Una instalación ubicada, como la tiene el editor: el centro en lat/lng. */
type EnMapa = {
  instalacionId: string;
  centro: Coordenadas;
  rotacion: number;
  medidas: Record<string, number>;
};

const CAPA_INSTALACIONES = "instalaciones-relleno";

const AVISO_ORIGEN: Partial<Record<DesdeOrigen, string>> = {
  ciudad:
    "La sede no tiene ubicación: el mapa arranca en la dirección del club. Buscá el predio y traé el origen.",
  "por-defecto":
    "Ni la sede ni el club tienen una ubicación que el mapa encuentre: arranca en Buenos Aires. Buscá el predio y traé el origen.",
};

function areaEnMetros(anillo: LngLat[] | null, origen: Coordenadas) {
  if (!anillo) return [];
  return anillo.map(([lng, lat]) => aMetros(origen, { lat, lng }));
}

/** El polígono del área leído de Terra Draw, sin el punto que lo cierra. */
function anilloDelArea(features: GeoJSONStoreFeatures[]): LngLat[] | null {
  const poligono = features.find((f) => f.geometry.type === "Polygon");
  if (!poligono || poligono.geometry.type !== "Polygon") return null;
  const anillo = poligono.geometry.coordinates[0] as LngLat[];
  return anillo.slice(0, -1);
}

/** Las huellas de las instalaciones ubicadas, para la capa del mapa. */
function geojsonInstalaciones(
  ubicadas: EnMapa[],
  instalaciones: InstalacionDeLaSede[],
  seleccion: string | null,
): GeoJSON.FeatureCollection {
  const porId = new Map(instalaciones.map((i) => [i.id, i]));
  return {
    type: "FeatureCollection",
    features: ubicadas.flatMap((u) => {
      const instalacion = porId.get(u.instalacionId);
      if (!instalacion) return [];
      const anillo = huellaDeInstalacion({ posicion: [0, 0], rotacion: u.rotacion, medidas: u.medidas })
        .map((p) => aCoordenadas(u.centro, p))
        .map(({ lat, lng }) => [lng, lat]);
      return [
        {
          type: "Feature" as const,
          properties: {
            id: u.instalacionId,
            color: COLOR_POR_FORMA[tipoInstalacion(instalacion.tipo).forma],
            elegida: u.instalacionId === seleccion ? 1 : 0,
          },
          geometry: { type: "Polygon" as const, coordinates: [[...anillo, anillo[0]]] },
        },
      ];
    }),
  };
}

export function EditorPredio({
  sedeNombre,
  instalaciones,
  guardado: guardadoInicial,
  origenInicial,
  guardar,
  onCambios,
  onCerrar,
}: {
  sedeNombre: string;
  /** Las instalaciones de la sede, ubicadas o no. */
  instalaciones: InstalacionDeLaSede[];
  guardado: DatosPredio | null;
  origenInicial: OrigenInicial;
  guardar: (datos: DatosPredio) => Promise<ResultadoGuardarPredio>;
  /** Avisa si hay cambios sin guardar. */
  onCambios: (hay: boolean) => void;
  /** Pide cerrar el editor; quien lo abre decide si avisa. */
  onCerrar: () => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<maplibregl.Map | null>(null);
  const dibujoRef = useRef<TerraDraw | null>(null);
  const marcadorRef = useRef<maplibregl.Marker | null>(null);

  const [guardado, setGuardado] = useState(guardadoInicial);
  const [origen, setOrigen] = useState<Coordenadas>(origenInicial.coordenadas);
  const [anillo, setAnillo] = useState<LngLat[] | null>(() =>
    guardadoInicial && guardadoInicial.area.length > 0
      ? guardadoInicial.area.map((p) => {
          const { lat, lng } = aCoordenadas(guardadoInicial.origen, p);
          // Terra Draw rechaza coordenadas con más de 9 decimales.
          return [Number(lng.toFixed(9)), Number(lat.toFixed(9))];
        })
      : null,
  );
  const anilloInicial = useRef(anillo);
  const [ubicadas, setUbicadas] = useState<EnMapa[]>(() =>
    (guardadoInicial?.instalaciones ?? []).map((i) => ({
      instalacionId: i.instalacionId,
      centro: aCoordenadas(guardadoInicial!.origen, i.posicion),
      rotacion: i.rotacion,
      medidas: i.medidas,
    })),
  );
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [mapaListo, setMapaListo] = useState(false);
  const etiquetasRef = useRef<maplibregl.Marker[]>([]);
  const [herramienta, setHerramienta] = useState<Herramienta>("mover");
  const [fuente, setFuente] = useState<FuenteSatelital | null>(null);
  const [copyright, setCopyright] = useState("");
  const [sinLogo, setSinLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recienGuardado, setRecienGuardado] = useState(false);
  const [guardando, startGuardar] = useTransition();

  const actual = useMemo<DatosPredio>(
    () => ({
      origen,
      area: areaEnMetros(anillo, origen),
      instalaciones: ubicadas.map((u) => ({
        instalacionId: u.instalacionId,
        posicion: aMetros(origen, u.centro),
        rotacion: u.rotacion,
        medidas: u.medidas,
      })),
    }),
    [origen, anillo, ubicadas],
  );
  const tiposDeLaSede = useMemo(
    () => new Map(instalaciones.map((i) => [i.id, i.tipo])),
    [instalaciones],
  );
  // Sin predio guardado, la base es el origen con el que abrió, sin nada encima.
  const base = guardado ?? { origen: origenInicial.coordenadas, area: [], instalaciones: [] };

  // Lo que leen los manejadores del mapa, que se registran una sola vez.
  const vivo = useRef({ herramienta: "mover" as Herramienta, ubicadas });
  useLayoutEffect(() => {
    vivo.current = { herramienta, ubicadas };
  });
  const hayCambios = hayCambiosEnPredio(base, actual);

  useEffect(() => {
    onCambios(hayCambios);
  }, [hayCambios, onCambios]);

  // El mapa y el dibujo se crean una sola vez.
  useEffect(() => {
    if (!contenedor.current) return;
    let cancelado = false;
    const conUbicacion =
      origenInicial.desde === "predio" || origenInicial.desde === "sede";
    const mapa = new maplibregl.Map({
      container: contenedor.current,
      style: { version: 8, sources: {}, layers: [] },
      center: [origenInicial.coordenadas.lng, origenInicial.coordenadas.lat],
      zoom: conUbicacion ? 17 : 13,
      maxZoom: ZOOM_MAXIMO,
      // La atribución la dibuja el editor, para que nada la tape.
      attributionControl: false,
    });
    mapaRef.current = mapa;
    mapa.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    // Debajo de la barra de arriba. Inline, porque la CSS de MapLibre no va en una capa.
    const esquina = mapa.getContainer().querySelector<HTMLElement>(".maplibregl-ctrl-top-right");
    if (esquina) esquina.style.top = "5rem";

    const marcador = new maplibregl.Marker({ color: AMARILLO, draggable: true })
      .setLngLat([origenInicial.coordenadas.lng, origenInicial.coordenadas.lat])
      .addTo(mapa);
    marcador.getElement().title = "Origen del predio (arrastralo para moverlo)";
    marcador.on("dragend", () => {
      const { lat, lng } = marcador.getLngLat();
      setOrigen({ lat, lng });
    });
    marcadorRef.current = marcador;

    mapa.on("load", async () => {
      const elegida = await fuenteSatelital();
      if (cancelado) return;
      setFuente(elegida);
      // La foto va primero: el dibujo se agrega después, encima.
      mapa.addSource("satelital", elegida.raster);
      mapa.addLayer({ id: "satelital", type: "raster", source: "satelital" });

      // Si la sesión abrió pero Google rechaza los tiles, se cambia a Esri.
      if (elegida.proveedor === "google") {
        const alFallarTile = (evento: maplibregl.ErrorEvent & { sourceId?: string }) => {
          const estado = (evento.error as { status?: number } | undefined)?.status;
          if (evento.sourceId !== "satelital" || !esRechazoDeGoogle(estado)) return;
          mapa.off("error", alFallarTile);
          const esri = fuenteEsri("Google rechazó las imágenes: se muestran las de Esri.");
          // La capa nueva va abajo de todo, debajo del dibujo.
          const primeraCapa = mapa.getStyle().layers.find((c) => c.id !== "satelital")?.id;
          mapa.removeLayer("satelital");
          mapa.removeSource("satelital");
          mapa.addSource("satelital", esri.raster);
          mapa.addLayer({ id: "satelital", type: "raster", source: "satelital" }, primeraCapa);
          setFuente(esri);
        };
        mapa.on("error", alFallarTile);
      }

      // Las instalaciones van debajo del dibujo del área.
      mapa.addSource("instalaciones", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      mapa.addLayer({
        id: CAPA_INSTALACIONES,
        type: "fill",
        source: "instalaciones",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", ["==", ["get", "elegida"], 1], 0.8, 0.55],
        },
      });
      mapa.addLayer({
        id: "instalaciones-borde",
        type: "line",
        source: "instalaciones",
        paint: {
          "line-color": ["case", ["==", ["get", "elegida"], 1], "#ffffff", "#1d1d1d"],
          "line-width": ["case", ["==", ["get", "elegida"], 1], 3, 1],
        },
      });

      // Arrastrar una instalación la mueve (solo con «Mover y elegir»).
      let arrastrando: { id: string; desfase: [number, number] } | null = null;
      mapa.on("mousedown", CAPA_INSTALACIONES, (evento) => {
        if (vivo.current.herramienta !== "mover") return;
        // Lo que empieza sobre el pin del origen mueve el origen, no la instalación.
        if (evento.originalEvent.target !== mapa.getCanvas()) return;
        const id = evento.features?.[0]?.properties?.id as string | undefined;
        const ubicada = vivo.current.ubicadas.find((u) => u.instalacionId === id);
        if (!id || !ubicada) return;
        evento.preventDefault();
        setSeleccion(id);
        const [este, norte] = aMetros(ubicada.centro, {
          lat: evento.lngLat.lat,
          lng: evento.lngLat.lng,
        });
        arrastrando = { id, desfase: [-este, -norte] };
        mapa.dragPan.disable();
      });
      mapa.on("mousemove", (evento) => {
        if (!arrastrando) return;
        const { id, desfase } = arrastrando;
        const centro = aCoordenadas({ lat: evento.lngLat.lat, lng: evento.lngLat.lng }, desfase);
        setUbicadas((lista) =>
          lista.map((u) => (u.instalacionId === id ? { ...u, centro } : u)),
        );
      });
      mapa.on("mouseup", () => {
        if (!arrastrando) return;
        arrastrando = null;
        mapa.dragPan.enable();
      });
      mapa.on("click", (evento) => {
        if (vivo.current.herramienta !== "mover") return;
        const tocadas = mapa.queryRenderedFeatures(evento.point, { layers: [CAPA_INSTALACIONES] });
        if (tocadas.length === 0) setSeleccion(null);
      });
      mapa.on("mouseenter", CAPA_INSTALACIONES, () => {
        if (vivo.current.herramienta === "mover") mapa.getCanvas().style.cursor = "move";
      });
      mapa.on("mouseleave", CAPA_INSTALACIONES, () => {
        mapa.getCanvas().style.cursor = "";
      });
      setMapaListo(true);

      const estiloArea = {
        fillColor: AMARILLO,
        fillOpacity: 0.12,
        outlineColor: AMARILLO,
        outlineWidth: 3,
      } as const;
      const dibujo = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: mapa }),
        modes: [
          new TerraDrawPolygonMode({
            styles: estiloArea,
            validation: (feature) => ValidateNotSelfIntersecting(feature),
          }),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  selfIntersectable: false,
                  coordinates: { draggable: true, midpoints: true, deletable: true },
                },
              },
            },
            styles: {
              selectedPolygonColor: AMARILLO,
              selectedPolygonFillOpacity: 0.2,
              selectedPolygonOutlineColor: "#ffffff",
              selectionPointColor: AMARILLO,
              midPointColor: "#ffffff",
            },
          }),
        ],
      });
      dibujo.start();
      // Con «Mover y elegir», el área queda quieta y se arrastran las instalaciones.
      dibujo.setMode("static");
      dibujoRef.current = dibujo;

      const previo = anilloInicial.current;
      if (previo) {
        dibujo.addFeatures([
          {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [[...previo, previo[0]]] },
            properties: { mode: "polygon" },
          },
        ]);
      }

      // Mientras se dibuja, el polígono está a medias: se lee al terminar.
      dibujo.on("change", () => {
        if (dibujo.getMode() !== "select") return;
        setAnillo(anilloDelArea(dibujo.getSnapshot()));
      });
      dibujo.on("finish", (id, contexto) => {
        if (contexto.mode !== "polygon") return;
        dibujo.setMode("select");
        dibujo.selectFeature(id);
        setAnillo(anilloDelArea(dibujo.getSnapshot()));
      });
    });

    return () => {
      cancelado = true;
      dibujoRef.current?.stop();
      dibujoRef.current = null;
      for (const etiqueta of etiquetasRef.current) etiqueta.remove();
      etiquetasRef.current = [];
      marcador.remove();
      mapa.remove();
      mapaRef.current = null;
    };
    // Se crea una sola vez con lo que trajo el servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El copyright de Google cambia con la zona: se pide al terminar cada movimiento.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || fuente?.proveedor !== "google") return;
    let ultimo = 0;
    const actualizar = () => {
      const pedido = ++ultimo;
      const b = mapa.getBounds();
      fuente
        .copyright(mapa.getZoom(), {
          norte: b.getNorth(),
          sur: b.getSouth(),
          este: b.getEast(),
          oeste: b.getWest(),
        })
        .then((texto) => {
          if (pedido === ultimo) setCopyright(texto);
        })
        .catch(() => undefined);
    };
    actualizar();
    mapa.on("moveend", actualizar);
    return () => {
      mapa.off("moveend", actualizar);
    };
  }, [fuente]);

  // Las huellas y los nombres de las instalaciones siguen al estado.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !mapaListo) return;
    (mapa.getSource("instalaciones") as GeoJSONSource | undefined)?.setData(
      geojsonInstalaciones(ubicadas, instalaciones, seleccion),
    );
    for (const etiqueta of etiquetasRef.current) etiqueta.remove();
    const nombres = new Map(instalaciones.map((i) => [i.id, i.nombre]));
    etiquetasRef.current = ubicadas.map((u) => {
      const elemento = document.createElement("span");
      elemento.className =
        "pointer-events-none rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white";
      elemento.textContent = nombres.get(u.instalacionId) ?? "";
      return new maplibregl.Marker({ element: elemento })
        .setLngLat([u.centro.lng, u.centro.lat])
        .addTo(mapa);
    });
  }, [mapaListo, ubicadas, instalaciones, seleccion]);

  function ubicar(instalacionId: string) {
    const mapa = mapaRef.current;
    const instalacion = instalaciones.find((i) => i.id === instalacionId);
    if (!mapa || !instalacion) return;
    const { lat, lng } = mapa.getCenter();
    setUbicadas((lista) => [
      ...lista,
      {
        instalacionId,
        centro: { lat, lng },
        rotacion: 0,
        medidas: medidasDelTipo(instalacion.tipo, null),
      },
    ]);
    elegirHerramienta("mover");
    setSeleccion(instalacionId);
  }

  function elegirInstalacion(instalacionId: string) {
    const mapa = mapaRef.current;
    const ubicada = ubicadas.find((u) => u.instalacionId === instalacionId);
    if (mapa && ubicada) mapa.easeTo({ center: [ubicada.centro.lng, ubicada.centro.lat] });
    elegirHerramienta("mover");
    setSeleccion(instalacionId);
  }

  function cambiarUbicada(instalacionId: string, cambio: Partial<EnMapa>) {
    setUbicadas((lista) =>
      lista.map((u) => (u.instalacionId === instalacionId ? { ...u, ...cambio } : u)),
    );
  }

  function quitarDelPredio(instalacionId: string) {
    setUbicadas((lista) => lista.filter((u) => u.instalacionId !== instalacionId));
    setSeleccion(null);
  }

  function elegirHerramienta(nueva: Herramienta) {
    setHerramienta(nueva);
    if (nueva !== "mover") setSeleccion(null);
    const dibujo = dibujoRef.current;
    if (!dibujo) return;
    if (nueva === "mover") {
      dibujo.setMode("static");
      return;
    }
    if (nueva === "area" && !anilloDelArea(dibujo.getSnapshot())) {
      dibujo.setMode("polygon");
      return;
    }
    dibujo.setMode("select");
    const area = dibujo.getSnapshot().find((f) => f.geometry.type === "Polygon");
    if (nueva === "area" && area?.id !== undefined) dibujo.selectFeature(area.id);
  }

  function borrarArea() {
    const dibujo = dibujoRef.current;
    if (!dibujo) return;
    dibujo.clear();
    setAnillo(null);
    dibujo.setMode("polygon");
  }

  function traerOrigen() {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const centro = mapa.getCenter();
    marcadorRef.current?.setLngLat(centro);
    setOrigen({ lat: centro.lat, lng: centro.lng });
  }

  function guardarCambios() {
    const invalido = errorDelPredio(actual, tiposDeLaSede);
    if (invalido) {
      setError(invalido);
      return;
    }
    setError(null);
    startGuardar(async () => {
      const resultado = await guardar(actual);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setGuardado(actual);
      setRecienGuardado(true);
    });
  }

  const herramientas = [
    { clave: "mover" as const, icono: MousePointer2, etiqueta: "Mover y elegir" },
    { clave: "area" as const, icono: Pencil, etiqueta: "Área del predio" },
  ];
  const avisoOrigen = guardado ? undefined : AVISO_ORIGEN[origenInicial.desde];
  const dibujandoArea = herramienta === "area" && !anillo;
  const elegida = ubicadas.find((u) => u.instalacionId === seleccion);
  const instalacionElegida = instalaciones.find((i) => i.id === seleccion);

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`Editor de predio de la sede ${sedeNombre}`}
    >
      <div ref={contenedor} className="size-full" />

      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-4 rounded-2xl bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            Sede {sedeNombre} · Editor de predio
          </p>
          <p className="font-medium">Predio</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {guardando
              ? "Guardando…"
              : hayCambios
                ? "Cambios sin guardar"
                : recienGuardado
                  ? "Guardado"
                  : null}
          </p>
          <Button
            className="h-9 rounded-lg"
            disabled={!hayCambios || guardando}
            onClick={guardarCambios}
          >
            Guardar
          </Button>
          <Button variant="outline" className="h-9 rounded-lg" onClick={onCerrar}>
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
            aria-label={h.etiqueta}
            aria-pressed={herramienta === h.clave}
            onClick={() => elegirHerramienta(h.clave)}
            className={`flex size-10 items-center justify-center rounded-xl ${herramienta === h.clave ? "bg-foreground text-background" : "hover:bg-muted"}`}
          >
            <h.icono className="size-5" />
          </button>
        ))}
      </div>

      <div className="absolute left-20 top-24 flex w-72 flex-col gap-3 rounded-2xl bg-background/95 p-3 text-sm shadow-lg">
        {herramienta === "area" ? (
          <>
            <p className="font-medium">Área del predio</p>
            <p className="text-muted-foreground">
              {dibujandoArea
                ? "Tocá el mapa para marcar cada esquina. Para cerrar el área, tocá el primer punto."
                : "Arrastrá los vértices para ajustarla. Tocá un punto blanco para agregar un vértice."}
            </p>
            {anillo ? (
              <Button variant="outline" className="h-9 justify-start rounded-lg" onClick={borrarArea}>
                <Trash2 className="size-4" />
                Borrar el área y dibujarla de nuevo
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <p className="font-medium">Origen del predio</p>
            <p className="text-muted-foreground">
              Arrastrá una instalación para moverla, o tocala para girarla y cambiar sus
              medidas. Las que faltan ubicar están abajo.
            </p>
            <p className="text-muted-foreground">
              <MapPin className="mr-1 inline size-4 text-amber-500" />
              El pin amarillo es el punto desde el que se ubica todo el predio. Arrastralo, o
              traelo al centro del mapa.
            </p>
            <Button variant="outline" className="h-9 justify-start rounded-lg" onClick={traerOrigen}>
              <Crosshair className="size-4" />
              Traer el origen al centro del mapa
            </Button>
          </>
        )}
      </div>

      {avisoOrigen || fuente?.proveedor === "esri" || error ? (
        <div className="absolute left-1/2 top-24 flex w-[min(28rem,calc(100%-24rem))] -translate-x-1/2 flex-col gap-2">
          {error ? (
            <p className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white shadow" role="alert">
              {error}
            </p>
          ) : null}
          {fuente?.proveedor === "esri" ? (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 shadow">
              {fuente.aviso}
            </p>
          ) : null}
          {avisoOrigen ? (
            <p className="rounded-lg bg-background/95 px-3 py-2 text-sm shadow">{avisoOrigen}</p>
          ) : null}
        </div>
      ) : null}

      <BarraInstalaciones
        instalaciones={instalaciones}
        ubicadas={new Set(ubicadas.map((u) => u.instalacionId))}
        seleccion={seleccion}
        onElegir={elegirInstalacion}
        onUbicar={ubicar}
      />

      {elegida && instalacionElegida ? (
        <PanelInstalacion
          instalacion={instalacionElegida}
          rotacion={elegida.rotacion}
          medidas={elegida.medidas}
          onRotar={(rotacion) => cambiarUbicada(elegida.instalacionId, { rotacion })}
          onMedida={(clave, valor) =>
            cambiarUbicada(elegida.instalacionId, {
              medidas: { ...elegida.medidas, [clave]: valor },
            })
          }
          onQuitar={() => quitarDelPredio(elegida.instalacionId)}
          onCerrar={() => setSeleccion(null)}
        />
      ) : null}

      {/* Atribución: abajo y sin nada encima (términos de la Map Tiles API). */}
      {fuente?.proveedor === "google" ? (
        <>
          <div className="pointer-events-none absolute bottom-2 left-2">
            {sinLogo ? (
              <span className="text-sm font-medium text-white drop-shadow">Google Maps</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- logo de Google sin modificar
              <img src={LOGO_GOOGLE} alt="Google" className="h-[18px] w-auto" onError={() => setSinLogo(true)} />
            )}
          </div>
          <p className="absolute bottom-0 right-0 max-w-[60%] bg-white/80 px-1.5 py-0.5 text-right text-[11px] text-neutral-800">
            {copyright || "Google"}
          </p>
        </>
      ) : fuente?.proveedor === "esri" ? (
        <p className="absolute bottom-0 right-0 bg-white/80 px-1.5 py-0.5 text-[11px] text-neutral-800">
          {ATRIBUCION_ESRI}
        </p>
      ) : null}
    </div>
  );
}
