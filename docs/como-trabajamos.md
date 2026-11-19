# Cómo trabajamos

Machete para las personas del equipo: qué escribir en cada momento y qué hace el agente solo. Las etiquetas de los issues están en el [README](../README.md#cómo-se-trabaja); las reglas que siguen los agentes, en `CLAUDE.md` y `docs/agents/`.

## De la idea a desarrollo

1. **Idea nueva.** Se crea un issue en GitHub con la etiqueta `backlog`.
2. **Refinar.** En una sesión nueva: `/grill-with-docs #<n>`. Te pregunta hasta que no quedan dudas, y anota las decisiones en el issue (con fecha y hora) y los términos en `GLOSSARY.md`. En el camino puede pedirte:
   - `/research` para datos de afuera (una API, precios, límites); trabaja en segundo plano;
   - `/prototype` para mocks: si hay pantallas nuevas, se aprueban antes de programar.
3. **¿Entra en una sesión?**
   - **Sí:** el issue pasa a `ready`.
   - **No:** en la misma sesión, `/to-tickets #<n>`. Lo divide en tickets (sub-issues) con sus bloqueos. El issue padre queda en `in progress` hasta que se cierre su último ticket, y se anota en él la «Sesión de refinamiento».

## Desarrollar

- **Un issue suelto:** en una sesión nueva, `/next-issue` (o `/next-issue #<n>`). Te muestra el issue y el camino que propone, y espera tu OK.
- **Un ticket de un issue padre:** en la **sesión de refinamiento** del padre, `/next-issue`. Esa sesión le pasa el ticket a un subagente y espera su reporte. Se hace de a un ticket, en orden de bloqueos.

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
