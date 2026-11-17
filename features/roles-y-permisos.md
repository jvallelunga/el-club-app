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

Pensadas primero para celular y optimizadas para tablet y desktop (mismo markup, por breakpoints). Viven en `/mocks/roles` y se recorren desde el [índice](/mocks/roles). En escritorio, el ingreso va en una tarjeta centrada (con un panel del club a partir de `lg`); las listas de clubes usan una grilla; el admin entra en una cáscara reutilizable (barra superior en tablet, sidebar en desktop). Usan datos de ejemplo (nombres y emails ficticios, rotulados como ejemplo). Ningún club real —tampoco Los Cardos— aparece fijo en estos mocks. No hay login real.

| Pantalla | Ruta |
| --- | --- |
| Índice de mocks | `/mocks/roles` |
| Ingreso con Google | `/mocks/roles/ingreso` |
| Sin acceso | `/mocks/roles/sin-acceso` |
| Elegir club (solo si es Admin de más de un club) | `/mocks/roles/elegir-club` |
| Lista de clubes (Super Admin) | `/mocks/roles/super-admin` |
| Crear club (formulario completo) | `/mocks/roles/super-admin/nuevo-club` (también `/mocks/crear-club`) |
| Crear club con errores de validación | `/mocks/roles/super-admin/nuevo-club?errores=1` |
| Club creado | `/mocks/roles/super-admin/nuevo-club/creado` |
| Admins de un club (agregar por email / quitar, con confirmación) | `/mocks/roles/super-admin/clubes/[slug]/admins` |
| Inicio del admin del club (placeholder) | `/mocks/roles/clubes/[slug]` |

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

