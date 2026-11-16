# Roles y permisos por club

Segundo ítem del paso 1, después de la [base del proyecto](base-del-proyecto.md). [#15](https://github.com/jvallelunga/el-club-app/issues/15). Todavía no implementado.

## Objetivo

Tener roles y permisos desde el principio, por club (multi-club), para que todo lo demás se apoye en eso.

## Alcance inicial

- **Super Admin**: acceso a todo, en todos los clubes.
- **Admin del club**: acceso a todo lo de su club.

No se implementa en la base del proyecto. La matriz rol × acción, la membresía usuario–club–rol, las políticas RLS y el login se acuerdan y se construyen en este ítem, con mocks aprobados antes de tocar el código.

Otros roles que figuraron como propuesta en el issue (staff de categoría, responsable de mesa, jugador, público) quedan para confirmar más adelante, no entran en este alcance inicial.

## Criterios de aceptación

- Quedan definidos el Super Admin y el Admin del club, documentados en esta feature y en el DER.
- Un Super Admin opera sobre cualquier club. Un Admin del club opera solo sobre el suyo, con acceso a todo lo de ese club.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.

## Decisiones

- Va después de la base (#1) y antes de la personalización (#2) (15/11/2026).
- Alcance inicial: Super Admin y Admin por club (15/11/2026).
