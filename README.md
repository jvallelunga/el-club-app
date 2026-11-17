# El Club App

App de gestión de clubes. Es multi-club: todos los clubes tienen las mismas funciones y cada uno pone su marca (nombre, escudo, colores y dominio).

## Qué hace hoy

- **Ingreso** solo por invitación, con Google o con un link por email.
- **Super Admin**: se carga a mano en la base (plantilla en `scripts/sembrar-super-admin.sql`, sin el email real). Crea clubes con nombre, identificador, escudo, colores y dominio opcional, y les asigna Admins.
- **Admin del club**: edita la estética (nombre, escudo y colores), el contacto y las redes de su club, y agrega o quita otros Admins de ese club (no se puede quitar al último).
- **Sedes del club**, cada una con nombre, dirección, link de Google Maps e instalaciones (tipo, nombre y notas).

Permisos: un Admin opera solo sobre su club; el Super Admin, sobre todos. Está reforzado con RLS en Supabase.

Rutas principales: `/ingreso`, `/super-admin`, `/c/<slug>/admin` (Club, Sedes, Admins).

## Cómo se trabaja

Los issues de GitHub son la fuente de verdad. El estado de cada issue es una etiqueta:

`backlog` → `refinement` → `ready` → `in progress` → `done` → cerrado

| Etiqueta | Significa |
| --- | --- |
| `backlog` | Idea a futuro, todavía sin especificar. |
| `refinement` | Se sacó del backlog para refinarlo. |
| `ready` | Tiene información suficiente para desarrollarlo. |
| `in progress` | En desarrollo. |
| `done` | Desarrollo terminado y PR abierto contra `desarrollo`. |
| cerrado | Se mergeó el PR («Closes #n»). |

- Si hay UI nueva, primero se aprueban los mocks y después se implementa.
- Las preguntas y las decisiones se anotan en el issue, con fecha y hora ART.
- Ramas `feature/`, `fix/`, `enhancement/` o `task/` (kebab-case), PR contra `desarrollo`, merge normal (nunca squash), sin force-push.
- `desarrollo` es la rama de integración. Producción solo con el OK de Jerónimo; nunca se toca el proyecto de producción de Supabase.

## Stack

Node 22, Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, shadcn, Supabase (`@supabase/ssr`), Vitest, ESLint con reglas de capas y Vercel (región `gru1`).

- `src/app`: rutas.
- `src/dominio`: reglas de negocio puras (sin React, Next ni Supabase).
- `src/datos`: acceso a datos; `consultas` y `comandos` son solo de servidor.
- `src/ui`: `nativos` (shadcn), `compartidos`, `features` y `fundamentos` (tema y tokens).
- `supabase/migrations`: migraciones SQL idempotentes.

## Cómo levantarla

```bash
cp .env.example .env.local   # claves del proyecto de Supabase de desarrollo
npm install
npm run dev                  # http://localhost:3000
```

Otros comandos: `npm run build`, `npm run lint -- <archivos>`, `npm run typecheck`, `npm test`, `npm run tipos` (regenera `src/datos/tipos.ts` desde un Supabase local).

## Modelo de datos

El modelo está en el [DER](docs/der-el-club.mmd) ([imagen](docs/der-el-club.png)). Cada cambio de modelo lleva, en el mismo commit, su migración idempotente y el DER actualizado. Dentro de `erDiagram` no van comentarios `%%`. El PNG se regenera con Kroki:

```bash
curl -s -X POST https://kroki.io/mermaid/png -H "Content-Type: text/plain" \
  --data-binary @docs/der-el-club.mmd -o docs/der-el-club.png
```
