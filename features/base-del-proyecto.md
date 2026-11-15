# Base del proyecto

Primer ítem del paso 1. Todavía no implementado.

## Objetivo

Dejar en este repo el stack que ya funcionó en [copa-raices](https://github.com/jvallelunga/copa-raices): Next.js y Supabase, para arrancar la app del club desde una base conocida.

## Alcance

- Copiar de copa-raices lo necesario para levantar la app: Next.js (App Router), Supabase, la organización del código (`src/dominio`, `src/datos`, features) y las convenciones de trabajo (decisiones en `features/`, DER en el mismo commit que el modelo).
- No se reescribe el stack. Se trae lo que sirva y se adapta el nombre y las rutas a El Club.
- Los ambientes separados de desarrollo y producción **quedan para después**. En este ítem basta con un entorno de trabajo (local y, si hace falta, un solo proyecto de Supabase y un deploy de desarrollo). La separación dev/prod se anota como pendiente, no se implementa acá.

## Criterios de aceptación

- El repo tiene una app Next.js que buildéa, con el mismo estilo de carpetas que copa-raices.
- Hay un proyecto de Supabase (o la CLI local) con una migración inicial alineada al [DER](../docs/der-el-club.mmd), idempotente.
- El README explica cómo levantarla en local.
- Queda escrito, sin implementar, que más adelante hay un ambiente de desarrollo y uno de producción, como en copa-raices.
- No se implementan todavía la marca del club, el tablero, los torneos ni el dominio.

## Decisiones

- copa-raices queda congelado como base y ejemplo; el código se copia cuando haga falta (15/11/2026).
- Se trabaja de a una cosa: este ítem es solo la base.
