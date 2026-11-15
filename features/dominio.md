# Dominio propio del club

Noveno ítem del paso 1. Todavía no implementado.

## Objetivo

La app del club vive en un dominio propio, y el link viejo de copa-raices redirige para no romper los que ya circularon (por ejemplo por Instagram).

## Alcance

- Decidir y configurar el dominio del primer club (Los Cardos). Opciones abiertas: un dominio propio (por ejemplo un `.com.ar`, que en Argentina se registra en NIC Argentina) o un subdominio de un dominio que el club ya tenga. `[completar: cuál es el dominio]`.
- `copa-raices.vercel.app` redirige al dominio nuevo, sin romper los links que ya se compartieron.
- El nombre del host no cambia las funcionalidades; es parte de la [personalización por club](personalizacion-por-club.md).

## Criterios de aceptación

- La app se sirve en el dominio elegido para Los Cardos.
- Una visita a `copa-raices.vercel.app` (y a las rutas que ya circularon) termina en el equivalente del dominio nuevo.
- No se implementa hasta que Jerónimo elija el dominio concreto.

## Decisiones

- Tiene que haber un dominio nuevo, de la app del club, no del torneo (15/11/2026).
- El link viejo de copa-raices redirige.
