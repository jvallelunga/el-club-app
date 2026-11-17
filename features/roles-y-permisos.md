# Roles y permisos por club

Segundo ítem del paso 1, después de la [base del proyecto](base-del-proyecto.md). [#15](https://github.com/jvallelunga/el-club-app/issues/15). Implementado el 16/11/2026. Las pantallas reales están en `/ingreso`, `/super-admin`, `/c/<slug>/admin` y rutas vecinas. Los mocks de `/mocks/roles` quedan como referencia visual.

## Objetivo

Tener roles y permisos desde el principio, por club (multi-club), para que todo lo demás se apoye en eso.

## Alcance inicial

- **Super Admin**: acceso a todo, en todos los clubes. Crea clubes, los personaliza, entra a cualquiera y nombra a sus Admin. Al principio es solo Jerónimo.
- **Admin del club**: acceso a todo lo de su club. Una persona puede ser Admin de más de un club.

No entra ningún otro rol en este ítem. Otros que figuraron como propuesta en el issue (staff de categoría, responsable de mesa, jugador, público) quedan para confirmar más adelante.

## Ingreso

- El ingreso es con Google, vía Supabase Auth.
- Para nombrar a un Admin, el Super Admin carga su email. Cuando esa persona entra con Google por primera vez, ya tiene el club asignado.
- Si alguien entra con Google y su email no está como Super Admin ni como Admin de un club, ve la pantalla de sin acceso.
- El email del Super Admin no va en el repo, porque el repo es público: el alta se hace directo en la base.

## Modelo

El [DER oficial](../docs/der-el-club.mmd) ([imagen](../docs/der-el-club.png)) refleja lo migrado. La migración es idempotente (`supabase/migrations/20261116204500_roles_y_dominio_base.sql`).

- `usuario`: `id` (el mismo que en Supabase Auth), `nombre`, `email` (único, minúsculas) y `creado_en`.
- `super_admin`: `usuario_id` (clave y referencia a `usuario`) y `creado_en`.
- `super_admin_invitacion`: email invitado a Super Admin, para vincularlo en el primer login con Google si todavía no tiene perfil.
- `club_miembro`: `id`, `club_id`, `usuario_id`, `rol` y `creado_en`. El `rol` es un enum (`rol_club`) que por ahora solo tiene el valor `admin`, para poder sumar roles más adelante sin rehacer tablas. Un mismo usuario puede ser Admin de más de un club. La pareja club–usuario es única.
- `club_invitacion`: email invitado a un club, con `aceptada_en` cuando se vincula (de inmediato si el perfil ya existe, o en el primer login con Google).
- `club.dominio_base`: ver [dominio](dominio.md).

Las funciones `interno.es_super_admin()` e `interno.es_admin_club(club_id)` son `SECURITY DEFINER` con `search_path` fijo, en un esquema que no se expone por la API. Las políticas RLS las usan: el Super Admin ve y escribe todo; un Admin solo opera sobre su club; el resto no accede.

## Pantallas (mocks)

Pensadas primero para celular y optimizadas para tablet y desktop (mismo markup, por breakpoints). Viven en `/mocks/roles` y se recorren desde el [índice](/mocks/roles). En escritorio, el ingreso va en una tarjeta centrada (con un panel del club a partir de `lg`); las listas de clubes usan una grilla; el admin entra en una cáscara reutilizable (barra superior con menú ☰ y cajón izquierdo por debajo de `lg`, sidebar fijo desde `lg`). Usan datos de ejemplo (nombres y emails ficticios, rotulados como ejemplo). Ningún club real —tampoco Los Cardos— aparece fijo en estos mocks. No hay login real.

| Pantalla | Ruta |
| --- | --- |
| Índice de mocks | `/mocks/roles` |
| Ingreso con Google | `/mocks/roles/ingreso` |
| Sin acceso | `/mocks/roles/sin-acceso` |
| Elegir club (solo si es Admin de más de un club) | `/mocks/roles/elegir-club` |
| Lista de clubes (Super Admin) | `/mocks/roles/super-admin` |
| Crear club (formulario completo) | `/mocks/roles/super-admin/nuevo-club` (también `/mocks/crear-club`) |
| Crear club con datos de ejemplo | `/mocks/roles/super-admin/nuevo-club?datos=1` |
| Crear club con errores de validación | `/mocks/roles/super-admin/nuevo-club?errores=1` |
| Club creado | `/mocks/roles/super-admin/nuevo-club/creado` |
| Admins de un club (agregar por email / quitar, con confirmación) | `/mocks/roles/super-admin/clubes/[slug]/admins` |
| Inicio del admin del club (placeholder) | `/mocks/roles/clubes/[slug]` |
| Datos del club (editar nombre, escudo y paleta; identificador y dominio en solo lectura para el Admin) | `/mocks/roles/clubes/[slug]/club` |

Flujos:

- Un Super Admin, después de ingresar, va a la lista de clubes. Desde ahí crea un club, entra a cualquiera o administra los Admins.
- Un Admin de un solo club entra directo al inicio de su club.
- Un Admin de más de un club elige a cuál entrar.
- Alguien sin rol ve «Todavía no tenés acceso».

## Criterios de aceptación

- Quedan definidos el Super Admin y el Admin del club, documentados en esta feature y en el DER oficial.
- Un Super Admin opera sobre cualquier club. Un Admin del club opera solo sobre el suyo, con acceso a todo lo de ese club.
- El ingreso es con Google. Una invitación por email se vincula en el primer login, o de inmediato si la persona ya tiene perfil.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.
- Los mocks de `/mocks/roles` se mantienen como referencia visual.

## Decisiones

- Va después de la base (#1) y antes de la personalización (#2) (15/11/2026).
- Alcance inicial: Super Admin y Admin por club (15/11/2026).
- El ingreso es con Google, vía Supabase Auth (16/11/2026).
- El Super Admin nombra Admins cargando su email. La primera vez que esa persona entra con Google, ya tiene el club (16/11/2026).
- El modelo se apoya en `usuario`, `super_admin` y `club_miembro`, con un enum de rol extensible que hoy solo tiene `admin` (16/11/2026).
- El email del Super Admin no se guarda en el repo; el alta se hace directo en la base (16/11/2026).
- El DER oficial sigue mostrando solo lo migrado. El modelo de roles se documenta en un DER propuesto hasta que haya migración (16/11/2026).
- Las pantallas del admin se diseñan mobile first (15/11/2026 22:23; aplica también a estos mocks).
- Toda la app es mobile first y se optimiza para tablet y desktop: no se deja una columna de celular en pantallas grandes (16/11/2026 17:31 y 17:32).
- Se implementó el modelo, la migración (con invitaciones y `club.dominio_base`), las políticas RLS, el ingreso con Google vía Supabase Auth y las pantallas reales con la misma cáscara responsive (16/11/2026 18:00).
- El email del Super Admin se siembra directo en la base de desarrollo, con la plantilla `scripts/sembrar-super-admin.sql` (sin el email en el repo) (16/11/2026 18:00).
- El formulario real de crear club no se implementa hasta aprobar los mocks del formulario completo: vacío (nombre, identificador sugerido y editable, escudo con vista previa, paleta primario/secundario con vista previa, dominio base opcional con la explicación de `admin.` / `vivo.` y el fallback `/c/<slug>`), estado con errores de validación, y club creado con lo cargado y un botón para nombrar Admins (17/11/2026 08:26).
- Ningún club (tampoco Los Cardos) puede quedar hardcodeado en el código, los mocks, el copy ni los datos de ejemplo (17/11/2026 08:26).
- El ingreso con Google arranca solo por POST; el `redirect_to` de OAuth es `/auth/callback` sin query; el destino interno va en cookie; las cookies de PKCE y de sesión se aplican en la redirección (17/11/2026 08:34).
- Tras el POST de «Continuar con Google», la redirección a `/authorize` va con 303 See Other, no con 307, para que el navegador haga GET y no repita el POST (que devolvía 405). Las cookies de PKCE se copian a esa respuesta. El logout y las redirecciones del proxy tras un método que no es GET/HEAD también usan 303 (17/11/2026 09:58).
- Todos los usuarios, incluidos los Admins de cada club, entran solo por invitación. Si alguien entra con Google sin invitación, va a `/sin-acceso` y no se crea `usuario` ni ningún rol (17/11/2026 10:35).
- «Salir» es un POST a `/auth/salir`. El GET no cierra la sesión, para que el prefetch de Next no desloguee al entrar al admin (17/11/2026 10:35).
- El 17/11/2026 09:04 Jerónimo aprobó el formulario corto de crear club: 6 campos (nombre, identificador sugerido y editable, escudo, color de marca HEX + selector, color claro con default `#ffffff`, dominio opcional con la explicación de `admin.` / `vivo.` y el fallback `/c/<slug>`). Hover, pressed, fondo oscuro, texto con contraste AA e iniciales sin escudo se derivan en vivo. Los estados del sistema quedan fijos. La vista previa es en vivo (a la derecha en tablet y desktop; en mobile, debajo con toggle) y muestra header con escudo y nombre, botones con el color de marca y una tarjeta de ejemplo en claro y en oscuro. Los mocks cubren vacío, con datos de ejemplo genéricos, con errores y club creado. Lo demás de la identidad queda para la personalización. Todavía no se implementa el formulario real.
- El 17/11/2026 09:21 se actualizó la paleta del formulario de crear club (mocks): hasta 4 colores con HEX y selector. El color 1 es el principal, obligatorio (botones, header y acentos). Los colores 2, 3 y 4 son opcionales para detalles (insignias, líneas, indicador en vivo, destacados); si no se cargan, se derivan del principal. El color claro de fondo queda aparte (default `#ffffff`). La UI es una lista de hasta 4 swatches, con «Agregar color» hasta el 4 y la opción de quitar los opcionales. La vista previa aplica los 4, en claro y en oscuro. Los datos de ejemplo son genéricos; los hex de un club real no van hardcodeados (17/11/2026 09:21).
- El 17/11/2026 09:39 la paleta del formulario de crear club (mocks) quedó en hasta 3 colores: el 1 es el principal, obligatorio (botones, header y acentos); 2 y 3 son opcionales para detalles (insignias, líneas, indicador en vivo, destacados) y, si quedan vacíos, se derivan del principal. El color claro de fondo se pide aparte (default `#ffffff`). En desktop y tablet, la primera línea muestra el color principal al lado del color claro; debajo, los 2 opcionales lado a lado. En mobile van apilados en ese orden. No hay botón «Agregar color»: los 2 opcionales se muestran siempre. La vista previa aplica los 3, en claro y en oscuro. Los datos de ejemplo son genéricos; los hex de un club real no van hardcodeados (17/11/2026 09:39).
- El 17/11/2026 09:44 Jerónimo aprobó los mocks v4 y se implementó el formulario real en `/super-admin/nuevo-club`, igual al mock: nombre, identificador sugerido y editable (único y validado), escudo (bucket público `escudos`, RLS solo Super Admin para escribir), color principal obligatorio, color claro (default `#ffffff`), 2 colores opcionales (null = derivado) y dominio base opcional (validado y único). Vista previa en vivo con derivados. Pantalla de club creado con datos reales y botón a Admins. Migración idempotente (`escudo_ruta` y columnas de paleta, bucket y políticas) aplicada solo en desarrollo, y DER actualizado en el mismo commit (17/11/2026 09:44).
- El 17/11/2026 11:11 Jerónimo aprobó sumar ingreso por email (magic link de Supabase Auth) junto al de Google, en `/ingreso`. El formulario pide el email y «Enviarme el link»; si el formato es válido se muestra siempre el mismo mensaje neutro («Te mandamos un link a …»), esté o no invitada esa persona, para no revelar si el email está de alta. El correo solo se envía si hay invitación (pendiente o aceptada), o si ya es Super Admin o miembro de un club (`shouldCreateUser` solo en ese caso). El callback reusa `/auth/callback`, la cookie `el_club_siguiente` y redirecciones 303; también acepta `token_hash` con `verifyOtp`. La invitación se vincula por el email exacto (incluye alias `+`). Sin acceso, el destino sigue siendo `/sin-acceso`. En desarrollo se usa el SMTP incluido de Supabase (cupo bajo de correos por hora); no se configuró un SMTP propio (17/11/2026 11:11).
- El 17/11/2026 11:50 Jerónimo aprobó que, al invitar a un Admin, la app le mande el mismo magic link que «Enviarme el link» en `/ingreso` (`signInWithOtp`, `shouldCreateUser: true`, `emailRedirectTo` al `/auth/callback` del origen actual, con destino al admin del club). Si el envío falla (por ejemplo el cupo de 2 correos por hora), la invitación se mantiene y se avisa en la pantalla de Admins, con la acción «Reenviar link» en las pendientes. Todavía no hay una UI para invitar Super Admins; cuando exista, debe usar el mismo envío (17/11/2026 11:50).
- El 17/11/2026 12:24 Jerónimo aprobó que un Admin pueda invitar y quitar Admins solo de su club (nunca de otros). El Super Admin sigue teniendo acceso completo. La pantalla vive en `/c/<slug>/admin/admins` (la ruta vieja de Super Admin redirige ahí) y el menú del club muestra «Admins» también para el Admin del club. Las actions y el RLS limitan insert/delete de `club_invitacion` y delete de `club_miembro` al club que administra; al invitar se manda el mismo magic link, con «Reenviar link». No se puede quitar al último Admin del club (si es uno mismo, el mensaje lo dice claramente) y quitar sigue pidiendo confirmación (17/11/2026 12:24).
- El 17/11/2026 13:18 Jerónimo aprobó el menú ☰ en la cáscara de admin (Super Admin y admin de un club): a la izquierda de la barra superior, un botón con `aria-label` «Abrir menú» abre un cajón izquierdo (Sheet de shadcn) con el mismo contenido que el sidebar de escritorio — logo de producto + «El Club App» o, dentro de un club, escudo/iniciales y nombre con el tema del club; los ítems según el rol (Inicio, Clubes, Admins); y «Salir» con POST al pie. El cajón cubre **todo viewport por debajo de `lg` (1024px)**, celular y tablet; desde `lg` se usa el sidebar fijo. El ítem activo se destaca; el cajón se cierra al navegar, al tocar el fondo o con Escape; el foco queda atrapado y el layout respeta el área segura (17/11/2026 13:18).
- El 17/11/2026 13:24 Jerónimo aprobó que un Admin pueda editar los datos estéticos de su club (nombre, escudo, color principal, color claro, color 2 y color 3) con el mismo formulario y vista previa. La pantalla vive en `/c/<slug>/admin/club` y el menú del club muestra «Club». El identificador (`slug`), el dominio (`dominio_base`) y cualquier dato que afecte rutas de acceso quedan en solo lectura para el Admin y solo los puede cambiar el Super Admin. La action del servidor ignora esos campos si quien guarda no es Super Admin, y un trigger + RLS en la base impiden el cambio aunque se llame a la API: un Admin no puede tocar slug ni dominio, ni editar otro club (17/11/2026 13:24).
