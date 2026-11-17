# El Club App — guía para Claude Code

Este archivo es la guía de trabajo en este repo. Jerónimo es el Product Owner: carga requisitos, issues con criterios de aceptación, frames de baja fidelidad, decisiones y revisión de PRs. Claude Code arma los mocks de UI y hace todo el desarrollo. No hace falta que Jerónimo pegue el prompt en cada issue: leé este archivo, el issue y la feature.

## Qué es este producto

App de gestión de un club (torneos y, más adelante, el día a día). Es **multi-club**: las funcionalidades son las mismas para todos; cada club personaliza su marca (nombre, escudo, paleta, dominio, PWA). El primer caso de uso es Los Cardos Rugby Club (Tandil), pero **Los Cardos es solo dato de prueba**: no va hardcodeado en el código, ni su nombre, ni su escudo, ni sus colores, ni datos inventados de un club real.

[copa-raices](https://github.com/jvallelunga/copa-raices) queda congelado como base y ejemplo: se copia código de ahí cuando haga falta.

El mapa de features está en `features/README.md`. El modelo aplicado está en `docs/der-el-club.mmd` (imagen: `docs/der-el-club.png`).

## Estado actual (rama `desarrollo`)

En `desarrollo` ya están implementados, además de la base: roles (Super Admin y Admin por club), ingreso solo por invitación (Google y magic link), personalización estética del club, datos de contacto y redes, sedes e instalaciones, el tema de producto naranja y el cajón ☰ de navegación debajo de `lg`. El DER oficial refleja ese modelo (club, usuario, membresías, invitaciones, redes, sedes, tipos de instalación e instalaciones), con RLS. Si dudás de una pantalla o una tabla puntual, confirmalo en el código y en el DER; no trates roles, login, tema, cajón o RLS como trabajo pendiente de la base.

Rutas reales de referencia: `/ingreso`, `/super-admin`, `/c/<slug>/admin` (Club, Sedes, Admins). Los mocks de UI siguen en `/mocks/roles`.

## Stack

- Node 22 (`.nvmrc`; `nvm use`).
- Next.js 16.4.3 (App Router), React 19.3.1, TypeScript, Tailwind 4, shadcn (estilo radix-nova, `baseColor` neutral, componentes en `src/ui/nativos`).
- Vitest, ESLint (`eslint-config-next` 16.4.3) con reglas de capas.
- Supabase, con `@supabase/supabase-js` y `@supabase/ssr`. La sesión del servidor va en `src/datos/supabase-servidor.ts` (`createServerClient` de `@supabase/ssr`, cookies). No uses el cliente de browser para la sesión de servidor.
- Vercel (`vercel.json`, región `gru1`).

## Estructura del repo

- `src/app` — rutas (App Router).
- `src/dominio` — reglas de negocio puras: sin React, Next, ni Supabase.
- `src/datos` — acceso a datos. `consultas` y `comandos` son solo servidor. Tipos en `src/datos/tipos.ts` (se regeneran con `npm run tipos` desde un Supabase local).
- `src/ui/nativos` — primitivos shadcn. `src/ui/compartidos` — UI compartida. `src/ui/features` — UI de una feature. `src/ui/fundamentos` — tema y tokens.
- `supabase/migrations` — SQL idempotente.
- `features/` — una nota por feature (objetivo, decisiones, criterios).
- `docs/frames/` — frames de baja fidelidad, por feature.

## Comandos

```bash
cp .env.example .env.local   # las claves no van al repo
npm install
nvm use
npm run dev                  # http://localhost:3000
npm run build
npm run lint -- <archivos>   # ESLint; pasá solo los archivos tocados
npm run typecheck            # tsc --noEmit
npm test                     # vitest run
npm run tipos                # regenera src/datos/tipos.ts (Supabase local)
```

Antes de cada commit: lint solo de los archivos cambiados y `npm run typecheck`. Si un error es de un archivo que no tocaste, no bloquea (anotalo). No hace falta un `lint` limpio de todo el repo.

## Ramas

- `desarrollo` es la rama de integración. Los PR van contra `desarrollo`.
- `main` es producción, cuando exista. Producción solo con el OK explícito de Jerónimo.
- Nombres de rama: `fix/<nombre>`, `enhancement/<nombre>`, `feature/<nombre>`, `task/<nombre>` (kebab-case). No uses `cursor/…`, `feat/…` ni `bugfix/…`.
- Merge normal, nunca squash. Nunca hagas force-push.

## Flujo de trabajo

Se trabaja de a una cosa, en el orden del roadmap de `README.md` / `features/README.md`.

Los issues llevan una etiqueta de estado:

- `backlog`: idea a futuro, todavía no especificada. **No la tomes.**
- `ready`: especificada, con frame y criterios de aceptación. **Solo tomás issues `ready`.**
- `in progress`: se está desarrollando.

Al empezar un issue `ready`, cambiá la etiqueta a `in progress` y sacá `ready`. En el PR usá `Closes #N` para que el issue se cierre al mergear.

1. Tomá un issue de GitHub que esté en `ready` (nunca uno en `backlog`).
2. Pasalo a `in progress` y sacá `ready`.
3. Leé `features/<feature>.md` y el frame (si hay, en `docs/frames/` o linkeado en el issue).
4. Si hay UI nueva: primero los **mocks** (pantallas pulidas, con layout real de mobile, tablet y desktop) en un PR. Esperá la **aprobación de Jerónimo en ese PR** antes de implementar de verdad (migración, RLS, pantallas reales).
5. Recién después implementá, en el mismo issue o en un PR siguiente, según lo que pida el issue.
6. El PR contra `desarrollo` incluye `Closes #N`. Al mergear, el issue se cierra.
7. No inventes requisitos, datos de un club, ni decisiones de producto. Si falta algo, preguntá en el issue o en el PR y dejalo como pregunta abierta.

## Reglas

### Commits y PRs

- Autor: solo la cuenta personal `jvallelunga` (`3844906+jvallelunga@users.noreply.github.com`).
- Commits: `git -c core.hooksPath=/dev/null -c user.name=jvallelunga -c user.email=3844906+jvallelunga@users.noreply.github.com`.
- Ni `Co-authored-by` ni crédito a Cursor, Claude, ni ningún agente o IA, en commits ni en el título o el cuerpo del PR.

### Modelo de datos

- Todo cambio de entidad (tabla, columna, relación, check, vista, migración) lleva, **en el mismo commit**: migración idempotente + DER actualizado (`docs/der-el-club.mmd` y `docs/der-el-club.png`).
- El PNG se genera con Kroki (ver `AGENTS.md`). Dentro de `erDiagram` no van comentarios `%%`. Si Kroki falla por los `%%` del encabezado, generá el PNG sin esas líneas.
- Las migraciones se aplican primero en el proyecto de **desarrollo** de Supabase. Nunca en producción sin el OK de Jerónimo.
- **Nunca toques el proyecto de producción de Supabase `zpdwsqcrnjtqqxotgwcf`.**

### Decisiones

- Cada decisión de diseño o de producto se anota, con **fecha y hora ART**, en `features/<feature>.md` y en la sección «Decisiones» del `README.md`, agrupada por feature.
- Se escribe lo que sí se hace. Lo que falta definir queda como `[completar]`.

### Producto, UI y permisos

- Mobile first, con layout real de tablet y escritorio (no un mobile estirado).
- En viewport menor a `lg` (1024px), el admin usa un botón ☰ que abre un cajón (drawer) de navegación; desde `lg` hacia arriba, la barra lateral fija.
- Tema de producto: naranja `#FF8C42`, con texto oscuro en los botones (el blanco sobre ese naranja no llega a contraste AA). Dentro de un club, el tema lo marca la paleta de ese club (no el naranja de producto).
- Roles en el alcance actual: solo **Super Admin** (todo, todos los clubes) y **Admin del club** (todo lo de su club). El ingreso es solo por invitación (Google y magic link).
- RLS: un Admin opera solo sobre su club; un Admin del club A no lee ni escribe el club B. El Super Admin sí opera sobre todos.
- No commitees secretos, ni `.env`, ni el email de Jerónimo.
- No inventes datos de un club real.

### Redacción

- Se dice **«Staff M17 y M19»**, nunca «Bloque».
- Se dice **«Plantel Superior»**, nunca «Primera».
- No se escribe «food trucks».

## Capas (ESLint)

- `src/dominio`: no importa React, Next, Supabase, ni `ui` / `datos` / `app`.
- `src/ui`: no importa datos de servidor (`@/datos/supabase`, `tipos`, `consultas`, `comandos`).
- `src/ui/nativos`: no importa `compartidos`, `features` ni `datos`.
- `src/ui/compartidos`: no importa `features` ni `datos`.
- Un componente cliente en `src/app` no importa consultas ni comandos de servidor.

## Cómo levantarla

Hace falta Node 22. Copiá `.env.example` a `.env.local` (las claves no van al repo). `npm install` y `npm run dev`. Las pantallas con sesión (ingreso, admin, Super Admin) necesitan las claves de Supabase del entorno de **desarrollo**. Para la base local: `supabase start` aplica las migraciones de `supabase/migrations`. Las migraciones remotas se aplican solo en el proyecto de desarrollo, nunca en producción sin el OK de Jerónimo.
