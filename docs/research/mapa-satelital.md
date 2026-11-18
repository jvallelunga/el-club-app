# Mapa satelital para el editor de predio

**Fecha:** 18/11/2026 · **Issue:** #26

## Pregunta

¿Qué proveedor de imagen satelital (y qué librería de dibujo) usar en el editor 2D del predio, donde un Super Admin dibuja el polígono del predio y ubica canchas, piletas, edificios, árboles, caminos y cercos? El uso es de escritorio, de un solo usuario, unas 20-50 sesiones por mes con algunos cientos de tiles cada una. Se busca costo cero o casi cero e imagen aceptable en Tandil (≈ -37.32, -59.13).

> **Nota de método.** La red de esta sesión no dejó abrir de forma directa los sitios de Google, Mapbox, Esri, MapTiler ni EOX. Los datos de esos proveedores salen de extractos de sus páginas oficiales devueltos por un buscador, no de una lectura completa. Las versiones y licencias de las librerías se verificaron directo contra el registro de npm y los repos de GitHub. Conviene revisar los precios en las páginas enlazadas antes de crear cuentas.

## Recomendación

**Usar Esri World Imagery a través de ArcGIS Location Platform, con MapLibre GL JS y Terra Draw.**

- **Costo:** $0. El nivel gratuito incluye 2.000.000 de tiles de mapa base por mes [8]. 50 sesiones × ~300 tiles ≈ 15.000 tiles por mes, menos del 1 % del cupo.
- **Tarjeta:** las cuentas nuevas traen el pago por uso desactivado por defecto [9], así que no se puede facturar de más por accidente. No encontré una fuente primaria que diga de forma explícita que el alta no pide tarjeta: hay que confirmarlo al registrarse.
- **Stack abierto:** MapLibre GL tiene licencia BSD-3-Clause y Terra Draw, MIT [20][21]. Esri publica un plugin oficial para MapLibre (`@esri/maplibre-arcgis`, Apache-2.0) [20][12]. Si después se cambia de proveedor, se cambia solo la fuente de tiles. El dibujo y el modelo en metros no se tocan.

**Contras:**

- No hay ninguna fuente primaria que documente la calidad de imagen en Tandil, ni para Esri ni para los demás proveedores. Antes de cerrar la decisión, conviene comparar a ojo un club real en Esri y en Google Maps, en modo satélite al máximo zoom.
- **Alternativa:** si en Tandil se ve claramente mejor la imagen de Google, usar Google Maps JavaScript API con el adaptador de Google de Terra Draw. El costo también es $0, porque hay 10.000 cargas de mapa gratis por mes [1]. La diferencia es que exige una cuenta de facturación con medio de pago [4], y la Drawing Library propia de Google está discontinuada [6].

## Comparación

| | Esri (Location Platform) | Google Maps JS API | Google Map Tiles API 2D | Mapbox | MapTiler | EOX Sentinel-2 cloudless |
|---|---|---|---|---|---|---|
| Nivel gratis por mes | 2M tiles [8] | 10.000 cargas de mapa (Dynamic Maps) [1] | 100.000 requests [2] | 50.000 cargas en GL JS [13] | Solo uso no comercial [16] | Gratis con atribución, salvo comercial (2018+) [18] |
| Precio después del cupo | US$0,15 cada 1.000 tiles [8] | US$7 cada 1.000 cargas [1] | US$0,60 cada 1.000 requests [3] | ~US$5 cada 1.000 cargas [13] | Plan Flex ~US$25-30/mes (fuentes secundarias) [16] | Licencia comercial aparte [18] |
| Costo estimado (50 sesiones) | $0 | $0 | $0 | $0 | Pago, si el uso cuenta como comercial | No sirve (ver detalle) |
| ¿Pide tarjeta? | Pago por uso desactivado por defecto; no confirmado [9] | Sí. La Demo Key no, pero no es para producción [4][5] | Sí [4] | Hay información contradictoria [14] | No (plan Free) | No |
| Restringir la key por dominio | Sí, por referrer [11] | Sí, por referrer HTTP [4] | Sí [4] | Sí, con URL restrictions (no verificado) | No verificado | No usa key |
| Librería de cliente | MapLibre + plugin de Esri, o ArcGIS JS SDK | Maps JS (propietaria) | Cualquiera, con atribución de Google [7] | Mapbox GL JS (propietaria) o MapLibre [15] | MapLibre / SDK propio | Cualquiera (WMTS) |
| Resolución documentada | 0,3-1,2 m según la zona [10] | Se consulta por punto con `MaxZoomService` [19] | Igual que Maps JS (no documentada por zona) | Global a z16 (1-2 m); regional a z18 [17] | No verificado | ~10 m (Sentinel-2) |

