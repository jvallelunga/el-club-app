-- Pruebas de RLS del catálogo de deportes (#73).
-- Solo el Super Admin escribe; leen el Super Admin y los Admins de cualquier
-- club. Borrar es un soft delete y un deporte borrado no se edita.
-- Corre dentro de una transacción que hace rollback. No deja datos atrás.

begin;

create temporary table _t (
  clave text primary key,
  id uuid not null
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
  'authenticated', email, crypt('no-se-usa', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', nombre), now(), now(), '', '', '', ''
from (
  values
    ('dep-super@ejemplo.test', 'Super Deportes'),
    ('dep-admin@ejemplo.test', 'Admin Deportes'),
    ('dep-nadie@ejemplo.test', 'Sin Rol')
) as personas(email, nombre);

insert into public.usuario (id, nombre, email)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email), lower(u.email)
from auth.users u
where u.email like 'dep-%@ejemplo.test'
on conflict (id) do nothing;

insert into _t select 'super', id from public.usuario where email = 'dep-super@ejemplo.test';
insert into _t select 'admin', id from public.usuario where email = 'dep-admin@ejemplo.test';
insert into _t select 'nadie', id from public.usuario where email = 'dep-nadie@ejemplo.test';

insert into public.super_admin (usuario_id) select id from _t where clave = 'super';

insert into public.club (slug, nombre, color_principal, color_claro)
values ('dep-club', 'Club Deportes', '#1c1917', '#ffffff');
insert into _t select 'club', id from public.club where slug = 'dep-club';

insert into public.club_miembro (club_id, usuario_id, rol)
values ((select id from _t where clave = 'club'), (select id from _t where clave = 'admin'), 'admin');

grant select, insert on _t to authenticated;

create or replace function pg_temp.entrar(p_clave text)
returns void
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into strict v_id from _t where clave = p_clave;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_id, 'role', 'authenticated')::text,
    true
  );
end;
$$;

create or replace function pg_temp.salir()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);
end;
$$;

-- El Super Admin crea y edita un deporte.
select pg_temp.entrar('super');
do $$
declare
  v_id uuid;
begin
  insert into public.deporte (nombre, icono, descripcion)
  values ('Rugby masculino', 'rugby', 'Rugby XV')
  returning id into v_id;
  insert into _t (clave, id) values ('rugby', v_id);

  update public.deporte set nombre = 'Rugby M', icono = 'trofeo' where id = v_id;
  if (select nombre from public.deporte where id = v_id) <> 'Rugby M' then
    raise exception 'El Super Admin debería poder editar un deporte';
  end if;
  update public.deporte set nombre = 'Rugby masculino' where id = v_id;
end;
$$;

-- El ícono tiene que ser del set y el nombre no puede quedar vacío.
do $$
begin
  begin
    insert into public.deporte (nombre, icono) values ('Pelota', 'pelota');
    raise exception 'Un ícono fuera del set no debería guardarse';
  exception when check_violation then null;
  end;
  begin
    insert into public.deporte (nombre, icono) values ('', 'rugby');
    raise exception 'Un nombre vacío no debería guardarse';
  exception when check_violation then null;
  end;
end;
$$;

-- Dos deportes activos no comparten nombre, sin importar mayúsculas.
do $$
begin
  insert into public.deporte (nombre, icono) values ('RUGBY MASCULINO', 'rugby');
  raise exception 'No debería haber dos deportes con el mismo nombre';
exception when unique_violation then null;
end;
$$;

-- No se crea un deporte ya borrado.
do $$
begin
  insert into public.deporte (nombre, icono, borrado_en) values ('Hockey', 'hockey', now());
  raise exception 'No debería crearse un deporte ya borrado';
exception
  when insufficient_privilege then null;
  when others then
    if sqlerrm not like '%row-level security%' then
      raise;
    end if;
end;
$$;
select pg_temp.salir();

-- Un Admin de un club lee el catálogo, pero no escribe.
select pg_temp.entrar('admin');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.deporte where id = (select id from _t where clave = 'rugby');
  if v_n <> 1 then
    raise exception 'El Admin debería leer el catálogo';
  end if;

  begin
    insert into public.deporte (nombre, icono) values ('Hockey', 'hockey');
    raise exception 'El Admin no debería poder crear un deporte';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%row-level security%' then
        raise;
      end if;
  end;

  update public.deporte set nombre = 'Cambiado' where id = (select id from _t where clave = 'rugby');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'El Admin no debería poder editar un deporte';
  end if;

  update public.deporte set borrado_en = now() where id = (select id from _t where clave = 'rugby');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'El Admin no debería poder borrar un deporte';
  end if;

  begin
    delete from public.deporte where id = (select id from _t where clave = 'rugby');
    raise exception 'El Admin no debería poder borrar filas del catálogo';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select pg_temp.salir();

-- Alguien sin rol no ve el catálogo.
select pg_temp.entrar('nadie');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.deporte;
  if v_n <> 0 then
    raise exception 'Alguien sin rol no debería ver el catálogo, vio %', v_n;
  end if;
end;
$$;
select pg_temp.salir();

-- El Super Admin borra (soft delete): la fila queda, no se edita más y su
-- nombre se puede volver a usar. Borrar la fila de verdad no se puede.
select pg_temp.entrar('super');
do $$
declare
  v_id uuid := (select id from _t where clave = 'rugby');
  v_n int;
begin
  begin
    delete from public.deporte where id = v_id;
    raise exception 'Nadie debería poder borrar filas del catálogo';
  exception when insufficient_privilege then null;
  end;

  update public.deporte set borrado_en = now() where id = v_id;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'El Super Admin debería poder borrar un deporte';
  end if;

  update public.deporte set nombre = 'Revivido', borrado_en = null where id = v_id;
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Un deporte borrado no debería poder editarse';
  end if;

  if (select nombre from public.deporte where id = v_id) <> 'Rugby masculino' then
    raise exception 'El deporte borrado debería seguir en la tabla, sin cambios';
  end if;

  insert into public.deporte (nombre, icono) values ('Rugby masculino', 'rugby');
end;
$$;
select pg_temp.salir();

-- El Admin también ve los borrados: en #56 sus jugadores quedan asociados.
select pg_temp.entrar('admin');
do $$
begin
  if not exists (
    select 1 from public.deporte
    where id = (select id from _t where clave = 'rugby') and borrado_en is not null
  ) then
    raise exception 'El Admin debería ver los deportes borrados';
  end if;
end;
$$;
select pg_temp.salir();

select 'Pruebas de RLS de deportes: ok' as resultado;

rollback;
