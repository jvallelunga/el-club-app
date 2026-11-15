# App del club

Tercer ítem del paso 1. Todavía no implementado.

## Objetivo

La app y el tablero en vivo son del club. El club es el dueño de los torneos: los crea y los administra desde el admin. Cada torneo tiene su propio nombre y su logo.

## Alcance

- El encabezado, el shell y el tablero en vivo muestran la marca del club (nombre y escudo), no «Copa Raíces».
- El tablero en vivo es el tablero del club: lista los torneos en curso y los próximos, cada uno con su nombre y su logo; al entrar a uno, se ve la marca de ese torneo.
- Desde el admin, el club crea y administra sus torneos.
- Cada torneo tiene `nombre` y logo propio. La Copa Raíces queda como un torneo del club, con una edición por año, no como la marca de la app.
- Jerónimo es el único admin.

## Criterios de aceptación

- El tablero público es del club, no de un torneo suelto.
- Un torneo se da de alta con nombre y logo, y esos datos se ven al entrar a esa edición (admin, tablero y mesa).
- La Copa Raíces se puede cargar como una edición anual (el calendario de ediciones todavía no está establecido; el modelo lo deja listo).
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.
- No se mueven todavía los tokens a `equipo`, ni estados de W.O., ni descalificar, ni adaptar, ni mesa por partido, ni el dominio.

## Decisiones

- «Tiene que ser la app del club.» La app y el tablero en vivo son del club (15/11/2026).
- «Cada torneo tendrá su nombre y su logo, el tablero en vivo ahora es el tablero del club, al igual que la app.» (15/11/2026).
- La Copa Raíces es una edición por año (15/11/2026). Todavía no está nada establecido sobre el calendario, pero debería ser una edición por año.
- Jerónimo es el único admin (15/11/2026).
