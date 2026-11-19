"use client";

/**
 * Editor de predio a pantalla completa (variante B del mock, #42, #43, #45 y #46).
 *
 * El área se dibuja con Terra Draw sobre el mapa satelital (MapLibre). Las
 * instalaciones de la sede y los elementos de referencia (árbol, piedra,
 * bebedero, gradas y tribuna) se ubican, se arrastran y se giran sobre el
 * mapa; su huella sale de las medidas del tipo. Cada uno puede tener
 * descripción y entrar en la leyenda, que se reordena; los elementos de
 * referencia, además, un nombre propio. El editor tiene el área y los centros
 * en lat/lng, y los pasa a metros desde el origen recién al comparar y al
 * guardar: así, mover el origen no corre nada del mapa.
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
import { Crosshair, MapPin, MousePointer2, Pencil, Shrink, Trash2, Trees } from "lucide-react";
import { Button } from "@/ui/nativos/button";
import { cambiarEnLeyenda, moverEnLeyenda, numerosDeLeyenda } from "@/dominio/leyenda";
import type { Coordenadas } from "@/dominio/maps";
import {
  aCoordenadas,
  aMetros,
  errorDelPredio,
  frenteDeGradas,
  hayCambiosEnPredio,
  huellaDeInstalacion,
  huellaDeReferencia,
  medidasDeReferencia,
  medidasDelTipo,
  type DatosPredio,
  type DesdeOrigen,
  type InstalacionDeLaSede,
  type OrigenInicial,
  type Punto,
} from "@/dominio/predio";
import { nombreDeReferencia } from "@/dominio/predio-3d";
import { tipoInstalacion } from "@/dominio/tipos-instalacion";
import { tipoReferencia, type ClaveTipoReferencia } from "@/dominio/tipos-referencia";
import {
  BarraInstalaciones,
  COLOR_POR_FORMA,
  COLOR_POR_REFERENCIA,
  PaletaReferencias,
  PanelElemento,
  type DatosPanel,
} from "./instalaciones-editor";
import { CampoNombre, CamposLeyenda, OrdenLeyenda } from "./leyenda-editor";
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

type Herramienta = "mover" | "area" | "referencias";

/**
 * Algo ubicado, como lo tiene el editor: el centro en lat/lng y la
 * descripción y el nombre como se escriben (se limpian al guardar).
 */
type EnMapa = {
  /** El id de la instalación o, en un elemento de referencia, el suyo. */
  id: string;
  /** null si es una instalación de la sede. */
  referencia: { tipo: ClaveTipoReferencia; nombre: string } | null;
  centro: Coordenadas;
  rotacion: number;
  medidas: Record<string, number>;
  descripcion: string;
  ordenLeyenda: number | null;
};

/** Las huellas, que se tocan y se arrastran. */
const CAPA_HUELLAS = "elementos-relleno";
/** Un punto en el centro de cada elemento de referencia: un bebedero mide 1 m. */
const CAPA_PUNTOS = "elementos-punto";
const CAPAS_TOCABLES = [CAPA_HUELLAS, CAPA_PUNTOS];

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

/**
 * Las huellas de lo ubicado, para la capa del mapa. Los elementos de
 * referencia suman un punto en el centro y las gradas y la tribuna, la línea
 * de su frente.
 */
