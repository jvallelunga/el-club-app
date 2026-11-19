-- Pruebas de RLS de los deportes del club (#75).
-- El Admin del club y el Super Admin suman y quitan deportes del catálogo;
-- el Admin de otro club no lee ni escribe los de este club. Un deporte
-- borrado no se suma, pero el club que ya lo tenía lo sigue viendo.
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
    ('cdep-super@ejemplo.test', 'Super'),
    ('cdep-admin@ejemplo.test', 'Admin Uno'),
    ('cdep-otro@ejemplo.test', 'Admin Otro'),
    ('cdep-nadie@ejemplo.test', 'Sin Rol')
) as personas(email, nombre);

insert into public.usuario (id, nombre, email)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email), lower(u.email)
from auth.users u
where u.email like 'cdep-%@ejemplo.test'
on conflict (id) do nothing;

insert into _t select 'super', id from public.usuario where email = 'cdep-super@ejemplo.test';
insert into _t select 'admin', id from public.usuario where email = 'cdep-admin@ejemplo.test';
insert into _t select 'otro', id from public.usuario where email = 'cdep-otro@ejemplo.test';
insert into _t select 'nadie', id from public.usuario where email = 'cdep-nadie@ejemplo.test';

insert into public.super_admin (usuario_id) select id from _t where clave = 'super';

insert into public.club (slug, nombre, color_principal, color_claro)
values
  ('cdep-uno', 'Club Uno', '#1c1917', '#ffffff'),
  ('cdep-otro', 'Club Otro', '#1c1917', '#ffffff');
insert into _t select 'club', id from public.club where slug = 'cdep-uno';
insert into _t select 'club_otro', id from public.club where slug = 'cdep-otro';

insert into public.club_miembro (club_id, usuario_id, rol)
values
  ((select id from _t where clave = 'club'), (select id from _t where clave = 'admin'), 'admin'),
  ((select id from _t where clave = 'club_otro'), (select id from _t where clave = 'otro'), 'admin');

insert into public.deporte (nombre, icono) values ('CDep Rugby', 'rugby'), ('CDep Hockey', 'hockey');
insert into _t select 'rugby', id from public.deporte where nombre = 'CDep Rugby';
insert into _t select 'hockey', id from public.deporte where nombre = 'CDep Hockey';

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

create or replace function pg_temp.id(p_clave text)
returns uuid
language sql
as $$
  select id from _t where clave = p_clave;
$$;

-- El Admin suma dos deportes a su club, los lee y quita uno.
select pg_temp.entrar('admin');
do $$
declare
  v_n int;
begin
  insert into public.club_deporte (club_id, deporte_id)
  values (pg_temp.id('club'), pg_temp.id('rugby')), (pg_temp.id('club'), pg_temp.id('hockey'));

  select count(*) into v_n from public.club_deporte where club_id = pg_temp.id('club');
  if v_n <> 2 then
    raise exception 'El Admin debería leer los deportes de su club, vio %', v_n;
  end if;

  delete from public.club_deporte
  where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('hockey');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'El Admin debería poder quitar un deporte de su club';
  end if;

  -- No se edita: un deporte se suma o se quita.
  begin
    update public.club_deporte set deporte_id = pg_temp.id('hockey')
    where club_id = pg_temp.id('club');
    raise exception 'Nadie debería poder editar un deporte del club';
  exception when insufficient_privilege then null;
  end;

  -- No puede sumar deportes a otro club.
  begin
    insert into public.club_deporte (club_id, deporte_id)
    values (pg_temp.id('club_otro'), pg_temp.id('rugby'));
    raise exception 'El Admin no debería poder sumar deportes a otro club';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%row-level security%' then
        raise;
      end if;
  end;
end;
$$;
select pg_temp.salir();

-- El Admin de otro club no lee ni quita los deportes de este club.
select pg_temp.entrar('otro');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.club_deporte where club_id = pg_temp.id('club');
  if v_n <> 0 then
    raise exception 'El Admin de otro club no debería ver los deportes de este club, vio %', v_n;
  end if;

  delete from public.club_deporte where club_id = pg_temp.id('club');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'El Admin de otro club no debería poder quitar deportes de este club';
  end if;

  begin
    insert into public.club_deporte (club_id, deporte_id)
    values (pg_temp.id('club'), pg_temp.id('hockey'));
    raise exception 'El Admin de otro club no debería poder sumar deportes a este club';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%row-level security%' then
        raise;
      end if;
  end;
end;
$$;
select pg_temp.salir();

-- Alguien sin rol no ve nada.
select pg_temp.entrar('nadie');
do $$
begin
  if exists (select 1 from public.club_deporte) then
    raise exception 'Alguien sin rol no debería ver deportes de clubes';
  end if;
end;
$$;
select pg_temp.salir();

-- El Super Admin ve y escribe los deportes de cualquier club, y borra
-- (soft delete) el rugby del catálogo.
select pg_temp.entrar('super');
do $$
declare
  v_n int;
begin
  insert into public.club_deporte (club_id, deporte_id)
  values (pg_temp.id('club_otro'), pg_temp.id('hockey'));

  select count(*) into v_n from public.club_deporte
  where club_id in (pg_temp.id('club'), pg_temp.id('club_otro'));
  if v_n <> 2 then
    raise exception 'El Super Admin debería ver los deportes de todos los clubes, vio %', v_n;
  end if;

  update public.deporte set borrado_en = now() where id = pg_temp.id('rugby');

  -- Un deporte borrado no se suma, tampoco el Super Admin.
  begin
    insert into public.club_deporte (club_id, deporte_id)
    values (pg_temp.id('club_otro'), pg_temp.id('rugby'));
    raise exception 'No debería poder sumarse un deporte borrado';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%row-level security%' then
        raise;
      end if;
  end;
end;
$$;
select pg_temp.salir();

-- El club que tenía el deporte borrado lo sigue viendo, pero no lo puede
-- volver a sumar después de quitarlo.
select pg_temp.entrar('admin');
do $$
begin
  if not exists (
    select 1 from public.club_deporte
    where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby')
  ) then
    raise exception 'El club debería seguir teniendo el deporte borrado';
  end if;

  delete from public.club_deporte
  where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby');

  begin
    insert into public.club_deporte (club_id, deporte_id)
    values (pg_temp.id('club'), pg_temp.id('rugby'));
    raise exception 'Un deporte borrado no debería poder volver a sumarse';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm not like '%row-level security%' then
        raise;
      end if;
  end;
end;
$$;
select pg_temp.salir();

select 'Pruebas de RLS de los deportes del club: ok' as resultado;

rollback;
