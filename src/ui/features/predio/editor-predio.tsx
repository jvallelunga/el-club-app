"use client";

/**
 * Editor de predio a pantalla completa (variante B del mock, #42, #43, #45 y #46).
 *
 * El área se dibuja con Terra Draw sobre el mapa satelital (MapLibre). Las
 * instalaciones de la sede y los elementos de referencia (árbol, piedra,
 * bebedero, gradas y tribuna) se ubican, se arrastran y se giran sobre el
 * mapa; su huella sale de las medidas del tipo. Cada uno puede tener
 * descripción y entrar en la leyenda, que se reordena; los elementos de
 * referencia, además, un nombre propio. Los caminos y las vallas (#47) se
 * dibujan punto a punto con Terra Draw y, elegidos, se editan sus puntos. El
 * editor tiene el área, los centros y los puntos en lat/lng, y los pasa a
 * metros desde el origen recién al comparar y al guardar: así, mover el
 * origen no corre nada del mapa.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  ValidateNotSelfIntersecting,
  type GeoJSONStoreFeatures,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import type { ResultadoSimple } from "@/dominio/resultado";
import { Crosshair, MapPin, MousePointer2, Pencil, Shrink, Trash2, Trees, X } from "lucide-react";
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
  largoDeLinea,
  lineaEnCoordenadas,
  lineaEnMetros,
  medidasDeLinea,
  medidasDeReferencia,
  medidasDelTipo,
  puntoMedioDeLinea,
  type DatosPredio,
  type DesdeOrigen,
  type InstalacionDeLaSede,
  type OrigenInicial,
  type Punto,
} from "@/dominio/predio";
import { nombreDeReferencia } from "@/dominio/predio-3d";
import { tipoInstalacion } from "@/dominio/tipos-instalacion";
import {
  tipoLinea,
  tipoReferencia,
  type ClaveTipoLinea,
  type ClaveTipoReferencia,
} from "@/dominio/tipos-referencia";
import {
  BarraInstalaciones,
  COLOR_POR_FORMA,
  COLOR_POR_LINEA,
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

/**
 * Logo oficial de Google Maps con contorno oscuro, el que se lee sobre la foto
 * satelital (assets de la política de la Map Tiles API, sin modificar).
 */
const LOGO_GOOGLE_MAPS = "/google/google-maps-logo-contorno-oscuro.svg";

const AMARILLO = "#ffd23f";

type LngLat = [number, number];


type Herramienta = "mover" | "area" | "referencias";

/** Lo que tiene todo lo ubicado. */
type Comun = {
  /** El id de la instalación o, en un elemento de referencia, el suyo. */
  id: string;
  medidas: Record<string, number>;
  /** Como se escribe: se limpia al guardar. */
  descripcion: string;
  ordenLeyenda: number | null;
};

/**
 * Algo ubicado, como lo tiene el editor: el centro (o los puntos de un camino
 * o una valla) en lat/lng, y el nombre como se escribe.
 */
type EnMapa =
  | (Comun & { clase: "instalacion"; centro: Coordenadas; rotacion: number })
  | (Comun & {
      clase: "referencia";
      tipo: ClaveTipoReferencia;
      nombre: string;
      centro: Coordenadas;
      rotacion: number;
    })
  | (Comun & { clase: "linea"; tipo: ClaveTipoLinea; nombre: string; puntos: Coordenadas[] });

/** Lo que el panel puede cambiar de algo ubicado. */
type CambioEnMapa = Partial<Pick<Comun, "medidas" | "descripcion"> & { rotacion: number; nombre: string }>;

/** Las huellas, que se tocan y se arrastran. */
const CAPA_HUELLAS = "elementos-relleno";
/** Un punto en el centro de cada elemento de referencia: un bebedero mide 1 m. */
const CAPA_PUNTOS = "elementos-punto";
/** Los caminos, con su ancho real, y las vallas (#47). */
const CAPA_CAMINOS = "elementos-camino";
const CAPA_VALLAS = "elementos-valla";
const CAPAS_TOCABLES = [CAPA_HUELLAS, CAPA_PUNTOS, CAPA_CAMINOS, CAPA_VALLAS];

