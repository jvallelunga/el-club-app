# Modalidad 15 y Seven

Deuda traída de copa-raices [#146](https://github.com/jvallelunga/copa-raices/issues/146) («Tipos de torneo: modalidad 15 y Seven (7 jugadores)»). Todavía no implementado.

El cuerpo original del issue no se pudo releer desde un dump local (el inventario del 5/11/2026 solo conservó el título y la etiqueta `post-torneo`). Este texto retoma ese título y lo adapta a El Club.

## Objetivo

Un torneo se puede armar en modalidad de rugby 15 o de Seven (7 jugadores), no solo con el formato que se usó en la Copa Raíces.

## Alcance

- La modalidad es una propiedad del torneo (o de la plantilla), no una app distinta.
- Cambia lo que corresponda al formato: cantidad de jugadores en cancha, convocatoria, duraciones y, si hace falta, el reglamento de ese torneo.
- El detalle del modelo y de la UI se acuerda al implementar, con mocks aprobados. `[completar: qué cambia además de la cantidad de jugadores y las duraciones]`.

## Criterios de aceptación

- Al crear un torneo se elige modalidad 15 o Seven.
- La convocatoria, la mesa y el tablero respetan esa modalidad.
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.

## Decisiones

- En copa-raices quedó como trabajo de después del torneo. Sigue siendo deuda, no entra al paso 1 ni al paso 2 de entrenamientos.
