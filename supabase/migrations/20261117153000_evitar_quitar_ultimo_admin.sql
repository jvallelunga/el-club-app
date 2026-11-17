-- Salvaguarda: no se puede quitar al último Admin de un club.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- Las políticas RLS ya permiten que un Admin (o el Super Admin) inserte o
-- borre club_invitacion y club_miembro solo en los clubes que administra
-- (interno.es_admin_club). Esta migración no cambia esas políticas: suma
-- un trigger para no dejar un club sin Admins.

create or replace function interno.evitar_quitar_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_restantes integer;
begin
  if old.rol is distinct from 'admin' then
    return old;
  end if;

  select count(*)
    into v_restantes
  from public.club_miembro
  where club_id = old.club_id
    and rol = 'admin'
    and usuario_id is distinct from old.usuario_id;

  if v_restantes = 0 then
    raise exception 'No se puede quitar al último Admin del club.'
      using errcode = 'P0001';
  end if;

  return old;
end;
$$;

comment on function interno.evitar_quitar_ultimo_admin() is
  'Impide borrar el último Admin de un club.';

revoke all on function interno.evitar_quitar_ultimo_admin() from public, anon, authenticated;

drop trigger if exists evitar_quitar_ultimo_admin on public.club_miembro;
create trigger evitar_quitar_ultimo_admin
  before delete on public.club_miembro
  for each row
  execute function interno.evitar_quitar_ultimo_admin();
