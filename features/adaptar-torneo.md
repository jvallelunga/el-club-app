# Adaptar un torneo a menos equipos

Séptimo ítem del paso 1. Todavía no implementado.

## Objetivo

Si se bajan equipos, el admin reorganiza el torneo desde la app, sin tocar la base a mano.

## Alcance

- En preparación, o en curso si todavía no hay ningún partido cerrado, se pasa a la plantilla que corresponde (cinco, cuatro o tres equipos) y se regenera el fixture.
- Con resultados ya cargados no se cambia el formato: el equipo que se baja se resuelve con W.O. o con «no jugado».

## Criterios de aceptación

- El admin puede adaptar el torneo a menos equipos desde la app, eligiendo la plantilla que corresponde.
- No se puede cambiar el formato si ya hay un partido `finalizado` o `wo`.
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.

## Decisiones

- La recomendación, todavía no cerrada por él en este ítem, es permitir adaptar solo antes de que haya algún partido cerrado.
