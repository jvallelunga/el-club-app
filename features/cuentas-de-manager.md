# Cuentas de manager

Deuda traída de copa-raices [#171](https://github.com/jvallelunga/copa-raices/issues/171) («Acceso de equipos: roles y permisos (solo managers cargan y editan el plantel)»). Entra en el [paso 2](paso-2-categorias-y-entrenamientos.md). Todavía no implementado.

El cuerpo original del issue no se pudo releer desde un dump local; este resumen sale de `features/acceso-equipos.md` y de las notas de pendiente en copa-raices, que fueron la fuente de ese issue.

## Objetivo

Los managers entran con una cuenta (login), no solo con el link del equipo, y solo ellos pueden cargar y editar el plantel. Así pueden ver sus equipos desde cualquier dispositivo, tomar asistencia y registrar lesionados.

## Alcance

- Hoy, en copa-raices, cualquiera con el link de edición del equipo puede cargar el plantel. El link de solo lectura no escribe, pero no hay cuentas ni roles.
- Las cuentas de manager, con login, quedaron explícitamente para después del torneo del 14/11.
- En El Club esto se hace en el paso 2, junto con entrenamientos, asistencia y lesionados: el manager necesita una identidad estable, no un link atado a un teléfono.

## Criterios de aceptación

- Un manager inicia sesión y ve los equipos que le corresponden, en cualquier dispositivo.
- Solo un manager (o el admin) carga y edita el plantel, toma asistencia y marca lesionados.
- El link de solo lectura sigue sirviendo a los jugadores, sin darles esas escrituras.
- Hay mocks aprobados por Jerónimo antes de tocar el código.

## Decisiones

- En copa-raices quedó para después del torneo, con los roles (#171, 31/10/2026). En El Club viaja con el paso 2 (15/11/2026).