## Detalle por proveedor

### Esri / ArcGIS Location Platform

- **Precio:** 2M tiles gratis por mes y después US$0,15 cada 1.000 [8]. Cada suscripción arranca con el pago por uso desactivado, y solo al activarlo se puede pasar del cupo gratis [9].
- **Key:** la API key necesita el privilegio `premium:user:basemaps` para el servicio Basemap Styles. Se puede limitar por HTTP referrer, con comodín en el subdominio [11].
- **Atribución:** hay que mostrar "Powered by Esri" y además los proveedores de datos que informa la metadata del servicio [11][12]. MapLibre muestra la atribución de datos de forma automática, pero "Powered by Esri" hay que agregarlo a mano [12].
- **Dibujar encima:** es el uso normal de un mapa base, sin restricción documentada.
- **Caché:** el mapa base World Imagery no está pensado para exportar tiles para uso offline. Para eso existe otra capa, "World Imagery (for Export)" [10a].
- **Uso como textura en three.js:** no encontré una fuente primaria al respecto. No está previsto, así que conviene no hacerlo.
- **Resolución:** según la documentación de 2025-2026, el producto Maxar Vivid Standard va de 1,2 m a 0,6 m en la mayor parte del mundo. Vivid Premium llega a 30 cm en zonas seleccionadas, y hay aportes de la comunidad con 30-3 cm [10]. El servicio expone metadata por píxel (resolución y fecha) [10], así que se puede consultar en Tandil. No hay un dato publicado para esa zona.
- **URL directa** (`server.arcgisonline.com/.../World_Imagery`): no encontré términos vigentes y claros para usarla sin key. Las respuestas en el foro de Esri son de usuarios y antiguas [10b]. No conviene apoyarse en ella: es mejor usar Location Platform, que tiene términos claros y un cupo grande.

### Google Maps

- **Maps JavaScript API** (`mapTypeId: 'satellite'`): Dynamic Maps está en el tier Essentials, con 10.000 cargas gratis por mes y después US$7 cada 1.000 [1].
- **Facturación:** una key estándar exige una cuenta de facturación con medio de pago, aunque el uso quede dentro del cupo gratis [4]. La "Maps Demo Key" funciona sin tarjeta, pero tiene un límite diario, cubre un conjunto reducido de APIs y Google dice que no es para producción [5].
- **Key:** se puede restringir por referrer HTTP y por API [4].
- **Map Tiles API 2D:** tiles satelitales para usar con otros renderizadores. Da 100.000 requests gratis por mes y después US$0,60 cada 1.000 [2][3]. Necesita un token de sesión que se crea con `createSession` [3].
- **Atribución de Map Tiles:** hay que mostrar el logo de Google sin modificar, más la atribución del campo `copyright` de cada respuesta. Ese texto cambia según el viewport, y ningún overlay puede taparlo [7].
- **Caché:** los Service Specific Terms fijan límites de caché por producto [6a]. No verifiqué la cláusula exacta para tiles satelitales: hay que leer la sección de Map Tiles antes de cachear nada.
- **Uso como textura en three.js:** no está verificado y no se recomienda.
- **Resolución:** `MaxZoomService.getMaxZoomAtLatLng` devuelve el zoom satelital máximo en un punto dado [19]. Sirve para medir Tandil en concreto. No hay un dato publicado.
- **Drawing Library:** está discontinuada desde el 08/08/2025 y Google anunció que deja de estar disponible en la versión de mayo de 2026. Google sugiere Terra Draw como alternativa [6]. **No hay que usarla.**
- **React:** `@vis.gl/react-google-maps` (MIT, v1.10.2) [20] funciona en un client component.

### Mapbox