/** El modo de Terra Draw que edita los puntos del camino o la valla elegidos. */
const MODO_EDITAR_LINEA = "editar-linea";

/** Terra Draw rechaza coordenadas con más de 9 decimales. */
const aLngLat9 = ({ lat, lng }: Coordenadas): LngLat => [Number(lng.toFixed(9)), Number(lat.toFixed(9))];

/** Los puntos de un camino o una valla que está en Terra Draw, o null. */
function puntosEnDibujo(dibujo: TerraDraw, id: string | number): Coordenadas[] | null {
  const linea = dibujo.getSnapshotFeature(id);
  if (!linea || linea.geometry.type !== "LineString") return null;
  return (linea.geometry.coordinates as LngLat[]).map(([lng, lat]) => ({ lat, lng }));
}

/** Metros por píxel en el zoom 0 de MapLibre (teselas de 512 px), a esa latitud. */
function metrosPorPixelEnZoom0(lat: number): number {
  return (40_075_016.686 * Math.cos((lat * Math.PI) / 180)) / 512;
}

/** Dónde se ve algo ubicado: su centro o, en una línea, la mitad de su largo. */
function dondeEsta(u: EnMapa): Coordenadas {
  if (u.clase !== "linea") return u.centro;
  const desde = u.puntos[0];
  return aCoordenadas(desde, puntoMedioDeLinea(lineaEnMetros(desde, u.puntos)));
}

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
      const elegida = u.id === seleccion ? 1 : 0;
      if (u.clase === "linea") {
        // El ancho del camino, en píxeles en el zoom 0: el mapa lo escala.
        const ancho = (u.medidas.ancho ?? 0) / metrosPorPixelEnZoom0(u.puntos[0].lat);
        return [
          {
            type: "Feature",
            properties: { id: u.id, color: COLOR_POR_LINEA[u.tipo], elegida, linea: u.tipo, ancho },
            geometry: { type: "LineString", coordinates: u.puntos.map(({ lat, lng }) => [lng, lat]) },
          },
        ];
      }
      const local = { posicion: [0, 0] as Punto, rotacion: u.rotacion, medidas: u.medidas };
      const instalacion = u.clase === "instalacion" ? porId.get(u.id) : undefined;
      if (u.clase === "instalacion" && !instalacion) return [];
      const color =
        u.clase === "referencia"
          ? COLOR_POR_REFERENCIA[u.tipo]
          : COLOR_POR_FORMA[tipoInstalacion(instalacion!.tipo).forma];
      const properties = { id: u.id, color, elegida };
      const anillo = (
        u.clase === "referencia"
          ? huellaDeReferencia({ ...local, tipo: u.tipo })
          : huellaDeInstalacion(local)
      ).map(aLngLat(u.centro));
      const features: GeoJSON.Feature[] = [
        {
          type: "Feature",
          properties,
          geometry: { type: "Polygon", coordinates: [[...anillo, anillo[0]]] },
        },
      ];
      if (u.clase === "referencia") {
        features.push({
          type: "Feature",
          properties,
          geometry: { type: "Point", coordinates: [u.centro.lng, u.centro.lat] },
        });
      }
      if (u.clase === "referencia" && tipoReferencia(u.tipo).conFrente) {
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
  if (u.clase === "instalacion") return nombres.get(u.id) ?? "";
  return nombreDeReferencia({ tipo: u.tipo, nombre: u.nombre.trim() || null });
}

