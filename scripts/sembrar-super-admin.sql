-- Sembrar un Super Admin por email.
-- Este archivo es una plantilla: NO pongas un email real acá (el repo es público).
-- Reemplazá EMAIL_DEL_SUPER_ADMIN y ejecutalo en el SQL Editor del proyecto
-- de desarrollo (o vía el conector, fuera del repo).
--
-- Si la persona ya entró alguna vez, queda como Super Admin de inmediato.
-- Si todavía no existe, queda invitada y se vincula en el primer login con Google.

insert into public.super_admin_invitacion (email)
values (lower('EMAIL_DEL_SUPER_ADMIN'))
on conflict (email) do nothing;

insert into public.super_admin (usuario_id)
select u.id
from public.usuario u
where u.email = lower('EMAIL_DEL_SUPER_ADMIN')
on conflict (usuario_id) do nothing;
