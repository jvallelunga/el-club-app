# Mapa satelital del editor de predio: MapLibre, Terra Draw y posiciones en metros

El editor de predio usa MapLibre GL para mostrar el mapa y Terra Draw para dibujar. Los dos son de código abierto y no atan a ningún proveedor. Las imágenes vienen de la Google Map Tiles API (2D, satelital), con caída a Esri World Imagery si no hay clave o si Google falla. El predio guarda todo en metros desde su origen (lat/lng propio), nunca en lat/lng por punto. Así, cambiar de proveedor de imágenes es cambiar solo la fuente del mapa.

No se usa el SDK de Google Maps: su librería de dibujo está discontinuada.

## Consequences

- **Términos de Google:** se muestran el logo de Google y el copyright de la zona visible (`/tile/v1/viewport`), que se actualiza al mover el mapa. Nada los tapa. La foto satelital no se usa en el 3D.
- **Costo:** la clave `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` está restringida a la Map Tiles API y a los dominios de la app. Antes de pasar la cuenta a pago hay que poner el tope diario (#49).
- **Arranque sin coordenadas:** si la sede no tiene coordenadas, el editor busca la dirección del club en Nominatim (OpenStreetMap). Es gratis, sin clave, y se usa con pocos pedidos cacheados un mes. Si no encuentra nada, arranca en Buenos Aires.
- **Worker de MapLibre:** Turbopack no lo resuelve, así que va copiado en `public/maplibre/`. Un test avisa si queda desfasado de la versión instalada.

Decidido el 18/11/2026 con Jerónimo, en #26 y #42. Research: `docs/research/mapa-satelital.md`.
