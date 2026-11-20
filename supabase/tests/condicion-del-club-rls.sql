-- Pruebas de RLS de la condición del club (#77).
-- El Admin del club y el Super Admin cambian la condición que el club le suma
-- a un deporte; el Admin de otro club no la lee ni la cambia. La base valida
-- la forma (interno.es_condicion_valida), solo deja cambiar esa columna y no
-- la deja cambiar si el deporte se borró del catálogo.
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
    ('ccond-super@ejemplo.test', 'Super'),
    ('ccond-admin@ejemplo.test', 'Admin Uno'),
    ('ccond-otro@ejemplo.test', 'Admin Otro'),
    ('ccond-nadie@ejemplo.test', 'Sin Rol')
) as personas(email, nombre);

insert into public.usuario (id, nombre, email)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email), lower(u.email)
from auth.users u
where u.email like 'ccond-%@ejemplo.test'
on conflict (id) do nothing;

insert into _t select 'super', id from public.usuario where email = 'ccond-super@ejemplo.test';
insert into _t select 'admin', id from public.usuario where email = 'ccond-admin@ejemplo.test';
insert into _t select 'otro', id from public.usuario where email = 'ccond-otro@ejemplo.test';
insert into _t select 'nadie', id from public.usuario where email = 'ccond-nadie@ejemplo.test';

insert into public.super_admin (usuario_id) select id from _t where clave = 'super';

insert into public.club (slug, nombre, color_principal, color_claro)
values
  ('ccond-uno', 'Club Uno', '#1c1917', '#ffffff'),
  ('ccond-otro', 'Club Otro', '#1c1917', '#ffffff');
insert into _t select 'club', id from public.club where slug = 'ccond-uno';
insert into _t select 'club_otro', id from public.club where slug = 'ccond-otro';

insert into public.club_miembro (club_id, usuario_id, rol)
values
  ((select id from _t where clave = 'club'), (select id from _t where clave = 'admin'), 'admin'),
  ((select id from _t where clave = 'club_otro'), (select id from _t where clave = 'otro'), 'admin');

insert into public.deporte (nombre, icono) values ('CCond Rugby', 'rugby'), ('CCond Hockey', 'hockey');
insert into _t select 'rugby', id from public.deporte where nombre = 'CCond Rugby';
insert into _t select 'hockey', id from public.deporte where nombre = 'CCond Hockey';

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

-- El club ya tiene el rugby, sin condición propia.
insert into public.club_deporte (club_id, deporte_id)
values (pg_temp.id('club'), pg_temp.id('rugby'));

-- El Admin suma una condición del club, la lee y no la puede dejar inválida.
select pg_temp.entrar('admin');
do $$
declare
  v_n int;
  v_condicion jsonb;
begin
  select condicion into strict v_condicion from public.club_deporte
  where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby');
  if v_condicion <> '{"conector": "Y", "items": []}'::jsonb then
    raise exception 'Un deporte recién sumado no debería tener condición del club, tiene %', v_condicion;
  end if;

  update public.club_deporte
  set condicion = '{"conector": "Y", "items": [{"campo": "edad", "desde": 6}]}'
  where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'El Admin debería poder cambiar la condición del club';
  end if;

  select condicion into strict v_condicion from public.club_deporte
  where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby');
  if v_condicion->'items'->0->>'desde' <> '6' then
    raise exception 'El Admin debería leer la condición que guardó, leyó %', v_condicion;
  end if;

  begin
    update public.club_deporte
    set condicion = '{"conector": "Y", "items": [{"campo": "edad", "desde": 12, "hasta": 6}]}'
    where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby');
    raise exception 'No debería guardarse una condición del club inválida';
  exception when check_violation then null;
  end;

  -- Solo se cambia la condición: el vínculo no se edita.
  begin
    update public.club_deporte set deporte_id = pg_temp.id('hockey')
    where club_id = pg_temp.id('club');
    raise exception 'Nadie debería poder cambiar el deporte de un vínculo';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select pg_temp.salir();

-- El Admin de otro club no lee ni cambia la condición de este club.
select pg_temp.entrar('otro');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.club_deporte where club_id = pg_temp.id('club');
  if v_n <> 0 then
    raise exception 'El Admin de otro club no debería leer la condición de este club';
  end if;

  update public.club_deporte set condicion = '{"conector": "Y", "items": []}'
  where club_id = pg_temp.id('club');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'El Admin de otro club no debería poder cambiar la condición de este club';
  end if;
end;
$$;
select pg_temp.salir();

-- Alguien sin rol tampoco la cambia.
select pg_temp.entrar('nadie');
do $$
declare
  v_n int;
begin
  update public.club_deporte set condicion = '{"conector": "Y", "items": []}';
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Alguien sin rol no debería poder cambiar condiciones de clubes';
  end if;
end;
$$;
select pg_temp.salir();

-- El Super Admin cambia la condición de cualquier club.
select pg_temp.entrar('super');
do $$
declare
  v_n int;
begin
  update public.club_deporte
  set condicion = '{"conector": "O", "items": [{"campo": "sexo", "valor": "F"}, {"campo": "anio", "hasta": 2015}]}'
  where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'El Super Admin debería poder cambiar la condición de cualquier club';
  end if;
end;
$$;
select pg_temp.salir();

-- La condición del Admin de este club quedó como la dejó el Super Admin:
-- el intento del otro Admin no la tocó.
do $$
begin
  if (select condicion->>'conector' from public.club_deporte
      where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby')) <> 'O' then
    raise exception 'La condición debería ser la que guardó el Super Admin';
  end if;
end;
$$;

-- Si el Super Admin borra el deporte del catálogo, la condición del club
-- queda como estaba: nadie la cambia.
select pg_temp.entrar('super');
update public.deporte set borrado_en = now() where id = pg_temp.id('rugby');
select pg_temp.salir();

select pg_temp.entrar('admin');
do $$
declare
  v_n int;
begin
  update public.club_deporte set condicion = '{"conector": "Y", "items": []}'
  where club_id = pg_temp.id('club') and deporte_id = pg_temp.id('rugby');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'No debería poder cambiarse la condición del club de un deporte borrado';
  end if;
end;
$$;
select pg_temp.salir();

select 'Pruebas de RLS de la condición del club: ok' as resultado;

rollback;
