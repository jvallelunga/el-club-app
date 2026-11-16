# El Club

App del club para organizar torneos y, más adelante, el día a día del club. Las funcionalidades son las mismas para todos los clubes; cada uno personaliza su marca. El primer caso es **Los Cardos Rugby Club** (Tandil).

Este repo arranca de cero. [copa-raices](https://github.com/jvallelunga/copa-raices) queda congelado como base y ejemplo: el código se copia de ahí cuando haga falta.

El mapa de features, punto de entrada para el trabajo, está en [features/README.md](features/README.md). El modelo está en el [DER](docs/der-el-club.mmd) ([imagen](docs/der-el-club.png)).

## Visión

Hoy [copa-raices](https://github.com/jvallelunga/copa-raices) es una app de un solo torneo. El producto pasa a ser **la app del club**: el club es el dueño, organiza sus torneos (por ejemplo una edición por año de la Copa Raíces) y, en un segundo paso, cubre varias categorías con entrenamientos, asistencia, lesionados y próximos partidos.

A futuro, otros clubes pueden usar el mismo servicio. No es una app distinta por club: es la misma app, instanciada y personalizada.

## Personalización por club

Cada club define lo suyo, sin cambiar las funcionalidades:

- **Nombre** del club, que es también la marca de la app para ese club.
- **Escudo o logo**, en vector y en PNG (tablero, PWA y compartir).
- **Paleta de colores** del tema.
- **Dominio** propio.
- **Nombre e ícono de la PWA** (En vivo, equipo, mesa, admin).

El primer club es Los Cardos. Hasta que haya más de uno, la app lleva su nombre y su escudo.

## Cómo levantarla en local

Hace falta Node 22 (`nvm use` lee `.nvmrc`).

```bash
cp .env.example .env.local
npm install
npm run dev
```

La app arranca en [http://localhost:3000](http://localhost:3000) y muestra «El Club App». Las variables de Supabase en `.env.local` se completan cuando exista un proyecto (todavía no hay: se crea con el OK de Jerónimo). Sin esas claves, la home sigue andando; los helpers de `src/datos/supabase.ts` solo fallan si alguna ruta los llama.

Para la base en local, cuando esté la CLI de Supabase: `supabase start` (usa `supabase/config.toml`) aplica la migración de `club`.

Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`. `npm run tipos` regenera `src/datos/tipos.ts` desde un Supabase local.

Los ambientes separados de desarrollo y producción (proyectos de Supabase y de Vercel) **quedan para después**, con el OK de Jerónimo. No se crean en este ítem.

## Roadmap

Se trabaja **de a una cosa**. No se arranca el siguiente ítem hasta que el anterior esté aprobado y mergeado (o descartado). Los mocks de UI se aprueban antes de tocar el código. Un cambio de modelo lleva, en el mismo commit, la migración idempotente y el DER.

### Paso 1

1. [Base del proyecto](features/base-del-proyecto.md) ([#1](https://github.com/jvallelunga/el-club-app/issues/1)): copiar el stack Next.js + Supabase desde copa-raices. Los ambientes separados de desarrollo y producción quedan para después.
2. [Roles y permisos por club](features/roles-y-permisos.md) ([#15](https://github.com/jvallelunga/el-club-app/issues/15)): un Super Admin con acceso a todo, y un Admin por club con acceso a todo lo de su club.
3. [Personalización por club](features/personalizacion-por-club.md) ([#2](https://github.com/jvallelunga/el-club-app/issues/2)): paleta, escudo, nombre y PWA, con Los Cardos como primer club.
4. [Dominio](features/dominio.md) ([#9](https://github.com/jvallelunga/el-club-app/issues/9)): el dominio raíz es el sitio web del club; la app usa subdominios por superficie (`admin`, `vivo`). El link viejo de copa-raices redirige.

### Paso 2

5. [Categorías, entrenamientos, asistencia, lesionados y próximos partidos](features/paso-2-categorias-y-entrenamientos.md) ([#10](https://github.com/jvallelunga/el-club-app/issues/10)). Acá entran también las [cuentas de manager](features/cuentas-de-manager.md) ([#14](https://github.com/jvallelunga/el-club-app/issues/14)). Quedan afuera socios, carnet digital, gym y cuotas.

### Deuda (traída de copa-raices)

- [Servidor MCP](features/servidor-mcp.md) ([#11](https://github.com/jvallelunga/el-club-app/issues/11); copa-raices #77 y #78).
- [CI con pgTAP](features/calidad-y-ci.md) ([#12](https://github.com/jvallelunga/el-club-app/issues/12); copa-raices #82).
- [Modalidad 15 y Seven](features/modalidad-15-y-seven.md) ([#13](https://github.com/jvallelunga/el-club-app/issues/13); copa-raices #146).
- [Cuentas de manager](features/cuentas-de-manager.md) ([#14](https://github.com/jvallelunga/el-club-app/issues/14); copa-raices #171), en el paso 2.

## Decisiones

Agrupadas por feature. Fecha: 15/11/2026 (hora de Argentina), con Jerónimo.

### Producto

- El producto es una **app del club**, no una app de un solo torneo.
- Es **multi-club** a futuro: cada club personaliza nombre, escudo o logo, paleta de colores, dominio y PWA. Las funcionalidades son las mismas para todos. Los Cardos Rugby Club (Tandil) es el primer caso.
- [copa-raices](https://github.com/jvallelunga/copa-raices) queda como base y ejemplo. El código se copia de ahí cuando haga falta.
- Se trabaja **de a una cosa**.

### Desarrollo

- Toda la app se diseña **mobile first** y se **optimiza para tablet y desktop**: no se deja una columna de celular en el medio de una pantalla grande. Se piensa primero para el celular y, en cada breakpoint, se aprovecha el ancho (grilla, cáscara de admin, formularios con un máximo). El 15/11/2026 22:23 esta regla se acordó para el admin; el 16/11/2026 17:31 Jerónimo pidió que en desktop se viera optimizado para desktop; el 16/11/2026 17:32 lo confirmó como criterio de desarrollo de todo el sistema, también para tablet.

### Base del proyecto

- Se copia el stack de copa-raices (Next.js 16.4.3, React 19.3.1, TypeScript, Tailwind 4, Supabase, Vitest, ESLint con reglas de capas, `src/dominio` y `src/datos`).
- No se copian las features del torneo (mesa, tablero, acceso por equipos, admin, push, analítica, Clerk, Storybook, lector de DNI, plantillas).
- La migración inicial solo crea `club` (`id`, `slug`, `nombre`, `creado_en`). El nombre `creado_en` sigue el criterio de copa-raices (español).
- Los tokens de tema quedan como una paleta neutra provisional, lista para el ítem 2. No se usa la marca de Copa Raíces.
- Los roles no se implementan acá: van en el [#15](https://github.com/jvallelunga/el-club-app/issues/15).
- No se crean proyectos de Supabase ni de Vercel en este ítem: hace falta el OK de Jerónimo. Los nombres quedan abiertos (propuesta: `el-club-app-desarrollo` / `el-club-app-produccion` en Supabase, y `el-club-app` en Vercel, con `desarrollo` y `main`).

### Personalización por club

- Cada club tiene nombre, escudo o logo, paleta, dominio, y nombre e ícono de la PWA.
- Hasta que exista el ítem de personalización, Los Cardos es el club con el que se prueba todo.

### Roles y permisos

- Van después de la base y antes de la personalización ([#15](https://github.com/jvallelunga/el-club-app/issues/15)).
- **Super Admin**: acceso a todo, en todos los clubes. Crea clubes, los personaliza, entra a cualquiera y nombra a sus Admin. Al principio es solo Jerónimo.
- **Admin del club**: acceso a todo lo de su club. Una persona puede ser Admin de más de un club.
- El ingreso es con Google, vía Supabase Auth (16/11/2026).
- Para nombrar a un Admin, el Super Admin carga su email. Cuando esa persona entra con Google por primera vez, ya tiene el club asignado (16/11/2026).
- El modelo propuesto: `usuario` (nombre, email), `super_admin` y `club_miembro` (club, usuario, rol). El rol es un enum que por ahora solo tiene `admin`, para poder sumar roles después sin rehacer tablas (16/11/2026).
- El email del Super Admin no va en el repo, porque es público: el alta se hace directo en la base (16/11/2026).
- El DER oficial solo refleja lo migrado. El modelo de roles está en [features/roles-y-permisos-der-propuesto.mmd](features/roles-y-permisos-der-propuesto.mmd) hasta que haya migración (16/11/2026).
- Los mocks de las pantallas están en `/mocks/roles`, para aprobarlos antes de implementar el login y la migración.
- Se implementó el modelo (`usuario`, `super_admin`, `club_miembro`, invitaciones), la migración idempotente, las políticas RLS, el ingreso con Google y las pantallas reales. El DER oficial se actualizó en el mismo commit (16/11/2026 18:00).
- El email del Super Admin no va en el repo; se siembra en la base de desarrollo con la plantilla `scripts/sembrar-super-admin.sql` (16/11/2026 18:00).

### Dominio

- El dominio raíz del club (por ejemplo `loscardosrc.com.ar`) es el **sitio web** del club, no la app (16/11/2026 17:43).
- La app vive en subdominios por superficie: `admin.<dominio_base>` (administrador) y `vivo.<dominio_base>` (partidos en vivo / tablero). Más adelante se pueden sumar superficies en código, sin cambiar el modelo (16/11/2026 17:43).
- En la base se guarda `club.dominio_base` (nullable, único), no cada host. Se eligió esa columna en vez de una tabla `club_dominio` porque un club tiene un solo dominio base y las superficies se derivan en código (16/11/2026 17:43).
- Sin dominio propio, el fallback es `/c/<slug>/admin` y `/c/<slug>/vivo` (16/11/2026 17:43).
- El link viejo de copa-raices redirige al destino nuevo, para no romper los que ya circularon.

### App del club

**A redefinir** (15/11/2026: los ítems #3 a #8 se sacaron del backlog y se van a definir de a poco).

- La app y el tablero en vivo son del club, no de un torneo.
- El club es el dueño de los torneos: los crea y los administra desde el admin.
- Cada torneo tiene su propio **nombre** y su **logo**.
- La Copa Raíces pasa a ser una competencia del club, con **una edición por año**. Todavía no está establecido el calendario de ediciones, pero el modelo lo deja listo.
- Jerónimo es el **único admin**. No se invita a nadie más en el paso 1.

### Tabla y desempate

- El reglamento de la tabla no cambia: **4 puntos por ganar, 1 por empatar, 0 por perder, sin bonus**.
- Orden de desempate: PTS, partido entre ambos (suma de los puntos en todos los partidos entre los dos equipos), tries a favor, tantos a favor, diferencia, sorteo (el admin lo asigna a mano).

### Estados de partido y W.O.

**A redefinir** (15/11/2026: el ítem #5 se sacó del backlog y se va a definir más adelante).

- Un W.O. le da **4 puntos** al ganador, con un tanteo fijo de **28–0 y 4 tries**, configurable por torneo.
- «No jugado / suspendido» no cuenta en la tabla.
- «Dar por terminado el torneo» lo cierra el admin a mano.

### Descalificar

**A redefinir** (15/11/2026: el ítem #6 se sacó del backlog y se va a definir más adelante).

- Los partidos que le quedan a un equipo descalificado se tratan como W.O. a favor del rival. Los ya finalizados se mantienen.
- Solo el admin puede descalificar, con motivo obligatorio y un registro que no se borra.

### Redacción

- Se dice **«Staff M17 y M19»**, nunca «Bloque».
- Se dice **«Plantel Superior»**, nunca «Primera».
- No se escribe «food trucks».

## Cómo se trabaja

- Cada decisión se anota en español en la feature que corresponde, dentro de `features/`, y en esta sección, agrupada por feature.
- Se escribe lo que sí se hace. Lo que falta definir queda como `[completar]`.
- Un cambio de modelo actualiza `docs/der-el-club.mmd` y `docs/der-el-club.png` en el mismo commit. El PNG se genera con Kroki, igual que en copa-raices.
- Merge normal, nunca squash. Producción solo con el OK explícito de Jerónimo.
- Los mocks de UI se aprueban antes de aplicarlos.
- Rama de integración: `desarrollo`. `main` es producción, cuando exista.
