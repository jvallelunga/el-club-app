# Base del proyecto

Primer ítem del paso 1. [#1](https://github.com/jvallelunga/el-club-app/issues/1).

## Objetivo

Dejar en este repo el stack que ya funcionó en [copa-raices](https://github.com/jvallelunga/copa-raices): Next.js y Supabase, para arrancar la app del club desde una base conocida.

## Qué se copió

- Next.js 16.4.3 (App Router), React 19.3.1, TypeScript, Node 22.
- Tailwind 4, PostCSS, `components.json` de shadcn (estilo radix-nova, baseColor neutral), `next-themes`.
- ESLint (`eslint-config-next` 16.4.3) con las reglas de capas de copa-raices (`dominio`, `ui`, `nativos`, `compartidos`, `app`).
- Vitest (incluido el alias de `server-only`).
- Carpetas vacías `src/dominio`, `src/datos` (con `consultas` y `comandos`), `src/ui` (`fundamentos`, `nativos`, `compartidos`, `features`).
- Helpers de Supabase en `src/datos/supabase.ts` (`supabaseAnon`, `supabaseService`), leyendo `.env.example` / `.env.local`. Tipos mínimos en `src/datos/tipos.ts`.
- Proveedor de TanStack Query y proveedor de tema, como en la arquitectura de copa-raices.
- `supabase/config.toml` para un entorno local, y la convención de migraciones idempotentes.
- `vercel.json` con región `gru1` (São Paulo), el mismo criterio de copa-raices. El proyecto de Vercel no se crea acá.

## Qué se dejó afuera

- Todas las features del torneo: admin, mesa, tablero, acceso por equipos, fixture, plantillas, push, analítica (PostHog y Vercel Analytics).
- Clerk y cualquier implementación de roles o permisos (van en el [#15](https://github.com/jvallelunga/el-club-app/issues/15)).
- Storybook, mocks, lector de DNI (`zxing`, script de `postinstall`), Excel, drag-and-drop, QR, íconos y marca de Copa Raíces.
- Proyectos de Supabase y de Vercel (desarrollo y producción). Se crean después, con el OK de Jerónimo.

## Criterios de aceptación

- El repo tiene una app Next.js que buildéa, con el mismo estilo de carpetas que copa-raices.
- Hay una migración inicial idempotente, alineada al [DER](../docs/der-el-club.mmd), que solo crea la tabla `club` (`id`, `slug`, `nombre`, `creado_en`), vacía, con RLS activado y sin políticas todavía.
- La home muestra «El Club App».
- Los tokens de tema son una paleta neutra provisional, lista para el ítem 2.
- El README explica cómo levantarla en local.
- Queda escrito, sin implementar, que más adelante hay un ambiente de desarrollo y uno de producción.

## Decisiones

- copa-raices queda congelado como base y ejemplo; el código se copia cuando haga falta (15/11/2026).
- Se trabaja de a una cosa: este ítem es solo la base (15/11/2026).
- La columna de alta se llama `creado_en`, como en copa-raices, no `created_at` (15/11/2026).
- No se siembra ningún club fijo (tampoco Los Cardos): el primer club real se crea con el formulario cuando toque (17/11/2026 08:26).
- Tipografía de arranque: solo Inter. Bodoni y Montserrat eran de la identidad de Copa Raíces.

- El 17/11/2026 12:42 Jerónimo aprobó el logo de El Club App: ícono cuadrado redondeado, fondo sólido `#FF8C42`, escudo blanco cuyo contorno forma una C abierta a la derecha (cortes en ángulo arriba y abajo a la derecha), sin estrella, plano y sin degradés. Vive en `public/marca/` (`logo-icon.svg` con fondo, `logo-mark.svg` solo la C blanca, `logo-mark-naranja.svg` la C en `#FF8C42` para fondos claros). Se usa como favicon e ícono de la app, y junto al nombre «El Club App» en el ingreso genérico, el selector de club y la cabecera del Super Admin. No reemplaza el escudo de un club (17/11/2026 12:42).

- El 17/11/2026 12:47 Jerónimo aprobó adaptar el tema de producto al logo: primario `#FF8C42`, superficies blancas y neutros cálidos, con hover/active derivados y un tinte claro. El blanco sobre ese naranja no cumple contraste AA (2,31:1), así que los botones van con texto oscuro (`#1c1917`); los enlaces sobre fondo claro usan un naranja más oscuro (el `#E8732A` que se consideró queda corto para texto corrido). El 17/11/2026 12:48 aclaró que este tema naranja vale solo para superficies genéricas de producto (ingreso sin club, selector de club, Super Admin). Si se entra por un club (host o subdominio, `/c/<slug>/...`, o el ingreso con contexto de ese club) el tema usa la paleta del club (`color_principal`, `color_claro`, etc.) y se muestra el escudo o las iniciales, no el logo de producto (17/11/2026 12:47 y 12:48).

## Decisión: mobile first, y optimizado para tablet y desktop

Criterio de desarrollo de toda la app, no solo del admin:

- 15/11/2026 22:23 (hora de Argentina): el admin es responsive y se diseña **mobile first**. Cada pantalla del admin se piensa primero para el celular y después se adapta a tablet y escritorio. Los mocks del admin se presentan primero en tamaño celular.
- 16/11/2026 17:31: en la versión desktop el sistema tiene que verse optimizado para desktop, no como una columna de celular.
- 16/11/2026 17:32: es una decisión de desarrollo para **toda la app**: mobile first, y optimizada para tablet y desktop.
