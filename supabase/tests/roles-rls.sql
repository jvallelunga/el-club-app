-- Pruebas de RLS para roles y permisos.
-- Pensado para ejecutarse en desarrollo, dentro de una transacción que
-- hace rollback. No deja datos atrás.

begin;

create temporary table _t (
  clave text primary key,
  id uuid not null
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  email,
  crypt('no-se-usa', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', nombre),
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    ('rls-super@ejemplo.test', 'Super De Prueba'),
    ('rls-admin-a@ejemplo.test', 'Admin A'),
    ('rls-admin-b@ejemplo.test', 'Admin B'),
    ('rls-nadie@ejemplo.test', 'Sin Rol')
) as personas(email, nombre)
returning id, email
;

-- Si el trigger no creó el perfil (solo se crea con invitación), lo insertamos acá.
insert into public.usuario (id, nombre, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.email),
  lower(u.email)
from auth.users u
where u.email in (
  'rls-super@ejemplo.test',
  'rls-admin-a@ejemplo.test',
  'rls-admin-b@ejemplo.test',
  'rls-nadie@ejemplo.test'
)
on conflict (id) do nothing;

insert into _t (clave, id)
select 'super', u.id from public.usuario u where u.email = 'rls-super@ejemplo.test';
insert into _t (clave, id)
select 'admin_a', u.id from public.usuario u where u.email = 'rls-admin-a@ejemplo.test';
insert into _t (clave, id)
select 'admin_b', u.id from public.usuario u where u.email = 'rls-admin-b@ejemplo.test';
insert into _t (clave, id)
select 'nadie', u.id from public.usuario u where u.email = 'rls-nadie@ejemplo.test';

insert into public.super_admin (usuario_id)
select id from _t where clave = 'super';

insert into public.club (slug, nombre, color_principal, color_claro)
values
  ('rls-club-a', 'Club RLS A', '#1c1917', '#ffffff'),
  ('rls-club-b', 'Club RLS B', '#1c1917', '#ffffff')
returning id, slug
;

insert into _t (clave, id)
select 'club_a', c.id from public.club c where c.slug = 'rls-club-a';
insert into _t (clave, id)
select 'club_b', c.id from public.club c where c.slug = 'rls-club-b';

insert into public.club_miembro (club_id, usuario_id, rol)
values
  ((select id from _t where clave = 'club_a'), (select id from _t where clave = 'admin_a'), 'admin'),
  ((select id from _t where clave = 'club_b'), (select id from _t where clave = 'admin_b'), 'admin')
;

grant select on _t to authenticated;

create or replace function pg_temp.entrar(p_clave text)
returns void
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into strict v_id from _t where clave = p_clave;
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claim.sub',
    v_id::text,
    true
  );
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', v_id,
      'role', 'authenticated',
      'email', p_clave || '@oculto'
    )::text,
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

-- Super Admin ve los dos clubes.
select pg_temp.entrar('super');
do $$
declare
  n int;
begin
  select count(*) into n from public.club where slug like 'rls-club-%';
  if n <> 2 then
    raise exception 'Super Admin debería ver 2 clubes, vio %', n;
  end if;
end;
$$;
select pg_temp.salir();

-- Admin A solo ve el club A.
select pg_temp.entrar('admin_a');
do $$
declare
  n int;
  slugs text;
begin
  select count(*), string_agg(slug, ',') into n, slugs
  from public.club where slug like 'rls-club-%';
  if n <> 1 or slugs <> 'rls-club-a' then
    raise exception 'Admin A debería ver solo rls-club-a, vio % (%)', n, slugs;
  end if;
end;
$$;

-- Admin A no puede crear un club.
do $$
begin
  insert into public.club (slug, nombre) values ('rls-no-debe', 'No');
  raise exception 'Admin A no debería poder crear un club';
exception
  when insufficient_privilege then null;
  when others then
    if sqlerrm like 'Admin A no debería%' then
      raise;
    end if;
    -- RLS suele levantar 42501 o un error de política.
    null;
end;
$$;
select pg_temp.salir();

-- Sin rol no ve clubes.
select pg_temp.entrar('nadie');
do $$
declare
  n int;
begin
  select count(*) into n from public.club where slug like 'rls-club-%';
  if n <> 0 then
    raise exception 'Quien no tiene rol no debería ver clubes, vio %', n;
  end if;
