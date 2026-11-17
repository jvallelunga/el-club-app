# El Club

App del club para organizar torneos y, más adelante, el día a día del club. Las funcionalidades son las mismas para todos los clubes; cada uno personaliza su marca. El primer club real va a ser **Los Cardos Rugby Club** (Tandil), pero ningún club va fijo en el código, los mocks ni los datos de ejemplo.

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

El primer club real va a ser Los Cardos Rugby Club (Tandil). Ningún club —tampoco ese— va fijo en el código, los mocks ni los datos de ejemplo: cada uno se crea con el formulario (17/11/2026 08:26).

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
3. [Personalización por club](features/personalizacion-por-club.md) ([#2](https://github.com/jvallelunga/el-club-app/issues/2)): paleta, escudo, nombre y PWA. Los Cardos es el primer club real, pero no va fijo en el código (17/11/2026 08:26).
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
- Es **multi-club** a futuro: cada club personaliza nombre, escudo o logo, paleta de colores, dominio y PWA. Las funcionalidades son las mismas para todos. Los Cardos Rugby Club (Tandil) es el primer club real, pero no va fijo en el código (17/11/2026 08:26).
- [copa-raices](https://github.com/jvallelunga/copa-raices) queda como base y ejemplo. El código se copia de ahí cuando haga falta.
- Se trabaja **de a una cosa**.

- El 17/11/2026 12:42 Jerónimo aprobó el logo de El Club App: ícono cuadrado redondeado, fondo sólido `#FF8C42`, escudo blanco cuyo contorno forma una C abierta a la derecha (cortes en ángulo arriba y abajo a la derecha), sin estrella, plano y sin degradés. Vive en `public/marca/` (`logo-icon.svg` con fondo, `logo-mark.svg` solo la C blanca, `logo-mark-naranja.svg` la C en `#FF8C42` para fondos claros). Se usa como favicon e ícono de la app, y junto al nombre «El Club App» en el ingreso genérico, el selector de club y la cabecera del Super Admin. No reemplaza el escudo de un club (17/11/2026 12:42).

- El 17/11/2026 12:47 Jerónimo aprobó adaptar el tema de producto al logo: primario `#FF8C42`, superficies blancas y neutros cálidos, con hover/active derivados y un tinte claro. El blanco sobre ese naranja no cumple contraste AA (2,31:1), así que los botones van con texto oscuro (`#1c1917`); los enlaces sobre fondo claro usan un naranja más oscuro (el `#E8732A` que se consideró queda corto para texto corrido). El 17/11/2026 12:48 aclaró que este tema naranja vale solo para superficies genéricas de producto (ingreso sin club, selector de club, Super Admin). Si se entra por un club (host o subdominio, `/c/<slug>/...`, o el ingreso con contexto de ese club) el tema usa la paleta del club (`color_principal`, `color_claro`, etc.) y se muestra el escudo o las iniciales, no el logo de producto (17/11/2026 12:47 y 12:48).

- El 17/11/2026 13:18 Jerónimo aprobó el menú ☰ en la cáscara de admin: un botón a la izquierda de la barra superior abre un cajón izquierdo (Sheet) con el mismo contenido que el sidebar de escritorio (logo de producto + «El Club App», o escudo/iniciales y nombre del club si se está dentro de un club, ítems según el rol, y «Salir» con POST abajo). El cajón se usa en **todo viewport por debajo de `lg` (1024px)**, es decir celular y tablet: el sidebar fijo solo aparece desde `lg`. El ítem activo se destaca; el cajón se cierra al navegar, al tocar el fondo o con Escape. El botón tiene `aria-label` «Abrir menú», el foco queda atrapado y respeta el área segura (17/11/2026 13:18).

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
- Hasta que exista el ítem de personalización, se prueba con datos genéricos de ejemplo, no con un club real fijo (17/11/2026 08:26).
- Ningún club (tampoco Los Cardos) puede quedar hardcodeado en el código, los mocks, el copy ni los datos de ejemplo. Los Cardos Rugby Club (Tandil) es el primer club real, y se va a crear con el formulario cuando toque, no aparece precargado (17/11/2026 08:26).

- El 17/11/2026 10:54 Jerónimo aprobó editar un club desde la lista del Super Admin: la fila de la tarjeta (incluido el chevron) entra a `/super-admin/clubes/<slug>/editar`; «Entrar» sigue yendo al admin del club (`/c/<slug>/admin`); no hay un botón «Editar». El formulario reusa el de crear club, con los datos precargados (nombre, escudo que se puede mantener o reemplazar, color principal, color claro, colores 2 y 3, y dominio opcional) y el identificador en solo lectura. Un action solo de Super Admin actualiza el club y, si se sube un escudo nuevo, reemplaza el archivo en el Storage para no dejar el anterior (17/11/2026 10:54).

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
- El formulario real de crear club todavía no se arma completo: primero se aprueban los mocks en `/mocks/roles/super-admin/nuevo-club` (también en `/mocks/crear-club`). Incluyen el formulario vacío (nombre, identificador editable, escudo, paleta y dominio base opcional), el estado con errores de validación y la pantalla de club creado, con botón para nombrar Admins (17/11/2026 08:26).
- El formulario de crear club (mocks, aprobados el 17/11/2026 09:04) pide solo 6 campos, pensados para un usuario común: nombre, identificador sugerido y editable, escudo a color, color de marca (HEX + selector), color claro (default `#ffffff`) y dominio opcional (con `admin.` / `vivo.` y el fallback `/c/<slug>`). El hover, el pressed, el fondo oscuro, el texto con contraste AA y las iniciales (si no hay escudo) se derivan en vivo. Los colores de estado (ok, alerta, error, en vivo) son del sistema y no se piden. La vista previa va a la derecha en tablet y desktop, y en mobile debajo con un toggle: muestra un header con escudo y nombre, botones con el color de marca y una tarjeta de ejemplo en claro y en oscuro. Lo demás (más colores, tipografías, variantes de logo, PWA) queda para la personalización posterior. Los mocks cubren vacío, con datos de ejemplo genéricos, con errores y club creado (17/11/2026 09:04).
- El 17/11/2026 09:21 se actualizó la paleta del formulario de crear club (mocks): hasta 4 colores con HEX y selector. El color 1 es el principal, obligatorio (botones, header y acentos). Los colores 2, 3 y 4 son opcionales para detalles (insignias, líneas, indicador en vivo, destacados); si no se cargan, se derivan del principal. El color claro de fondo queda aparte (default `#ffffff`). La UI es una lista de hasta 4 swatches, con «Agregar color» hasta el 4 y la opción de quitar los opcionales. La vista previa aplica los 4, en claro y en oscuro. Los datos de ejemplo son genéricos; los hex de un club real no van hardcodeados (17/11/2026 09:21).
- El 17/11/2026 09:39 la paleta del formulario de crear club (mocks) quedó en hasta 3 colores: el 1 es el principal, obligatorio (botones, header y acentos); 2 y 3 son opcionales para detalles (insignias, líneas, indicador en vivo, destacados) y, si quedan vacíos, se derivan del principal. El color claro de fondo se pide aparte (default `#ffffff`). En desktop y tablet, la primera línea muestra el color principal al lado del color claro; debajo, los 2 opcionales lado a lado. En mobile van apilados en ese orden. No hay botón «Agregar color»: los 2 opcionales se muestran siempre. La vista previa aplica los 3, en claro y en oscuro. Los datos de ejemplo son genéricos; los hex de un club real no van hardcodeados (17/11/2026 09:39).
- El 17/11/2026 09:44 Jerónimo aprobó los mocks v4 y se implementó el formulario real en `/super-admin/nuevo-club`, con los mismos campos y la vista previa en vivo: nombre, identificador sugerido y editable (único y validado), escudo (subida al bucket público `escudos` en el Storage de desarrollo, con RLS: solo el Super Admin sube, actualiza o borra; la lectura es pública), color principal obligatorio, color claro (default `#ffffff`), 2 colores opcionales (null = se derivan) y dominio base opcional (validado y único). La pantalla de club creado muestra los datos reales y el botón para nombrar Admins. La migración idempotente suma `escudo_ruta`, `color_principal`, `color_claro`, `color_2` y `color_3` en `club`, más el bucket y las políticas; se aplicó solo en el proyecto de desarrollo. El DER se actualizó en el mismo commit. Nada de un club real va hardcodeado (17/11/2026 09:44).
- El ingreso con Google arranca solo por POST (no por un `<Link>` que prefetch) y el `redirect_to` de OAuth es una URL limpia (`/auth/callback`), sin `?siguiente=`. El destino interno va en una cookie httpOnly. Las cookies de PKCE y de sesión se copian al `NextResponse` de redirección, para que no se pierda el state ni la sesión (17/11/2026 08:34).
- Tras el POST de «Continuar con Google», la redirección a `/authorize` de Supabase va con 303 See Other (no 307). Así el navegador hace GET al authorize y no reenvía el POST, que terminaba en un 405. Las cookies de PKCE se siguen copiando a esa respuesta. El logout (GET o POST) y las redirecciones del proxy tras un método que no es GET/HEAD también usan 303 (17/11/2026 09:58).
- Todos los usuarios, también los Admins de cada club, entran solo por invitación. Si alguien entra con Google y no tiene invitación (ni ya es Super Admin o Admin), va a la pantalla sin acceso y no se crea ningún perfil ni rol en la app (17/11/2026 10:35). El Super Admin se siembra con la plantilla de invitación; no entra por estar hardcodeado.
- El botón «Salir» cierra la sesión solo por POST. Un GET a `/auth/salir` (por ejemplo el prefetch de un `<Link>`) no desloguea: eso era lo que, al tocar «Crear club», devolvía a `/ingreso` con la sesión ya cerrada (17/11/2026 10:35).
- El email del Super Admin no va en el repo; se siembra en la base de desarrollo con la plantilla `scripts/sembrar-super-admin.sql` (16/11/2026 18:00).

- El 17/11/2026 11:11 Jerónimo aprobó sumar ingreso por email (magic link de Supabase Auth) junto al de Google, en `/ingreso`. El formulario pide el email y «Enviarme el link»; si el formato es válido se muestra siempre el mismo mensaje neutro («Te mandamos un link a …»), esté o no invitada esa persona, para no revelar si el email está de alta. El correo solo se envía si hay invitación (pendiente o aceptada), o si ya es Super Admin o miembro de un club (`shouldCreateUser` solo en ese caso). El callback reusa `/auth/callback`, la cookie `el_club_siguiente` y redirecciones 303; también acepta `token_hash` con `verifyOtp`. La invitación se vincula por el email exacto (incluye alias `+`). Sin acceso, el destino sigue siendo `/sin-acceso`. En desarrollo se usa el SMTP incluido de Supabase (cupo bajo de correos por hora); no se configuró un SMTP propio (17/11/2026 11:11).

- El 17/11/2026 11:50 Jerónimo aprobó que, al invitar a un Admin, la app le mande el mismo magic link que «Enviarme el link» en `/ingreso` (`signInWithOtp`, `shouldCreateUser: true`, `emailRedirectTo` al `/auth/callback` del origen actual, con destino al admin del club). Si el envío falla (por ejemplo el cupo de 2 correos por hora), la invitación se mantiene y se avisa en la pantalla de Admins, con la acción «Reenviar link» en las pendientes. Todavía no hay una UI para invitar Super Admins; cuando exista, debe usar el mismo envío (17/11/2026 11:50).

- El 17/11/2026 12:24 Jerónimo aprobó que un Admin pueda invitar y quitar Admins solo de su club (nunca de otros). El Super Admin sigue teniendo acceso completo. La pantalla vive en `/c/<slug>/admin/admins` (la ruta vieja de Super Admin redirige ahí) y el menú del club muestra «Admins» también para el Admin del club. Las actions y el RLS limitan insert/delete de `club_invitacion` y delete de `club_miembro` al club que administra; al invitar se manda el mismo magic link, con «Reenviar link». No se puede quitar al último Admin del club (si es uno mismo, el mensaje lo dice claramente) y quitar sigue pidiendo confirmación (17/11/2026 12:24).

- El 17/11/2026 13:24 Jerónimo aprobó que un Admin pueda editar los datos estéticos de su club (nombre, escudo, color principal, color claro, color 2 y color 3) con el mismo formulario y vista previa, desde `/c/<slug>/admin/club` (ítem «Club» en el menú). El identificador, el dominio y cualquier dato que afecte las rutas de acceso quedan en solo lectura para el Admin y solo los edita el Super Admin. La action y un trigger + RLS en la base bloquean esos cambios, y un Admin no puede editar otro club (17/11/2026 13:24).

### Dominio

- El dominio raíz del club (por ejemplo `clubejemplo.com.ar`) es el **sitio web** del club, no la app (16/11/2026 17:43).
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
