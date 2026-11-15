# Equipos fijos por categoría, con link fijo

Cuarto ítem del paso 1. Todavía no implementado.

## Objetivo

Cada equipo pertenece a un club y a una categoría, y tiene un link de manager y uno de solo lectura que sirven de una edición a la siguiente.

## Alcance

- `acceso_token` y `lectura_token` viven en `equipo`, no en la inscripción a un torneo.
- La ruta sigue siendo `/e/{token}`.
- Cambiar el equipo de un cupo en preparación no rota esos tokens.
- Las suscripciones push, si se copian de copa-raices, siguen colgadas de la inscripción de esa edición.

## Criterios de aceptación

- El mismo link de un equipo sirve en un torneo y en el siguiente, sin generar uno nuevo al inscribirlo.
- El link de manager permite gestionar el plantel; el de lectura solo muestra.
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.

## Decisiones

- El equipo es de un club y de una categoría (visión del 15/11/2026; «dentro del club hay equipos, cada equipo corresponde a una categoría»).
- El link fijo se resuelve en este ítem, no antes.