function geojsonElementos(
  ubicadas: EnMapa[],
  instalaciones: InstalacionDeLaSede[],
  seleccion: string | null,
): GeoJSON.FeatureCollection {
  const porId = new Map(instalaciones.map((i) => [i.id, i]));
  const aLngLat = (centro: Coordenadas) => (p: Punto) => {
    const { lat, lng } = aCoordenadas(centro, p);
    return [lng, lat];
  };
  return {
    type: "FeatureCollection",
    features: ubicadas.flatMap((u): GeoJSON.Feature[] => {
      const local = { posicion: [0, 0] as Punto, rotacion: u.rotacion, medidas: u.medidas };
      const instalacion = u.referencia ? undefined : porId.get(u.id);
      if (!u.referencia && !instalacion) return [];
      const color = u.referencia
        ? COLOR_POR_REFERENCIA[u.referencia.tipo]
        : COLOR_POR_FORMA[tipoInstalacion(instalacion!.tipo).forma];
      const properties = { id: u.id, color, elegida: u.id === seleccion ? 1 : 0 };
      const anillo = (
        u.referencia
          ? huellaDeReferencia({ ...local, tipo: u.referencia.tipo })
          : huellaDeInstalacion(local)
      ).map(aLngLat(u.centro));
      const features: GeoJSON.Feature[] = [
        {
          type: "Feature",
          properties,
          geometry: { type: "Polygon", coordinates: [[...anillo, anillo[0]]] },
        },
      ];
      if (u.referencia) {
        features.push({
          type: "Feature",
          properties,
          geometry: { type: "Point", coordinates: [u.centro.lng, u.centro.lat] },
        });
      }
      if (u.referencia && tipoReferencia(u.referencia.tipo).conFrente) {
        features.push({
          type: "Feature",
          properties: { ...properties, frente: 1 },
          geometry: { type: "LineString", coordinates: frenteDeGradas(local).map(aLngLat(u.centro)) },
        });
      }
      return features;
    }),
  };
}

/** Con qué nombre se ve algo ubicado en el mapa y en la leyenda. */
function nombreEnMapa(u: EnMapa, nombres: ReadonlyMap<string, string>): string {
  if (!u.referencia) return nombres.get(u.id) ?? "";
  return nombreDeReferencia({ tipo: u.referencia.tipo, nombre: u.referencia.nombre.trim() || null });
}

