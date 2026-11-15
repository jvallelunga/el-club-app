# Personalización por club

Segundo ítem del paso 1. Todavía no implementado.

## Objetivo

Cada club personaliza la app con su nombre, escudo o logo, paleta de colores, y el nombre e ícono de la PWA. El primer club es Los Cardos Rugby Club (Tandil).

## Alcance

- El modelo de `club` guarda la marca: nombre, slug, escudo, logo en PNG, paleta, nombre de la PWA e ícono. El dominio propio se resuelve en el [ítem 9](dominio.md).
- La app, el encabezado, el shell y las PWA leen esa marca, no un nombre fijo de producto.
- Las funcionalidades son las mismas para todos los clubes; solo cambia la personalización.
- Hasta que haya más de un club, Los Cardos es el único instanciado.

## Criterios de aceptación

- Los Cardos está cargado como primer club, con su nombre y su escudo.
- El tema (paleta) y el nombre e ícono de la PWA salen de los datos del club, no de constantes de «Copa Raíces».
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.
- No se implementan todavía el tablero del club, el alta de torneos ni el dominio.

## Decisiones

- Es multi-club a futuro: cada club personaliza nombre, escudo o logo, paleta, dominio y PWA; las funcionalidades son las mismas (15/11/2026).
- Los Cardos Rugby Club (Tandil) es el primer caso (15/11/2026).
