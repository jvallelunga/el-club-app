-- Quién puede pedir un magic link de ingreso.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- La función solo devuelve true/false. La llama el endpoint de ingreso
-- (anon) y no revela si el email está invitado: la app muestra el mismo
-- mensaje en ambos casos. El link solo se envía cuando el resultado es true.

create or replace function public.puede_solicitar_ingreso_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p_email is not null
    and length(trim(p_email)) > 0
    and (
      exists (
        select 1
        from public.super_admin_invitacion i
        where i.email = lower(trim(p_email))
      )
      or exists (
        select 1
        from public.club_invitacion i
        where i.email = lower(trim(p_email))
      )
      or exists (
        select 1
        from public.usuario u
        join public.super_admin s on s.usuario_id = u.id
        where u.email = lower(trim(p_email))
      )
      or exists (
        select 1
        from public.usuario u
        join public.club_miembro m on m.usuario_id = u.id
        where u.email = lower(trim(p_email))
      )
    );
$$;

comment on function public.puede_solicitar_ingreso_email(text) is
  'True si el email tiene invitación (pendiente o aceptada), es Super Admin o es miembro de un club. No expone más datos.';

revoke all on function public.puede_solicitar_ingreso_email(text) from public;
grant execute on function public.puede_solicitar_ingreso_email(text) to anon, authenticated, service_role;
