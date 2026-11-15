# Paso 2: categorías, entrenamientos, asistencia, lesionados y próximos partidos

Fuera del paso 1. Todavía no implementado.

## Objetivo

En varias categorías, los entrenadores organizan los entrenamientos, los managers toman asistencia y registran lesionados, y los jugadores ven los horarios, el tipo de entrenamiento y los próximos partidos (día, hora, rival, lugar, local o visitante).

## Alcance

- Varias categorías desde el principio de este paso, no una sola. Cada equipo corresponde a una categoría.
- Entrenadores organizan entrenamientos (días, horarios y tipo). Un entrenamiento puede cambiar por clima o por disponibilidad; el cambio guarda el motivo y avisa a los jugadores.
- Managers toman asistencia a los entrenamientos y registran qué jugadores están lesionados.
- Los jugadores tienen la información de los entrenamientos y de los próximos partidos.
- Staff: entrenadores, managers y «entre otros» (por ejemplo preparador físico). El detalle de roles se acuerda al modelar.
- Acá entra también [cuentas de manager](cuentas-de-manager.md) (copa-raices #171).
- Quedan afuera: socios, carnet digital, gym y cuotas. Eso es más adelante.

## Criterios de aceptación

- Se acuerda el modelo (equipo por categoría, staff, avisos si cambia un entrenamiento) y los mocks, y recién ahí se implementa.
- Un jugador de una categoría ve sus entrenamientos y sus próximos partidos, con condición local o visitante.
- Un entrenador puede cargar y cambiar un entrenamiento, con aviso si cambia.
- Un manager puede tomar asistencia y marcar lesionados.

## Decisiones

- No es una sola categoría: son varias, desde este paso (15/11/2026).
- El primer paso, ya separado, es convertir la app del torneo en una app del club que organiza torneos. Esto queda segundo (15/11/2026).
