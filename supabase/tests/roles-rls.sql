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

grant select, insert, update on _t to authenticated;

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


-- Admin A puede actualizar la estética de su club, no slug ni dominio, ni el club B.
select pg_temp.entrar('admin_a');
do $$
declare
  v_nombre text;
  v_slug text;
  v_dominio text;
  v_n int;
begin
  update public.club
  set
    nombre = 'Club RLS A editado',
    color_principal = '#334155',
    color_claro = '#f8fafc'
  where id = (select id from _t where clave = 'club_a');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'Admin A debería poder editar la estética de su club, actualizó %', v_n;
  end if;
  select nombre into v_nombre from public.club where id = (select id from _t where clave = 'club_a');
  if v_nombre is distinct from 'Club RLS A editado' then
    raise exception 'Admin A no dejó grabado el nombre estético, quedó %', v_nombre;
  end if;

  begin
    update public.club
    set slug = 'rls-club-a-hack'
    where id = (select id from _t where clave = 'club_a');
    raise exception 'Admin A no debería poder cambiar el slug';
  exception
    when others then
      if sqlerrm like 'Admin A no debería%' then
        raise;
      end if;
  end;
  select slug into v_slug from public.club where id = (select id from _t where clave = 'club_a');
  if v_slug is distinct from 'rls-club-a' then
    raise exception 'El slug del club A no debería haber cambiado, quedó %', v_slug;
  end if;

  begin
    update public.club
    set dominio_base = 'hack-a.ejemplo.test'
    where id = (select id from _t where clave = 'club_a');
    raise exception 'Admin A no debería poder cambiar el dominio';
  exception
    when others then
      if sqlerrm like 'Admin A no debería%' then
        raise;
      end if;
  end;
  select dominio_base into v_dominio from public.club where id = (select id from _t where clave = 'club_a');
  if v_dominio is not null then
    raise exception 'El dominio del club A no debería haber cambiado, quedó %', v_dominio;
  end if;

  update public.club
  set nombre = 'No debe'
  where id = (select id from _t where clave = 'club_b');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder editar el club B';
  end if;
end;
$$;
select pg_temp.salir();

-- Super Admin sí puede cambiar el dominio (el slug de la app se deja quieto, pero a nivel de base está habilitado).
select pg_temp.entrar('super');
do $$
declare
  v_dominio text;
begin
  update public.club
  set dominio_base = 'club-rls-a.ejemplo.test'
  where id = (select id from _t where clave = 'club_a');
  select dominio_base into v_dominio from public.club where id = (select id from _t where clave = 'club_a');
  if v_dominio is distinct from 'club-rls-a.ejemplo.test' then
    raise exception 'El Super Admin debería poder cambiar el dominio, quedó %', v_dominio;
  end if;
end;
$$;
select pg_temp.salir();


-- Contacto, redes, sedes e instalaciones (cross-club).
-- Admin A actualiza el contacto de su club, no el del club B.
select pg_temp.entrar('admin_a');
do $$
declare
  v_n int;
  v_tel text;
begin
  update public.club
  set telefono = '+54 11 4000-0001', email = 'contacto-a@ejemplo.test'
  where id = (select id from _t where clave = 'club_a');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'Admin A debería poder editar el contacto de su club, actualizó %', v_n;
  end if;
  select telefono into v_tel from public.club where id = (select id from _t where clave = 'club_a');
  if v_tel is distinct from '+54 11 4000-0001' then
    raise exception 'No quedó grabado el teléfono del club A, quedó %', v_tel;
  end if;

  update public.club
  set telefono = 'no-debe'
  where id = (select id from _t where clave = 'club_b');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder editar el contacto del club B';
  end if;
end;
$$;
select pg_temp.salir();

-- Admin A puede crear una red de su club, no de B.
select pg_temp.entrar('admin_a');
do $$
declare
  v_n int;
begin
  insert into public.club_red_social (club_id, red, valor, orden)
  values (
    (select id from _t where clave = 'club_a'),
    'instagram',
    '@club-a-ejemplo',
    0
  );
  select count(*) into v_n
  from public.club_red_social
  where club_id = (select id from _t where clave = 'club_a');
  if v_n <> 1 then
    raise exception 'Admin A debería poder crear una red de su club, hay %', v_n;
  end if;

  begin
    insert into public.club_red_social (club_id, red, valor, orden)
    values (
      (select id from _t where clave = 'club_b'),
      'instagram',
      '@club-b-hack',
      0
    );
    raise exception 'Admin A no debería poder crear una red del club B';
  exception
    when others then
      if sqlerrm like 'Admin A no debería%' then
        raise;
      end if;
  end;