/** Lo que el panel dice de algo ubicado. */
function datosDelPanel(u: EnMapa, instalacion: InstalacionDeLaSede | undefined): DatosPanel | null {
  if (u.referencia) {
    const tipo = tipoReferencia(u.referencia.tipo);
    return {
      id: u.id,
      titulo: `Elemento de referencia · ${tipo.nombre}`,
      nombre: u.referencia.nombre.trim() || tipo.nombre,
      medidasDelTipo: tipo.medidas,
      quitar: "Borrar",
      ayudaQuitar: "Se borra del predio.",
      ayudaRotacion: tipo.conFrente
        ? "La línea blanca es el frente (el escalón más bajo): girala para que mire a la cancha. Con 0°, mira al sur."
        : undefined,
    };
  }
  if (!instalacion) return null;
  const tipo = tipoInstalacion(instalacion.tipo);
  return {
    id: u.id,
    titulo: `Instalación · ${tipo.nombre}`,
    nombre: instalacion.nombre,
    medidasDelTipo: tipo.medidas,
    quitar: "Quitar del predio",
    ayudaQuitar: "Sale del mapa, pero sigue en la sede.",
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
  const [ubicadas, setUbicadas] = useState<EnMapa[]>(() => {
    if (!guardadoInicial) return [];
    const comoEnMapa = (
      id: string,
      referencia: EnMapa["referencia"],
      u: DatosPredio["instalaciones"][number] | DatosPredio["referencias"][number],
    ): EnMapa => ({
      id,
      referencia,
      centro: aCoordenadas(guardadoInicial.origen, u.posicion),
      rotacion: u.rotacion,
      medidas: u.medidas,
      descripcion: u.descripcion ?? "",
      ordenLeyenda: u.ordenLeyenda,
    });
    return [
      ...guardadoInicial.instalaciones.map((i) => comoEnMapa(i.instalacionId, null, i)),
      ...guardadoInicial.referencias.map((r) =>
        comoEnMapa(r.id, { tipo: r.tipo, nombre: r.nombre ?? "" }, r),
      ),
    ];
  });
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

  const actual = useMemo<DatosPredio>(() => {
    const enMetros = (u: EnMapa) => ({
      posicion: aMetros(origen, u.centro),
      rotacion: u.rotacion,
      medidas: u.medidas,
      descripcion: u.descripcion,
      ordenLeyenda: u.ordenLeyenda,
    });
    return {
      origen,
      area: areaEnMetros(anillo, origen),
      instalaciones: ubicadas.flatMap((u) =>
        u.referencia ? [] : [{ instalacionId: u.id, ...enMetros(u) }],
      ),
      referencias: ubicadas.flatMap((u) =>
        u.referencia
          ? [{ id: u.id, tipo: u.referencia.tipo, nombre: u.referencia.nombre, ...enMetros(u) }]
          : [],
      ),
    };
  }, [origen, anillo, ubicadas]);
  const numeros = useMemo(() => numerosDeLeyenda(ubicadas), [ubicadas]);
  const tiposDeLaSede = useMemo(
    () => new Map(instalaciones.map((i) => [i.id, i.tipo])),
    [instalaciones],
  );
  // Sin predio guardado, la base es el origen con el que abrió, sin nada encima.
  const base = guardado ?? {
    origen: origenInicial.coordenadas,
    area: [],
    instalaciones: [],
    referencias: [],
  };

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

      // Lo ubicado va debajo del dibujo del área.
      mapa.addSource("elementos", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      const esPoligono = ["==", ["geometry-type"], "Polygon"] as maplibregl.FilterSpecification;
      const esElegida: maplibregl.ExpressionSpecification = ["==", ["get", "elegida"], 1];
      mapa.addLayer({
        id: CAPA_HUELLAS,
        type: "fill",
        source: "elementos",
        filter: esPoligono,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", esElegida, 0.8, 0.55],
        },
      });
      mapa.addLayer({
        id: "elementos-borde",
        type: "line",
        source: "elementos",
        filter: esPoligono,
        paint: {
          "line-color": ["case", esElegida, "#ffffff", "#1d1d1d"],
          "line-width": ["case", esElegida, 3, 1],
        },
      });
      // El frente de las gradas y la tribuna.
      mapa.addLayer({
        id: "elementos-frente",
        type: "line",
        source: "elementos",
        filter: ["==", ["get", "frente"], 1],
        paint: { "line-color": "#ffffff", "line-width": 4 },
      });
      mapa.addLayer({
        id: CAPA_PUNTOS,
        type: "circle",
        source: "elementos",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": ["get", "color"],
          "circle-stroke-color": ["case", esElegida, "#ffffff", "#1d1d1d"],
          "circle-stroke-width": ["case", esElegida, 3, 1.5],
        },
      });

      // Arrastrar algo ubicado lo mueve (con «Mover y elegir» o con la paleta abierta).
      let arrastrando: { id: string; desfase: [number, number] } | null = null;
      const alBajar = (evento: maplibregl.MapLayerMouseEvent) => {
        if (vivo.current.herramienta === "area" || arrastrando) return;
        // Lo que empieza sobre el pin del origen mueve el origen, no el elemento.
        if (evento.originalEvent.target !== mapa.getCanvas()) return;
        const id = evento.features?.[0]?.properties?.id as string | undefined;
        const ubicada = vivo.current.ubicadas.find((u) => u.id === id);
        if (!id || !ubicada) return;
        evento.preventDefault();
        setSeleccion(id);
        const [este, norte] = aMetros(ubicada.centro, {
          lat: evento.lngLat.lat,
          lng: evento.lngLat.lng,
        });
        arrastrando = { id, desfase: [-este, -norte] };
        mapa.dragPan.disable();
      };
      // El punto va arriba: si se tocan los dos, el punto lo toma primero.
      mapa.on("mousedown", CAPA_PUNTOS, alBajar);
      mapa.on("mousedown", CAPA_HUELLAS, alBajar);
      mapa.on("mousemove", (evento) => {
        if (!arrastrando) return;
        const { id, desfase } = arrastrando;
        const centro = aCoordenadas({ lat: evento.lngLat.lat, lng: evento.lngLat.lng }, desfase);
        setUbicadas((lista) => lista.map((u) => (u.id === id ? { ...u, centro } : u)));
      });
      mapa.on("mouseup", () => {
        if (!arrastrando) return;
        arrastrando = null;
        mapa.dragPan.enable();
      });
      mapa.on("click", (evento) => {
        if (vivo.current.herramienta === "area") return;
        const tocadas = mapa.queryRenderedFeatures(evento.point, { layers: CAPAS_TOCABLES });
        if (tocadas.length === 0) setSeleccion(null);
      });
      for (const capa of CAPAS_TOCABLES) {
        mapa.on("mouseenter", capa, () => {
          if (vivo.current.herramienta !== "area") mapa.getCanvas().style.cursor = "move";
        });
        mapa.on("mouseleave", capa, () => {
          mapa.getCanvas().style.cursor = "";
        });
      }
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
      // Con «Mover y elegir», el área queda quieta y se arrastra lo ubicado.
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

  // Las huellas, los números y los nombres siguen al estado.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !mapaListo) return;
    (mapa.getSource("elementos") as GeoJSONSource | undefined)?.setData(
      geojsonElementos(ubicadas, instalaciones, seleccion),
    );
    for (const etiqueta of etiquetasRef.current) etiqueta.remove();
    const nombres = new Map(instalaciones.map((i) => [i.id, i.nombre]));
    etiquetasRef.current = ubicadas.flatMap((u) => {
      const numero = numeros.get(u.id);
      // Un elemento de referencia sin nombre ni número es decorado: va sin etiqueta.
      if (u.referencia && !numero && !u.referencia.nombre.trim()) return [];
      const elemento = document.createElement("span");
      elemento.className =
        "pointer-events-none rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white";
      const nombre = nombreEnMapa(u, nombres);
      elemento.textContent = numero ? `${numero} · ${nombre}` : nombre;
      // Debajo del centro, para no tapar el punto que se arrastra.
      return [
        new maplibregl.Marker({ element: elemento, offset: u.referencia ? [0, 16] : [0, 0] })
          .setLngLat([u.centro.lng, u.centro.lat])
          .addTo(mapa),
      ];
    });
  }, [mapaListo, ubicadas, instalaciones, seleccion, numeros]);

  function ubicar(instalacionId: string) {
    const mapa = mapaRef.current;
    const instalacion = instalaciones.find((i) => i.id === instalacionId);
    if (!mapa || !instalacion) return;
    const { lat, lng } = mapa.getCenter();
    // Una instalación recién ubicada entra en la leyenda, al final.
    setUbicadas((lista) =>
      cambiarEnLeyenda(
        [
          ...lista,
          {
            id: instalacionId,
            referencia: null,
            centro: { lat, lng },
            rotacion: 0,
            medidas: medidasDelTipo(instalacion.tipo, null),
            descripcion: "",
            ordenLeyenda: null,
          },
        ],
        instalacionId,
        true,
      ),
    );
    elegirHerramienta("mover");
    setSeleccion(instalacionId);
  }

  /**
   * Agrega un elemento de referencia en el centro del mapa. Entra sin número:
   * casi todos son decorado, y el Super Admin lo pone en la leyenda si quiere.
   */
  function agregarReferencia(tipo: ClaveTipoReferencia) {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const { lat, lng } = mapa.getCenter();
    const id = crypto.randomUUID();
    setUbicadas((lista) => [
      ...lista,
      {
        id,
        referencia: { tipo, nombre: "" },
        centro: { lat, lng },
        rotacion: 0,
        medidas: medidasDeReferencia(tipo, null),
        descripcion: "",
        ordenLeyenda: null,
      },
    ]);
    setSeleccion(id);
  }

  function elegirElemento(id: string) {
    const mapa = mapaRef.current;
    const ubicada = ubicadas.find((u) => u.id === id);
    if (mapa && ubicada) mapa.easeTo({ center: [ubicada.centro.lng, ubicada.centro.lat] });
    if (herramienta === "area") elegirHerramienta("mover");
    setSeleccion(id);
  }

  function cambiarUbicada(id: string, cambio: Partial<EnMapa>) {
    setUbicadas((lista) => lista.map((u) => (u.id === id ? { ...u, ...cambio } : u)));
  }

  function ponerEnLeyenda(id: string, entra: boolean) {
    setUbicadas((lista) => cambiarEnLeyenda(lista, id, entra));
  }

  function reordenarLeyenda(id: string, delta: -1 | 1) {
    setUbicadas((lista) => moverEnLeyenda(lista, id, delta));
  }

  function quitarDelPredio(id: string) {
    setUbicadas((lista) => lista.filter((u) => u.id !== id));
    setSeleccion(null);
  }

  function elegirHerramienta(nueva: Herramienta) {
    setHerramienta(nueva);
    if (nueva === "area") setSeleccion(null);
    const dibujo = dibujoRef.current;
    if (!dibujo) return;
    if (nueva !== "area") {
      dibujo.setMode("static");
      return;
    }
    if (!anilloDelArea(dibujo.getSnapshot())) {
      dibujo.setMode("polygon");
      return;
    }
    dibujo.setMode("select");
    const area = dibujo.getSnapshot().find((f) => f.geometry.type === "Polygon");
    if (area?.id !== undefined) dibujo.selectFeature(area.id);
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
    { clave: "referencias" as const, icono: Trees, etiqueta: "Elementos de referencia" },
  ];
  const avisoOrigen = guardado ? undefined : AVISO_ORIGEN[origenInicial.desde];
  const dibujandoArea = herramienta === "area" && !anillo;
  const elegida = ubicadas.find((u) => u.id === seleccion);
  const panel = elegida
    ? datosDelPanel(elegida, instalaciones.find((i) => i.id === elegida.id))
    : null;
  const nombres = new Map(instalaciones.map((i) => [i.id, i.nombre]));
  const porId = new Map(ubicadas.map((u) => [u.id, u]));
  const lineasLeyenda = [...numeros].map(([id, numero]) => ({
    id,
    numero,
    nombre: porId.has(id) ? nombreEnMapa(porId.get(id)!, nombres) : "",
  }));

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
        {herramienta === "referencias" ? (
          <>
            <p className="font-medium">Elementos de referencia</p>
            <p className="text-muted-foreground">
              Tocá uno para agregarlo en el centro del mapa. Después se arrastra, se gira y se
              le cambian las medidas como a una instalación.
            </p>
            <PaletaReferencias onAgregar={agregarReferencia} />
          </>
        ) : herramienta === "area" ? (
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
              Arrastrá una instalación o un elemento de referencia para moverlo, o tocalo para
              girarlo y cambiar sus medidas. Las instalaciones que faltan ubicar están abajo.
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
        ubicadas={new Set(ubicadas.flatMap((u) => (u.referencia ? [] : [u.id])))}
        seleccion={seleccion}
        onElegir={elegirElemento}
        onUbicar={ubicar}
      />

      {elegida && panel ? (
        <PanelElemento
          elemento={panel}
          numero={numeros.get(elegida.id) ?? null}
          rotacion={elegida.rotacion}
          medidas={elegida.medidas}
          onRotar={(rotacion) => cambiarUbicada(elegida.id, { rotacion })}
          onMedida={(clave, valor) =>
            cambiarUbicada(elegida.id, {
              medidas: { ...elegida.medidas, [clave]: valor },
            })
          }
          onQuitar={() => quitarDelPredio(elegida.id)}
          onCerrar={() => setSeleccion(null)}
        >
          {elegida.referencia ? (
            <CampoNombre
              key={`nombre-${elegida.id}`}
              nombre={elegida.referencia.nombre}
              onNombre={(nombre) =>
                cambiarUbicada(elegida.id, { referencia: { ...elegida.referencia!, nombre } })
              }
            />
          ) : null}
          <CamposLeyenda
            descripcion={elegida.descripcion}
            enLeyenda={elegida.ordenLeyenda !== null}
            onDescripcion={(descripcion) => cambiarUbicada(elegida.id, { descripcion })}
            onEnLeyenda={(entra) => ponerEnLeyenda(elegida.id, entra)}
          />
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Leyenda
            </p>
            <OrdenLeyenda
              leyenda={lineasLeyenda}
              seleccion={seleccion}
              onElegir={elegirElemento}
              onMover={reordenarLeyenda}
            />
          </div>
        </PanelElemento>
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
