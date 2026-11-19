# Cómo trabajamos

Machete para las personas del equipo: qué escribir en cada momento y qué hace el agente solo. Las etiquetas de los issues están en el [README](../README.md#cómo-se-trabaja); las reglas que siguen los agentes, en `CLAUDE.md` y `docs/agents/`.

## De la idea a desarrollo

1. **Idea nueva.** Se crea un issue en GitHub con la etiqueta `backlog`. Mientras esté ahí, nadie lo toca.
2. **Cuando querés trabajarlo**, lo pasás a `refinement`.
3. **Refinar.** En una sesión nueva, `/next-issue`, y elegís el issue en el menú. Esa sesión queda como su **sesión de refinamiento** (se anota en el issue). Ahí escribís `/grill-with-docs #<n>`: te pregunta hasta que no quedan dudas, y anota las decisiones en el issue (con fecha y hora) y los términos en `GLOSSARY.md`. En el camino puede usar:
   - `/research` para datos de afuera (una API, precios, límites); trabaja en segundo plano;
   - `/prototype` para mocks: si hay pantallas nuevas, se aprueban antes de programar.
4. **¿Entra en una sesión?**
   - **Sí:** el issue pasa a `ready` y queda como «suelto».
   - **No:** en la misma sesión, `/to-tickets #<n>`. Lo divide en tickets (sub-issues) con sus bloqueos. El issue padre queda en `in progress` hasta que se cierre su último ticket.

## Desarrollar: siempre con `/next-issue`

Depende de dónde lo escribas:

- **En la sesión de refinamiento de un padre:** toma el siguiente ticket libre y se lo pasa a un subagente, que lo implementa y te devuelve el PR. Se hace de a un ticket, en orden de bloqueos. Para seguir, otra vez `/next-issue` en la misma sesión.
- **En una sesión nueva:** te muestra un menú con:
  - los issues en `refinement`, para refinar;
  - el siguiente ticket de cada padre en curso: te da el link de su sesión de refinamiento para seguir ahí;
  - los issues sueltos en `ready`: los implementa en esa misma sesión.

Siempre te muestra el camino que propone y espera tu OK.

Lo que sigue lo hace el agente solo: la rama, el código con tests (`/implement`, que usa `/tdd` y cierra con `/matt-code-review`), las docs de usuario (`/user-docs`), el PR, el CI en verde, el merge a `desarrollo`, la etiqueta `done` y el cierre del issue.

## Después de cada issue

- **`/retro`** en la misma sesión, antes de `/clear`. Propone mejoras al entorno de trabajo (chequeos, scripts, reglas), no al código.
- **`/clear`** para empezar el siguiente issue con la ventana limpia. Lo que hace falta queda en el issue, el código y los docs.

## Lo que hacés vos

- Contestar las preguntas del refinamiento y aprobar los mocks.
- Aplicar las migraciones nuevas en el Supabase de desarrollo (el agente avisa cuál).
- Los issues `manual`: claves, paneles de terceros, DNS. `/wizard` arma un script que te guía paso a paso.
- Pasar `desarrollo` a `main` (producción): solo con tu OK.

## Las skills

Las nuestras:

| Skill | Para qué |
| --- | --- |
| `/next-issue` | Tomar el próximo issue `ready` (o uno puntual) y arrancarlo con el camino correcto. |
| `/user-docs` | Actualizar la ayuda de `docs/usuario/`, que se publica en la wiki. |

Las de Matt Pocock (copias locales en `.claude/skills/`), las que más usamos:

| Skill | Para qué |
| --- | --- |
| `/ask-matt` | No sabés qué sigue: te dice qué skill usar. |
| `/grill-with-docs` | Refinar una idea por entrevista. |
| `/to-tickets` | Dividir un issue grande en tickets. |
| `/implement` | Desarrollar un issue especificado. |
| `/prototype` | Mocks o prototipos descartables. |
| `/research` | Investigar en fuentes primarias, en segundo plano. |
| `/diagnosing-bugs` | Algo anda mal y no se sabe por qué. |
| `/wizard` | Pasos que solo puede hacer una persona. |
| `/retro` | Mirar para atrás una sesión y mejorar el entorno. |
| `/wait-what` | No entendiste lo último: lo explica de nuevo, más simple. |

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Términos del club | `GLOSSARY.md` |
| Decisiones técnicas duraderas | `docs/adr/` |
| Modelo de datos | `docs/der-el-club.mmd` (PNG: `bash scripts/der-png.sh`) |
| Reglas para el review | `CODING_STANDARDS.md` |
| Ayuda para los usuarios | `docs/usuario/` → wiki |
| Pruebas de RLS | `bash scripts/probar-rls.sh` (y el CI en cada PR) |
