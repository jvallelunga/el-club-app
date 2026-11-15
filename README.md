# El Club

App del club para organizar torneos y, más adelante, el día a día del club. Las funcionalidades son las mismas para todos los clubes; cada uno personaliza su marca. El primer caso es **Los Cardos Rugby Club** (Tandil).

Este repo arranca de cero. [copa-raices](https://github.com/jvallelunga/copa-raices) queda congelado como base y ejemplo: el código se copia de ahí cuando haga falta.

El mapa de features, punto de entrada para el trabajo, está en [features/README.md](features/README.md). El modelo inicial está en el [DER](docs/der-el-club.mmd) ([imagen](docs/der-el-club.png)).

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

El primer club es Los Cardos. Hasta que haya más de uno, la app y el tablero en vivo llevan su nombre y su escudo.

## Roadmap

Se trabaja **de a una cosa**. No se arranca el siguiente ítem hasta que el anterior esté aprobado y mergeado (o descartado). Los mocks de UI se aprueban antes de tocar el código. Un cambio de modelo lleva, en el mismo commit, la migración idempotente y el DER.

### Paso 1 — App del club

Convertir la app del torneo en una app del club que organiza torneos. Todavía no entran socios, carnet, gym, cuotas ni entrenamientos.

1. [Base del proyecto](features/base-del-proyecto.md): copiar el stack Next.js + Supabase desde copa-raices. Los ambientes separados de desarrollo y producción quedan para después.
2. [Personalización por club](features/personalizacion-por-club.md): paleta, escudo, nombre y PWA, con Los Cardos como primer club.
3. [App del club](features/app-del-club.md): el club es dueño de los torneos; el tablero en vivo es del club; cada torneo tiene nombre y logo.
4. [Equipos fijos](features/equipos-fijos.md): equipos por categoría, con link fijo.
5. [Estados de partido](features/estados-de-partido.md): no jugado, W.O. y dar por terminado el torneo.
6. [Descalificar](features/descalificar.md): solo el admin, con motivo obligatorio y auditoría.
7. [Adaptar un torneo](features/adaptar-torneo.md): reorganizar a menos equipos desde el admin.
8. [Mesa por partido](features/mesa-por-partido.md): acceso único que vence al cerrar el partido.
9. [Dominio](features/dominio.md): dominio propio del club; el link viejo de copa-raices redirige.

### Paso 2

10. [Categorías, entrenamientos, asistencia, lesionados y próximos partidos](features/paso-2-categorias-y-entrenamientos.md). Acá entran también las [cuentas de manager](features/cuentas-de-manager.md). Quedan afuera socios, carnet digital, gym y cuotas.

### Deuda (traída de copa-raices)

- [Servidor MCP](features/servidor-mcp.md) (copa-raices #77 y #78).
- [CI con pgTAP](features/calidad-y-ci.md) (copa-raices #82).
- [Modalidad 15 y Seven](features/modalidad-15-y-seven.md) (copa-raices #146).
- [Cuentas de manager](features/cuentas-de-manager.md) (copa-raices #171), en el paso 2.

## Decisiones

Agrupadas por feature. Fecha: 15/11/2026 (hora de Argentina), con Jerónimo.

### Producto

- El producto es una **app del club**, no una app de un solo torneo.
- Es **multi-club** a futuro: cada club personaliza nombre, escudo o logo, paleta de colores, dominio y PWA. Las funcionalidades son las mismas para todos. Los Cardos Rugby Club (Tandil) es el primer caso.
- [copa-raices](https://github.com/jvallelunga/copa-raices) queda como base y ejemplo. El código se copia de ahí cuando haga falta.
- Se trabaja **de a una cosa**.

### Personalización por club

- Cada club tiene nombre, escudo o logo, paleta, dominio, y nombre e ícono de la PWA.
- Hasta que exista el ítem de personalización, Los Cardos es el club con el que se prueba todo.

### App del club

- La app y el tablero en vivo son del club, no de un torneo.
- El club es el dueño de los torneos: los crea y los administra desde el admin.
- Cada torneo tiene su propio **nombre** y su **logo**.
- La Copa Raíces pasa a ser una competencia del club, con **una edición por año**. Todavía no está establecido el calendario de ediciones, pero el modelo lo deja listo.
- Jerónimo es el **único admin**. No se invita a nadie más en el paso 1.

### Tabla y desempate

- El reglamento de la tabla no cambia: **4 puntos por ganar, 1 por empatar, 0 por perder, sin bonus**.
- Orden de desempate: PTS, partido entre ambos (suma de los puntos en todos los partidos entre los dos equipos), tries a favor, tantos a favor, diferencia, sorteo (el admin lo asigna a mano).

### Estados de partido y W.O.

- Un W.O. le da **4 puntos** al ganador, con un tanteo fijo de **28–0 y 4 tries**, configurable por torneo.
- «No jugado / suspendido» no cuenta en la tabla.
- «Dar por terminado el torneo» lo cierra el admin a mano.

### Descalificar

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
