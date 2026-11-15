# Descalificar un equipo

Sexto ítem del paso 1. Todavía no implementado.

## Objetivo

El admin descalifica un equipo de un torneo, con motivo obligatorio y un registro que no se borra.

## Alcance

- Solo el admin (Jerónimo) puede descalificar.
- El motivo es obligatorio. Queda un registro de auditoría (quién, cuándo, motivo) que no se borra.
- Los partidos que le quedan al equipo se tratan como W.O. a favor del rival, con el tanteo del torneo. Los ya finalizados se mantienen.
- Si se puede revertir, también queda registrado.

## Criterios de aceptación

- No se puede descalificar sin motivo.
- Los partidos pendientes o en juego del equipo descalificado quedan como W.O. a favor del rival; los finalizados no se tocan.
- El registro de la descalificación no se elimina.
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.

## Decisiones

- Los partidos que le quedan a un equipo descalificado se tratan igual que un W.O. para el rival (15/11/2026).
- Solo el admin, con motivo obligatorio y auditoría.
