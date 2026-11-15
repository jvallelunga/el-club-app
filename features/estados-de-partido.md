# Estados de partido: no jugado, W.O. y dar por terminado el torneo

Quinto ítem del paso 1. Todavía no implementado.

## Objetivo

La mesa y el admin pueden marcar un partido como no jugado o W.O., y el admin puede dar por terminado un torneo a mano.

## Alcance

- Además de programado, en juego y finalizado: **No jugado / suspendido** (no cuenta en la tabla) y **W.O.** (el rival gana 4 puntos con el tanteo fijo).
- Un W.O. usa, por defecto, un tanteo de **28–0 con 4 tries** para el ganador. Los dos valores se configuran por torneo (`wo_tantos_ganador`, `wo_tries_ganador`). Los tries cuentan para el desempate.
- **Dar por terminado el torneo** lo cierra el admin. Los partidos que sigan abiertos quedan como no jugados y no cuentan en la tabla.
- El reglamento de la tabla no cambia: 4/1/0, sin bonus. Desempate: PTS, partido entre ambos (suma de PTS), tries a favor, tantos a favor, diferencia, sorteo a mano.
- Quedan afuera, para un ítem posterior si se confirman: la quita de puntos al que no se presenta, la tolerancia de 15 minutos, el mínimo de jugadores y el motivo obligatorio del W.O.

## Criterios de aceptación

- Un partido «no jugado / suspendido» no suma PJ ni PTS.
- Un W.O. le da 4 puntos al ganador, con 28–0 y 4 tries por defecto, o con los valores del torneo si se cambiaron.
- «Dar por terminado» deja el torneo terminado y los partidos abiertos como no jugados.
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.

## Decisiones

- Un W.O. da 4 puntos al ganador con un tanteo fijo, configurable por torneo. Default acordado: 28–0 y 4 tries (15/11/2026).
- Tabla: 4 por ganar, 1 por empatar, 0 por perder, sin bonus. Desempate: PTS, partido entre ambos, tries a favor, tantos a favor, diferencia, sorteo a mano (15/11/2026).

## Abierto

- Si el responsable de mesa puede cerrar el partido (y en ese momento se le vence el acceso) se cierra junto con el [ítem 8](mesa-por-partido.md).
- Si un W.O., un «no jugado» o un «Dar por terminado» se pueden revertir, con registro, se cierra en este ítem o en el de [descalificar](descalificar.md), antes de implementar.