- **Precio:** 50.000 cargas de mapa gratis por mes en GL JS [13]. El dato del cupo de Raster Tiles no se pudo confirmar.
- **Tarjeta:** la guía oficial de alta describe dos caminos [14]. Sin tarjeta, la cuenta tiene límites de prueba. Con tarjeta, se accede al nivel gratuito completo. No queda claro cuál aplica a nuestro caso.
- **Satélite:** cobertura global hasta z16 (1-2 m), regional hasta z18 (0,6-0,3 m) y selecta en z21+ [17]. No se documenta si Tandil tiene cobertura regional.
- **Licencia:** Mapbox GL JS v2+ es propietaria y solo se puede usar con una cuenta Mapbox activa [22].
- **Uso con MapLibre:** Mapbox tiene una guía oficial para usar sus tiles en MapLibre [15]. Hay que mostrar el logo de Mapbox y la atribución de texto [15a].
- **Dibujo:** `@mapbox/mapbox-gl-draw` (ISC, v1.5.2, publicada el 14/09/2026) [20] dibuja polígonos y líneas, pero no rota rectángulos de forma nativa. Terra Draw tiene adaptador para Mapbox [21].

### MapTiler

- **Plan Free:** limitado por contrato a uso no comercial o de I+D para productos comerciales [16]. El Super Admin usa la app para un servicio a clubes, así que el plan gratis no corresponde.
- **Plan pago:** los precios del plan Flex no se pudieron leer de la página oficial. Fuentes secundarias dicen US$25-30 por mes [16].
- **Conclusión:** queda descartado por costo, frente a opciones gratuitas.

### Opciones libres (EOX Sentinel-2 cloudless)

- **Licencia:** el mosaico 2016 es CC BY 4.0. Los años 2018-2025 son CC BY-NC-SA 4.0, y el uso comercial requiere una licencia aparte [18].
- **Resolución:** es la de Sentinel-2, del orden de 10 m por píxel. Alcanza para ubicar el predio, pero no para distinguir canchas o árboles. **No sirve** para el editor.

## Librería de dibujo

**Terra Draw** (MIT, v1.40.0, publicada el 15/11/2026) [20][21]:

- **Modos:** polígono, línea, punto, rectángulo y "rectángulo en ángulo". El modo selección permite arrastrar, escalar y rotar [21a]. Cubre polígono libre, caminos, cercos y canchas o edificios como rectángulos rotables.
- **Adaptadores:** MapLibre, Google Maps, Mapbox, Leaflet, OpenLayers y ArcGIS [21]. Por eso no ata al proveedor.
- **Compatibilidad:** el adaptador de MapLibre declara `maplibre-gl >=4` como peer dependency [21b]. El README menciona v4/5 y la versión actual de MapLibre es 6.19.0 [20]. Hay que probar la compatibilidad con v6 al instalar, o fijar `maplibre-gl@5`.
- **Alternativa:** Leaflet + `@geoman-io/leaflet-geoman-free` (MIT) [20]. Funciona bien, pero la rotación avanzada está en la versión Pro, que es paga (no verificado en fuente primaria). Leaflet no tiene release estable desde 2023 (1.9.4) [20].

**Next.js App Router:** todas estas librerías usan `window` y WebGL. Hay que cargarlas en un componente `'use client'` con `next/dynamic` y `{ ssr: false }`. Esto aplica a cualquier librería de mapas en el navegador, no hay una incompatibilidad específica.

## Pasos manuales

Estos pasos los tiene que hacer una persona (Jerónimo o quien administre las cuentas).