/** Lo que el panel dice de algo ubicado. */
function datosDelPanel(u: EnMapa, instalacion: InstalacionDeLaSede | undefined): DatosPanel | null {
  if (u.clase === "linea") {
    const tipo = tipoLinea(u.tipo);
    const largo = Math.round(largoDeLinea(lineaEnMetros(u.puntos[0], u.puntos)));
    return {
      id: u.id,
      titulo: `Elemento de referencia · ${tipo.nombre}`,
      nombre: u.nombre.trim() || tipo.nombre,
      medidasDelTipo: tipo.medidas,
      quitar: "Borrar",
      ayudaQuitar: "Se borra del predio.",
      ayudaMover: `Mide ${largo} m de largo. Arrastrá sus puntos para cambiar el recorrido, o la línea para moverla entera. Tocá un punto blanco para agregar uno; con clic derecho en un punto, se borra.`,
      ayudaMedidas:
        u.tipo === "camino"
          ? "El mapa muestra el camino con su ancho."
          : "El alto de la valla se ve en el 3D.",
    };
  }
  if (u.clase === "referencia") {
    const tipo = tipoReferencia(u.tipo);
    return {
      id: u.id,
      titulo: `Elemento de referencia · ${tipo.nombre}`,
      nombre: u.nombre.trim() || tipo.nombre,
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
  guardar: (datos: DatosPredio) => Promise<ResultadoSimple>;
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
    const { origen } = guardadoInicial;
    const comun = (
      id: string,
      u: Pick<DatosPredio["lineas"][number], "medidas" | "descripcion" | "ordenLeyenda">,
    ): Comun => ({
      id,
      medidas: u.medidas,
      descripcion: u.descripcion ?? "",
      ordenLeyenda: u.ordenLeyenda,
    });
    return [
      ...guardadoInicial.instalaciones.map(
        (i): EnMapa => ({
          ...comun(i.instalacionId, i),
          clase: "instalacion",
          centro: aCoordenadas(origen, i.posicion),
          rotacion: i.rotacion,
        }),
      ),
      ...guardadoInicial.referencias.map(
        (r): EnMapa => ({
          ...comun(r.id, r),
          clase: "referencia",
          tipo: r.tipo,
          nombre: r.nombre ?? "",
          centro: aCoordenadas(origen, r.posicion),
          rotacion: r.rotacion,
        }),
      ),
      ...guardadoInicial.lineas.map(
        (l): EnMapa => ({
          ...comun(l.id, l),
          clase: "linea",
          tipo: l.tipo,
          nombre: l.nombre ?? "",
          puntos: lineaEnCoordenadas(origen, l.puntos),
        }),
      ),
    ];
  });
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [mapaListo, setMapaListo] = useState(false);
  const etiquetasRef = useRef<maplibregl.Marker[]>([]);
  const [herramienta, setHerramienta] = useState<Herramienta>("mover");
  /** El camino o la valla que se está dibujando punto a punto, o null. */
  const [trazando, setTrazando] = useState<ClaveTipoLinea | null>(null);
  const [fuente, setFuente] = useState<FuenteSatelital | null>(null);
  const [copyright, setCopyright] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recienGuardado, setRecienGuardado] = useState(false);
  const [guardando, startGuardar] = useTransition();

  const actual = useMemo<DatosPredio>(() => {
    const comun = (u: EnMapa) => ({
      medidas: u.medidas,
      descripcion: u.descripcion,
      ordenLeyenda: u.ordenLeyenda,
    });
    const enMetros = (u: { centro: Coordenadas; rotacion: number }) => ({
      posicion: aMetros(origen, u.centro),
      rotacion: u.rotacion,
    });
    return {
      origen,
      area: areaEnMetros(anillo, origen),
      instalaciones: ubicadas.flatMap((u) =>
        u.clase === "instalacion" ? [{ instalacionId: u.id, ...enMetros(u), ...comun(u) }] : [],
      ),
      referencias: ubicadas.flatMap((u) =>
        u.clase === "referencia"
          ? [{ id: u.id, tipo: u.tipo, nombre: u.nombre, ...enMetros(u), ...comun(u) }]
          : [],
      ),
      lineas: ubicadas.flatMap((u) =>
        u.clase === "linea"
          ? [
              {
                id: u.id,
                tipo: u.tipo,
                nombre: u.nombre,
                puntos: lineaEnMetros(origen, u.puntos),
                ...comun(u),
              },
            ]
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
    lineas: [],
  };

  // Lo que leen los manejadores del mapa, que se registran una sola vez.
  const vivo = useRef({
    herramienta: "mover" as Herramienta,
    ubicadas,
    seleccion: null as string | null,
    trazando: null as ClaveTipoLinea | null,
  });
  useLayoutEffect(() => {
    vivo.current = { herramienta, ubicadas, seleccion, trazando };
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
      // Los caminos van con su ancho real: en cada zoom, el doble de píxeles.
      mapa.addLayer({
        id: CAPA_CAMINOS,
        type: "line",
        source: "elementos",
        filter: ["==", ["get", "linea"], "camino"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": ["case", esElegida, 0.95, 0.8],
          "line-width": [
            "interpolate",
            ["exponential", 2],
            ["zoom"],
            0,
            ["get", "ancho"],
            24,
            ["*", ["get", "ancho"], 2 ** 24],
          ],
        },
      });
      mapa.addLayer({
        id: CAPA_VALLAS,
        type: "line",
        source: "elementos",
        filter: ["==", ["get", "linea"], "valla"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", esElegida, 4, 3],
          "line-dasharray": [2, 1],
        },
      });
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

      /** Si el puntero está sobre el camino o la valla que Terra Draw edita, o un punto suyo. */
      const tocaLaLineaEditada = (lngLat: maplibregl.LngLat) => {
        const dibujo = dibujoRef.current;
        // El área también está en Terra Draw y contiene casi todo: no cuenta.
        return (
          dibujo?.getMode() === MODO_EDITAR_LINEA &&
          dibujo
            .getFeaturesAtLngLat(lngLat, { pointerDistance: 12 })
            .some((f) => f.geometry.type !== "Polygon")
        );
      };

      // Arrastrar algo ubicado lo mueve (con «Mover y elegir» o con la paleta abierta).
      let arrastrando: { id: string; desfase: [number, number] } | null = null;
      const alBajar = (evento: maplibregl.MapLayerMouseEvent) => {
        if (vivo.current.herramienta === "area" || vivo.current.trazando || arrastrando) return;
        // Lo que empieza sobre el pin del origen mueve el origen, no el elemento.
        if (evento.originalEvent.target !== mapa.getCanvas()) return;
        if (tocaLaLineaEditada(evento.lngLat)) return;
        const id = evento.features?.[0]?.properties?.id as string | undefined;
        const ubicada = vivo.current.ubicadas.find((u) => u.id === id);
        if (!id || !ubicada) return;
        // Un camino o una valla no se arrastra desde acá: se elige en el
        // «click» y sus puntos los mueve Terra Draw.
        if (ubicada.clase === "linea") return;
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
        setUbicadas((lista) =>
          lista.map((u) => (u.id === id && u.clase !== "linea" ? { ...u, centro } : u)),
        );
      });
      mapa.on("mouseup", () => {
        if (!arrastrando) return;
        arrastrando = null;
        mapa.dragPan.enable();
      });
      mapa.on("click", (evento) => {
        if (vivo.current.herramienta === "area" || vivo.current.trazando) return;
        // Un punto del camino o la valla que se edita puede quedar fuera de su línea.
        if (tocaLaLineaEditada(evento.lngLat)) return;
        const [tocada] = mapa.queryRenderedFeatures(evento.point, { layers: CAPAS_TOCABLES });
        // Se elige al soltar: si se eligiera al bajar, Terra Draw tomaría este
        // mismo toque como propio y, en la mitad de un tramo, le sumaría un punto.
        if (tocada?.layer.id === CAPA_CAMINOS || tocada?.layer.id === CAPA_VALLAS) {
          setSeleccion(tocada.properties.id as string);
          return;
        }
        if (!tocada) setSeleccion(null);
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
          // Caminos y vallas (#47): se dibujan punto a punto…
          new TerraDrawLineStringMode({
            styles: {
              lineStringColor: AMARILLO,
              lineStringWidth: 3,
              closingPointColor: AMARILLO,
              closingPointOutlineColor: "#ffffff",
              coordinatePointColor: AMARILLO,
            },
          }),
          // …y el elegido se edita: el editor lo elige, no un toque en el mapa.
          new TerraDrawSelectMode({
            modeName: MODO_EDITAR_LINEA,
            allowManualSelection: false,
            allowManualDeselection: false,
            // Sin teclas: Supr borraría la línea entera a espaldas del editor.
            keyEvents: null,
            flags: {
              linestring: {
                feature: {
                  draggable: true,
                  coordinates: { draggable: true, midpoints: true, deletable: true },
                },
              },
            },
            styles: {
              selectedLineStringColor: "#ffffff",
              selectedLineStringWidth: 2,
              selectionPointColor: AMARILLO,
              selectionPointOutlineColor: "#1d1d1d",
              midPointColor: "#ffffff",
              midPointOutlineColor: "#1d1d1d",
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
        if (dibujo.getMode() === MODO_EDITAR_LINEA) {
          // Los puntos del camino o la valla que se edita.
          const id = vivo.current.seleccion;
          const puntos = id ? puntosEnDibujo(dibujo, id) : null;
          if (!puntos) return;
          setUbicadas((lista) =>
            lista.map((u) => (u.id === id && u.clase === "linea" ? { ...u, puntos } : u)),
          );
          return;
        }
        if (dibujo.getMode() !== "select") return;
        setAnillo(anilloDelArea(dibujo.getSnapshot()));
      });
      dibujo.on("finish", (id, contexto) => {
        if (contexto.mode === "linestring") {
          // Un camino o una valla recién dibujado: se agrega y queda elegido.
          const tipo = vivo.current.trazando;
          const puntos = puntosEnDibujo(dibujo, id);
          if (!tipo || !puntos) return;
          setUbicadas((lista) => [
            ...lista,
            {
              id: String(id),
              clase: "linea",
              tipo,
              nombre: "",
              puntos,
              medidas: medidasDeLinea(tipo, null),
              descripcion: "",
              ordenLeyenda: null,
            },
          ]);
          setTrazando(null);
          setSeleccion(String(id));
          return;
        }
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
      if (u.clase !== "instalacion" && !numero && !u.nombre.trim()) return [];
      const elemento = document.createElement("span");
      elemento.className =
        "pointer-events-none rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white";
      const nombre = nombreEnMapa(u, nombres);
      elemento.textContent = numero ? `${numero} · ${nombre}` : nombre;
      const { lat, lng } = dondeEsta(u);
      // Debajo del centro, para no tapar el punto que se arrastra.
      return [
        new maplibregl.Marker({
          element: elemento,
          offset: u.clase === "instalacion" ? [0, 0] : [0, 16],
        })
          .setLngLat([lng, lat])
          .addTo(mapa),
      ];
    });
  }, [mapaListo, ubicadas, instalaciones, seleccion, numeros]);

  // El camino o la valla elegidos pasan a Terra Draw para editar sus puntos;
  // los demás, no. Lo que se dibuja de nuevo lo agrega el «finish».
  useEffect(() => {
    const dibujo = dibujoRef.current;
    if (!dibujo || !mapaListo) return;
    const editando =
      herramienta === "area" || trazando
        ? undefined
        : vivo.current.ubicadas.find((u) => u.id === seleccion && u.clase === "linea");
    // Salir del modo de edición limpia los puntos de la línea anterior.
    if (dibujo.getMode() === MODO_EDITAR_LINEA) dibujo.setMode("static");
    const sobran = dibujo
      .getSnapshot()
      .filter((f) => f.properties.mode === "linestring" && f.id !== editando?.id)
      .flatMap((f) => (f.id === undefined ? [] : [f.id]));
    if (sobran.length > 0) dibujo.removeFeatures(sobran);
    if (!editando || editando.clase !== "linea") return;
    if (!dibujo.getSnapshotFeature(editando.id)) {
      dibujo.addFeatures([
        {
          id: editando.id,
          type: "Feature",
          geometry: { type: "LineString", coordinates: editando.puntos.map(aLngLat9) },
          properties: { mode: "linestring" },
        },
      ]);
    }
    dibujo.selectFeature(editando.id, MODO_EDITAR_LINEA);
  }, [mapaListo, herramienta, trazando, seleccion]);

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
            clase: "instalacion",
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
        clase: "referencia",
        tipo,
        nombre: "",
        centro: { lat, lng },
        rotacion: 0,
        medidas: medidasDeReferencia(tipo, null),
        descripcion: "",
        ordenLeyenda: null,
      },
    ]);
    setSeleccion(id);
  }

  /**
   * Empieza a dibujar un camino o una valla punto a punto (#47). Como los
   * demás elementos de referencia, entra sin número.
   */
  function trazar(tipo: ClaveTipoLinea) {
    setSeleccion(null);
    setTrazando(tipo);
    dibujoRef.current?.setMode("linestring");
  }

  function dejarDeTrazar() {
    setTrazando(null);
    // Salir del modo descarta lo que quedó a medio dibujar.
    dibujoRef.current?.setMode("static");
  }

  function elegirElemento(id: string) {
    const mapa = mapaRef.current;
    const ubicada = ubicadas.find((u) => u.id === id);
    if (mapa && ubicada) {
      const { lat, lng } = dondeEsta(ubicada);
      mapa.easeTo({ center: [lng, lat] });
    }
    if (herramienta === "area") elegirHerramienta("mover");
    if (trazando) dejarDeTrazar();
    setSeleccion(id);
  }

  function cambiarUbicada(id: string, cambio: CambioEnMapa) {
    setUbicadas((lista) =>
      lista.map((u) => (u.id === id ? ({ ...u, ...cambio } as EnMapa) : u)),
    );
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
    setTrazando(null);
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
        {trazando ? (
          <>
            <p className="font-medium">Dibujar {tipoLinea(trazando).nombre.toLowerCase()}</p>
            <p className="text-muted-foreground">
              Tocá el mapa para marcar cada punto. Para terminar, tocá de nuevo el último punto
              o apretá Enter. Con Esc, se descarta lo dibujado.
            </p>
            <Button variant="outline" className="h-9 justify-start rounded-lg" onClick={dejarDeTrazar}>
              <X className="size-4" />
              Cancelar
            </Button>
          </>
        ) : herramienta === "referencias" ? (
          <>
            <p className="font-medium">Elementos de referencia</p>
            <p className="text-muted-foreground">
              Tocá uno para agregarlo en el centro del mapa. Después se arrastra, se gira y se
              le cambian las medidas como a una instalación. Los caminos y las vallas se dibujan
              punto a punto.
            </p>
            <PaletaReferencias onAgregar={agregarReferencia} onTrazar={trazar} />
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
        ubicadas={new Set(ubicadas.flatMap((u) => (u.clase === "instalacion" ? [u.id] : [])))}
        seleccion={seleccion}
        onElegir={elegirElemento}
        onUbicar={ubicar}
      />

      {elegida && panel ? (
        <PanelElemento
          elemento={panel}
          numero={numeros.get(elegida.id) ?? null}
          rotacion={elegida.clase === "linea" ? null : elegida.rotacion}
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
          {elegida.clase !== "instalacion" ? (
            <CampoNombre
              key={`nombre-${elegida.id}`}
              nombre={elegida.nombre}
              onNombre={(nombre) => cambiarUbicada(elegida.id, { nombre })}
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
          {/* Alto entre 16 y 19 y aire libre de 10 a los costados y arriba, 5 abajo. */}
          <div className="pointer-events-none absolute bottom-[5px] left-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo de Google sin modificar */}
            <img src={LOGO_GOOGLE_MAPS} alt="Google Maps" className="h-[18px] w-auto" />
          </div>
          <p className="absolute bottom-0 right-0 max-w-[60%] bg-white/80 px-1.5 py-0.5 text-right text-[11px] text-neutral-800">
            {copyright || "Google Maps"}
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