end;
$$;
select pg_temp.salir();

-- Admin A crea sede e instalación en su club; no puede en el club B.
select pg_temp.entrar('admin_a');
do $$
declare
  v_sede uuid;
  v_n int;
begin
  insert into public.sede (club_id, nombre, direccion, maps_url)
  values (
    (select id from _t where clave = 'club_a'),
    'Campo de ejemplo A',
    'Av. de ejemplo 100',
    'https://www.google.com/maps/@-34.60,-58.38,16z'
  )
  returning id into v_sede;
  insert into _t (clave, id) values ('sede_a', v_sede)
  on conflict (clave) do update set id = excluded.id;

  insert into public.instalacion (sede_id, tipo, nombre, notas)
  values (
    v_sede,
    'gym',
    'Gym principal',
    'Notas de ejemplo'
  );
  select count(*) into v_n from public.instalacion where sede_id = v_sede;
  if v_n <> 1 then
    raise exception 'Admin A debería poder crear una instalación de su sede, hay %', v_n;
  end if;

  begin
    insert into public.sede (club_id, nombre)
    values (
      (select id from _t where clave = 'club_b'),
      'Sede hack B'
    );
    raise exception 'Admin A no debería poder crear una sede del club B';
  exception
    when others then
      if sqlerrm like 'Admin A no debería%' then
        raise;
      end if;
  end;
end;
$$;
select pg_temp.salir();

-- Tipos: solo se aceptan los tipos definidos en código.
select pg_temp.entrar('admin_a');
do $$
begin
  begin
    insert into public.instalacion (sede_id, tipo, nombre)
    values ((select id from _t where clave = 'sede_a'), 'cantina', 'Cantina');
    raise exception 'No debería poder crearse una instalación con un tipo que no está en código';
  exception
    when check_violation then null;
  end;

  insert into public.instalacion (sede_id, tipo, nombre)
  values ((select id from _t where clave = 'sede_a'), 'otra', 'Cantina');
end;
$$;
select pg_temp.salir();

-- Admin B crea una sede; Admin A no la ve ni la usa.
select pg_temp.entrar('admin_b');
do $$
declare
  v_sede uuid;
begin
  insert into public.sede (club_id, nombre)
  values (
    (select id from _t where clave = 'club_b'),
    'Sede B'
  )
  returning id into v_sede;
  insert into _t (clave, id) values ('sede_b', v_sede)
  on conflict (clave) do update set id = excluded.id;
end;
$$;
select pg_temp.salir();

select pg_temp.entrar('admin_a');
do $$
declare
  v_n int;
begin
  select count(*) into v_n
  from public.sede
  where id = (select id from _t where clave = 'sede_b');
  if v_n <> 0 then
    raise exception 'Admin A no debería ver la sede del club B';
  end if;

  begin
    insert into public.instalacion (sede_id, tipo, nombre)
    values (
      (select id from _t where clave = 'sede_b'),
      'otra',
      'No debe'
    );
    raise exception 'Admin A no debería poder crear instalaciones en una sede del club B';
  exception
    when others then
      if sqlerrm like 'Admin A no debería%' then
        raise;
      end if;
  end;

  update public.instalacion
  set nombre = 'Hack'
  where sede_id = (select id from _t where clave = 'sede_b');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder editar instalaciones del club B';
  end if;
end;
$$;
select pg_temp.salir();

-- Un usuario sin rol no escribe sedes ni contacto.
select pg_temp.entrar('nadie');
do $$
declare
  v_n int;
begin
  update public.club
  set telefono = 'hack'
  where id = (select id from _t where clave = 'club_a');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Un usuario sin rol no debería editar el contacto';
  end if;

  begin
    insert into public.sede (club_id, nombre)
    values (
      (select id from _t where clave = 'club_a'),
      'Sede hack'
    );
    raise exception 'Un usuario sin rol no debería crear una sede';
  exception
    when others then
      if sqlerrm like 'Un usuario sin rol no debería%' then
        raise;
      end if;
  end;

end;
$$;
select pg_temp.salir();

-- Super Admin opera sobre cualquier club.
select pg_temp.entrar('super');
do $$
declare
  v_n int;
begin
  update public.club
  set web = 'https://club-b.ejemplo.test'
  where id = (select id from _t where clave = 'club_b');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'El Super Admin debería poder editar el contacto de cualquier club';
  end if;

  insert into public.sede (club_id, nombre)
  values (
    (select id from _t where clave = 'club_b'),
    'Sede del Super Admin en B'
  );

end;
$$;
select pg_temp.salir();

select 'Pruebas de RLS: ok' as resultado;

rollback;
