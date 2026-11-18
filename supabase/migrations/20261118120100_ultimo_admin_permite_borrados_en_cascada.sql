-- La salvaguarda del último Admin no bloquea borrar el club ni la persona.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- El trigger evitar_quitar_ultimo_admin también saltaba en los borrados en
-- cascada: no se podía borrar un club con Admins ni un usuario de Auth que
-- fuera el último Admin de algún club. En una cascada, la fila padre ya no
-- es visible cuando se borra club_miembro, así que en ese caso se deja pasar.
-- Quitar al último Admin directamente sigue sin poder hacerse.

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

  -- Borrado en cascada del club o de la persona: no hay Admin que proteger.
  if not exists (select 1 from public.club where id = old.club_id)
    or not exists (select 1 from public.usuario where id = old.usuario_id)
  then
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
  'Impide borrar el último Admin de un club, salvo cuando se borra el club o la persona.';

revoke all on function interno.evitar_quitar_ultimo_admin() from public, anon, authenticated;