end;
$$;
select pg_temp.salir();

-- Admin A no ve miembros del club B.
select pg_temp.entrar('admin_a');
do $$
declare
  n int;
begin
  select count(*) into n
  from public.club_miembro
  where club_id = (select id from _t where clave = 'club_b');
  if n <> 0 then
    raise exception 'Admin A no debería ver miembros del club B, vio %', n;
  end if;
end;
$$;

-- Admin A no puede invitar ni quitar Admins del club B.
do $$
begin
  insert into public.club_invitacion (club_id, email, rol)
  values (
    (select id from _t where clave = 'club_b'),
    'rls-invitado-b@ejemplo.test',
    'admin'
  );
  raise exception 'Admin A no debería poder invitar al club B';
exception
  when others then
    if sqlerrm like 'Admin A no debería%' then
      raise;
    end if;
end;
$$;

do $$
declare
  v_borrados int;
begin
  delete from public.club_miembro
  where club_id = (select id from _t where clave = 'club_b')
    and usuario_id = (select id from _t where clave = 'admin_b');
  get diagnostics v_borrados = row_count;
  if v_borrados <> 0 then
    raise exception 'Admin A no debería poder quitar Admins del club B';
  end if;
exception
  when others then
    if sqlerrm like 'Admin A no debería%' then
      raise;
    end if;
end;
$$;

-- Admin A sí puede invitar en su club.
insert into public.club_invitacion (club_id, email, rol)
values (
  (select id from _t where clave = 'club_a'),
  'rls-nuevo-a@ejemplo.test',
  'admin'
);

do $$
declare
  n int;
begin
  select count(*) into n
  from public.club_invitacion
  where club_id = (select id from _t where clave = 'club_a')
    and email = 'rls-nuevo-a@ejemplo.test'
    and aceptada_en is null;
  if n <> 1 then
    raise exception 'Admin A debería poder invitar en su club, hay %', n;
  end if;
end;
$$;

-- Admin A no puede quitarse si es el último Admin del club.
do $$
begin
  delete from public.club_miembro
  where club_id = (select id from _t where clave = 'club_a')
    and usuario_id = (select id from _t where clave = 'admin_a');
  raise exception 'No debería poderse quitar al último Admin';
exception
  when others then
    if sqlerrm like 'No debería%' then
      raise;
    end if;
    if sqlerrm not like '%último Admin%' then
      raise exception 'Error inesperado al quitar al último Admin: %', sqlerrm;
    end if;
end;
$$;
select pg_temp.salir();

-- Invitación por email se acepta de inmediato si el usuario ya existe.
insert into public.club_invitacion (club_id, email, rol)
values (
  (select id from _t where clave = 'club_a'),
  'rls-admin-b@ejemplo.test',
  'admin'
);

do $$
declare
  n int;
  aceptada timestamptz;
begin
  select count(*) into n
  from public.club_miembro
  where club_id = (select id from _t where clave = 'club_a')
    and usuario_id = (select id from _t where clave = 'admin_b');
  if n <> 1 then
    raise exception 'La invitación a un usuario existente debería crear membresía, hay %', n;
  end if;
  select aceptada_en into aceptada
  from public.club_invitacion
  where club_id = (select id from _t where clave = 'club_a')
    and email = 'rls-admin-b@ejemplo.test'
  order by creado_en desc
  limit 1;
  if aceptada is null then
    raise exception 'La invitación debería haber quedado aceptada';
  end if;
end;
$$;

-- Con dos Admins en el club A, Admin A puede quitar a Admin B.
select pg_temp.entrar('admin_a');
do $$
declare
  n int;
begin
  delete from public.club_miembro
  where club_id = (select id from _t where clave = 'club_a')
    and usuario_id = (select id from _t where clave = 'admin_b');
  select count(*) into n
  from public.club_miembro
  where club_id = (select id from _t where clave = 'club_a')
    and usuario_id = (select id from _t where clave = 'admin_b');
  if n <> 0 then
    raise exception 'Admin A debería poder quitar a otro Admin de su club';
  end if;
end;
$$;
select pg_temp.salir();

select 'Pruebas de RLS: ok' as resultado;

rollback;