1. Crear una cuenta de **ArcGIS Location Platform** en location.arcgis.com.
2. Al registrarse, confirmar si pide tarjeta, y dejar **desactivado** el pago por uso.
3. En el panel de desarrollador, crear una **API key** con el privilegio *Basemaps* (`premium:user:basemaps`).
4. Cargar en la key los **referrers permitidos**: el dominio de producción de Vercel, el patrón de previews (`https://*-<equipo>.vercel.app`, si se permite el comodín) y `http://localhost:3000`.
5. Guardar la key en Vercel (Production, Preview y Development) y en `.env.local` como **`NEXT_PUBLIC_ARCGIS_API_KEY`**. Es pública por diseño: la protegen la restricción por referrer y el pago por uso apagado.
6. *(Opcional, para la comparación de calidad)* Abrir un club de Tandil en Google Maps en modo satélite y en el visor de World Imagery, y comparar.
7. *(Solo si se elige Google)* Crear un proyecto en Google Cloud con cuenta de facturación y tarjeta. Habilitar Maps JavaScript API. Crear una key restringida por referrer y solo para esa API, y guardarla como `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Conviene además poner una cuota diaria baja como tope.

## Fuentes

1. Google Maps Platform, lista de precios: https://developers.google.com/maps/billing-and-pricing/pricing
2. Google Maps Platform, categorías de precios (100.000 gratis por SKU de Map Tiles): https://developers.google.com/maps/billing-and-pricing/pricing-categories
3. Map Tiles API, uso, facturación y tokens de sesión: https://developers.google.com/maps/documentation/tile/usage-and-billing y https://developers.google.com/maps/documentation/tile/session_tokens
4. Google Maps JavaScript API, uso de API keys (restricciones y facturación): https://developers.google.com/maps/documentation/javascript/get-api-key
5. Google Maps Demo Key: https://developers.google.com/maps/demo-key
6. Google Maps Platform, deprecaciones (Drawing Library): https://developers.google.com/maps/deprecations y https://developers.google.com/maps/documentation/javascript/drawinglayer
   - 6a. Google Maps Platform Service Specific Terms: https://cloud.google.com/maps-platform/terms/maps-service-terms
7. Map Tiles API, políticas y atribución: https://developers.google.com/maps/documentation/tile/policies
8. ArcGIS Location Platform, precios: https://location.arcgis.com/pricing/ y https://developers.arcgis.com/pricing
9. ArcGIS Location Platform, FAQ: https://location.arcgis.com/faq/
10. Esri World Imagery, documentación 2026: https://doc.arcgis.com/en/data-appliance/2026/imagery-elevation/world-imagery.htm
    - 10a. World Imagery, página del ítem (términos y exportación): https://goto.arcgis.com/maps/World_Imagery
    - 10b. Esri Community, términos de los servicios HTTP: https://community.esri.com/t5/arcgis-online-questions/current-terms-of-use-for-http-services/td-p/173432
11. ArcGIS, servicio Basemap Styles y API keys: https://developers.arcgis.com/documentation/mapping-apis-and-services/maps/services/basemap-layer-service/ y https://developers.arcgis.com/documentation/security-and-authentication/api-key-authentication/tutorials/create-an-api-key/location-platform/
12. ArcGIS, atribución de Esri y de datos: https://developers.arcgis.com/documentation/esri-and-data-attribution/ y https://developers.arcgis.com/maplibre-gl-js/maps/display-a-map
13. Mapbox, precios: https://www.mapbox.com/pricing/ y https://docs.mapbox.com/accounts/overview/pricing/
14. Mapbox, alta de cuenta: https://docs.mapbox.com/accounts/guides/signup/
15. Mapbox, uso de APIs de Mapbox en MapLibre GL JS: https://docs.mapbox.com/help/dive-deeper/mapbox-in-maplibre/
    - 15a. Mapbox, atribución requerida: https://docs.mapbox.com/help/faq/what-type-of-attribution-is-required
16. MapTiler Cloud, términos y precios: https://www.maptiler.com/cloud/terms/ y https://www.maptiler.com/cloud/pricing/
17. Mapbox Satellite, referencia del tileset: https://docs.mapbox.com/data/tilesets/reference/mapbox-satellite/
18. EOX, licencia no comercial de Sentinel-2 cloudless: https://cloudless.eox.at/license-non-commercial y https://eox.at/2025/03/sentinel-2-cloudless-2024/
19. Google Maps JavaScript API, `MaxZoomService`: https://developers.google.com/maps/documentation/javascript/reference/max-zoom
20. Registro de npm, consultado el 18/11/2026 (versión, licencia y fecha): `terra-draw` 1.40.0 MIT; `maplibre-gl` 6.19.0 BSD-3-Clause; `mapbox-gl` 3.35.0 propietaria; `@mapbox/mapbox-gl-draw` 1.5.2 ISC; `@geoman-io/leaflet-geoman-free` 2.20.6 MIT; `leaflet` 1.9.4 BSD-2-Clause; `@vis.gl/react-google-maps` 1.10.2 MIT; `@esri/maplibre-arcgis` 1.3.3 Apache-2.0. https://registry.npmjs.org/
21. Terra Draw, README (adaptadores): https://github.com/JamesLMilner/terra-draw
    - 21a. Terra Draw, guía de modos: https://github.com/JamesLMilner/terra-draw/blob/main/guides/4.MODES.md
    - 21b. `terra-draw-maplibre-gl-adapter`, package.json: https://github.com/JamesLMilner/terra-draw/blob/main/packages/terra-draw-maplibre-gl-adapter/package.json
22. Mapbox GL JS, LICENSE.txt: https://github.com/mapbox/mapbox-gl-js/blob/main/LICENSE.txt
