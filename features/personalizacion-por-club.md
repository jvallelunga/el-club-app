# Personalización por club

Segundo ítem del paso 1. Todavía no implementado.

## Objetivo

Cada club personaliza la app con su nombre, escudo o logo, paleta de colores, y el nombre e ícono de la PWA. El primer club real va a ser Los Cardos Rugby Club (Tandil), pero no va fijo en el código ni en los mocks.

## Alcance

- El modelo de `club` guarda la marca: nombre, slug, escudo, logo en PNG, paleta, nombre de la PWA e ícono. El dominio propio se resuelve en el [ítem 9](dominio.md).
- La app, el encabezado, el shell y las PWA leen esa marca, no un nombre fijo de producto.
- Las funcionalidades son las mismas para todos los clubes; solo cambia la personalización.
- Hasta que se cree el primer club real, no hay un club precargado en el código ni en los mocks.

## Criterios de aceptación

- El primer club real (Los Cardos) se crea con el formulario, no viene hardcodeado. Los mocks y los datos de ejemplo usan clubes genéricos.
- El tema (paleta) y el nombre e ícono de la PWA salen de los datos del club, no de constantes de «Copa Raíces».
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.
- No se implementan todavía el tablero del club, el alta de torneos ni el dominio.

## Decisiones

- Es multi-club a futuro: cada club personaliza nombre, escudo o logo, paleta, dominio y PWA; las funcionalidades son las mismas (15/11/2026).
- Los Cardos Rugby Club (Tandil) es el primer club real (15/11/2026), pero no puede estar fijo en el código, los mocks, el copy ni los datos de ejemplo (17/11/2026 08:26).
- Al crear un club se piden solo el escudo a color, un color de marca y un color claro (default `#ffffff`). El resto de la paleta, las tipografías, las variantes de logo (vector, transparente, monocromo) y la PWA se cargan después, en este ítem de personalización (17/11/2026 09:04).
- Al crear un club, la paleta es de hasta 4 colores: el 1 es el principal (obligatorio); 2, 3 y 4 son opcionales para detalles y, si faltan, se derivan del principal. El color claro de fondo se pide aparte (default `#ffffff`). Tipografías, variantes de logo y PWA siguen en este ítem de personalización (17/11/2026 09:21).
- Al crear un club, la paleta es de hasta 3 colores: el 1 es el principal (obligatorio); 2 y 3 son opcionales para detalles y, si faltan, se derivan del principal. El color claro de fondo se pide aparte (default `#ffffff`). Tipografías, variantes de logo y PWA siguen en este ítem de personalización (17/11/2026 09:39).
- El 17/11/2026 09:44 el alta real de un club ya pide y guarda escudo, paleta (hasta 3 colores + color claro) y dominio opcional. Tipografías, variantes de logo (vector, transparente, monocromo) y la PWA siguen en este ítem de personalización (17/11/2026 09:44).
- El 17/11/2026 10:54 Jerónimo aprobó editar un club desde la lista del Super Admin: la fila de la tarjeta (incluido el chevron) entra a `/super-admin/clubes/<slug>/editar`; «Entrar» sigue yendo al admin del club (`/c/<slug>/admin`); no hay un botón «Editar». El formulario reusa el de crear club, con los datos precargados (nombre, escudo que se puede mantener o reemplazar, color principal, color claro, colores 2 y 3, y dominio opcional) y el identificador en solo lectura. Un action solo de Super Admin actualiza el club y, si se sube un escudo nuevo, reemplaza el archivo en el Storage para no dejar el anterior (17/11/2026 10:54).
- El 17/11/2026 12:47 Jerónimo aprobó adaptar el tema de producto al logo: primario `#FF8C42`, superficies blancas y neutros cálidos, con hover/active derivados y un tinte claro. El blanco sobre ese naranja no cumple contraste AA (2,31:1), así que los botones van con texto oscuro (`#1c1917`); los enlaces sobre fondo claro usan un naranja más oscuro (el `#E8732A` que se consideró queda corto para texto corrido). El 17/11/2026 12:48 aclaró que este tema naranja vale solo para superficies genéricas de producto (ingreso sin club, selector de club, Super Admin). Si se entra por un club (host o subdominio, `/c/<slug>/...`, o el ingreso con contexto de ese club) el tema usa la paleta del club (`color_principal`, `color_claro`, etc.) y se muestra el escudo o las iniciales, no el logo de producto (17/11/2026 12:47 y 12:48).
