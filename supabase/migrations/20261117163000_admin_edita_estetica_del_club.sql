-- Un Admin puede actualizar los datos estéticos de su club
-- (nombre, escudo, paleta). slug y dominio_base solo los cambia el Super Admin.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.

-- ---------------------------------------------------------------------------
-- RLS: el Admin de un club (y el Super Admin) pueden actualizar esa fila.
-- El trigger de abajo impide que un Admin cambie slug o dominio_base.
-- ---------------------------------------------------------------------------

drop policy if exists club_update on public.club;
create policy club_update on public.club
  for update
  to authenticated
  using (interno.es_admin_club(id))
  with check (interno.es_admin_club(id));

-- ---------------------------------------------------------------------------
-- Trigger: slug y dominio_base solo los puede cambiar un Super Admin,
-- también si alguien llama a la API directo.
-- ---------------------------------------------------------------------------

create or replace function interno.impedir_cambio_de_rutas_del_club()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.slug is distinct from old.slug
     or new.dominio_base is distinct from old.dominio_base then
    if not interno.es_super_admin() then
      raise exception
        'Solo el Super Admin puede cambiar el identificador o el dominio del club.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

comment on function interno.impedir_cambio_de_rutas_del_club() is
  'Impide que un Admin (u otro rol que no sea Super Admin) cambie club.slug o club.dominio_base.';

revoke all on function interno.impedir_cambio_de_rutas_del_club()
  from public, anon, authenticated;

drop trigger if exists impedir_cambio_de_rutas_del_club on public.club;
create trigger impedir_cambio_de_rutas_del_club
  before update on public.club
  for each row
  execute function interno.impedir_cambio_de_rutas_del_club();

-- ---------------------------------------------------------------------------
-- Storage: un Admin puede subir, reemplazar o borrar el escudo de su club
-- (carpeta = <club_id>/...). El Super Admin sigue pudiendo en cualquier club.
-- ---------------------------------------------------------------------------

create or replace function interno.club_id_de_objeto_escudo(p_name text)
returns uuid
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_carpeta text;
begin
  v_carpeta := split_part(p_name, '/', 1);
  if v_carpeta ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_carpeta::uuid;
  end if;
  return null;
end;
$$;

comment on function interno.club_id_de_objeto_escudo(text) is
  'Extrae el id del club de la ruta de un escudo (<club_id>/escudo.ext). Null si el nombre no arranca con un UUID.';

revoke all on function interno.club_id_de_objeto_escudo(text) from public, anon;
grant execute on function interno.club_id_de_objeto_escudo(text) to authenticated, service_role;

drop policy if exists escudos_insert_admin_club on storage.objects;
create policy escudos_insert_admin_club
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'escudos'
    and interno.es_admin_club(interno.club_id_de_objeto_escudo(name))
  );

drop policy if exists escudos_update_admin_club on storage.objects;
create policy escudos_update_admin_club
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'escudos'
    and interno.es_admin_club(interno.club_id_de_objeto_escudo(name))
  )
  with check (
    bucket_id = 'escudos'
    and interno.es_admin_club(interno.club_id_de_objeto_escudo(name))
  );

drop policy if exists escudos_delete_admin_club on storage.objects;
create policy escudos_delete_admin_club
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'escudos'
    and interno.es_admin_club(interno.club_id_de_objeto_escudo(name))
  );
