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

-- Predio (#42): escribe solo el Super Admin; leen los Admins del club.
-- Un Admin no puede crear el predio de una sede de su club.
select pg_temp.entrar('admin_a');
do $$
begin
  begin
    insert into public.predio (sede_id, origen_lat, origen_lng)
    values ((select id from _t where clave = 'sede_a'), -37.336, -59.08);
    raise exception 'Admin A no debería poder crear el predio de su sede';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
select pg_temp.salir();

-- El Super Admin crea el predio y el área tiene que ser una lista de puntos.
select pg_temp.entrar('super');
do $$
declare
  v_predio uuid;
begin
  insert into public.predio (sede_id, origen_lat, origen_lng, area)
  values (
    (select id from _t where clave = 'sede_a'),
    -37.336,
    -59.08,
    '[[0, 0], [120.5, 0], [120.5, 80], [0, 80]]'::jsonb
  )
  returning id into v_predio;
  insert into _t (clave, id) values ('predio_a', v_predio);

  begin
    update public.predio set area = '[[0, 0], [10, 0]]'::jsonb where id = v_predio;
    raise exception 'Un área de dos puntos no debería guardarse';
  exception
    when check_violation then null;
  end;

  begin
    update public.predio set area = '[[0, 0], [10, "x"], [5, 5]]'::jsonb where id = v_predio;
    raise exception 'Un área con un punto que no es número no debería guardarse';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.predio (sede_id, origen_lat, origen_lng)
    values ((select id from _t where clave = 'sede_a'), -37.3, -59.1);
    raise exception 'Una sede no debería tener dos predios';
  exception
    when unique_violation then null;
  end;
end;
$$;
select pg_temp.salir();

-- Admin A ve el predio de su sede pero no lo edita ni lo borra.
select pg_temp.entrar('admin_a');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.predio where id = (select id from _t where clave = 'predio_a');
  if v_n <> 1 then
    raise exception 'Admin A debería ver el predio de su sede, ve %', v_n;
  end if;

  update public.predio set origen_lat = -37.4 where id = (select id from _t where clave = 'predio_a');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder editar el predio';
  end if;

  delete from public.predio where id = (select id from _t where clave = 'predio_a');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder borrar el predio';
  end if;
end;
$$;
select pg_temp.salir();

-- Admin B no ve el predio del club A.
select pg_temp.entrar('admin_b');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.predio where id = (select id from _t where clave = 'predio_a');
  if v_n <> 0 then
    raise exception 'Admin B no debería ver el predio del club A';
  end if;
end;
$$;
select pg_temp.salir();

-- El Super Admin edita el predio guardado.
select pg_temp.entrar('super');
do $$
declare
  v_n int;
begin
  update public.predio
  set area = '[[0, 0], [130, 0], [130, 90], [0, 90]]'::jsonb, actualizado_en = now()
  where id = (select id from _t where clave = 'predio_a');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'El Super Admin debería poder editar el predio, actualizó %', v_n;
  end if;
end;
$$;
select pg_temp.salir();

-- Instalaciones en el predio (#43): mismo RLS que predio. Guardar va por
-- guardar_predio, que guarda el área y las instalaciones juntas.
select pg_temp.entrar('super');
do $$
declare
  v_inst uuid;
  v_sede2 uuid;
begin
  insert into public.instalacion (sede_id, tipo, nombre)
  values ((select id from _t where clave = 'sede_a'), 'cancha_rugby', 'Cancha 1')
  returning id into v_inst;
  insert into _t (clave, id) values ('inst_cancha', v_inst);

  insert into public.instalacion (sede_id, tipo, nombre)
  values ((select id from _t where clave = 'sede_a'), 'pileta', 'Pileta')
  returning id into v_inst;
  insert into _t (clave, id) values ('inst_pileta', v_inst);

  insert into public.sede (club_id, nombre)
  values ((select id from _t where clave = 'club_a'), 'Otra sede de A')
  returning id into v_sede2;
  insert into public.instalacion (sede_id, tipo, nombre)
  values (v_sede2, 'gym', 'Gym de la otra sede')
  returning id into v_inst;
  insert into _t (clave, id) values ('inst_otra_sede', v_inst);
end;
$$;
select pg_temp.salir();

-- Un Admin no ubica instalaciones, ni directo ni con guardar_predio.
select pg_temp.entrar('admin_a');
do $$
begin
  begin
    insert into public.elemento_predio (predio_id, instalacion_id, este, norte, rotacion, medidas)
    values (
      (select id from _t where clave = 'predio_a'),
      (select id from _t where clave = 'inst_cancha'),
      0, 0, 0, '{"largo": 100, "ancho": 70, "ingoal": 10}'
    );
    raise exception 'Admin A no debería poder ubicar una instalación';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.guardar_predio(
      (select id from _t where clave = 'sede_a'), -37.336, -59.08, '[]'::jsonb,
      jsonb_build_array(jsonb_build_object(
        'instalacion_id', (select id from _t where clave = 'inst_cancha'),
        'este', 0, 'norte', 0, 'rotacion', 0,
        'medidas', '{"largo": 100, "ancho": 70, "ingoal": 10}'::jsonb)),
      '[]'::jsonb
    );
    raise exception 'Admin A no debería poder guardar el predio';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
select pg_temp.salir();

-- El Super Admin ubica, mueve, rota y quita instalaciones.
select pg_temp.entrar('super');
do $$
declare
  v_sede uuid := (select id from _t where clave = 'sede_a');
  v_cancha uuid := (select id from _t where clave = 'inst_cancha');
  v_pileta uuid := (select id from _t where clave = 'inst_pileta');
  v_n int;
  v_este double precision;
  v_area jsonb;
begin
  -- Ubica las dos; la de otra sede se ignora.
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, '[[0, 0], [200, 0], [200, 150], [0, 150]]'::jsonb,
    jsonb_build_array(
      jsonb_build_object('instalacion_id', v_cancha, 'este', 70, 'norte', 50, 'rotacion', 0,
        'medidas', '{"largo": 100, "ancho": 70, "ingoal": 10}'::jsonb),
      jsonb_build_object('instalacion_id', v_pileta, 'este', 20, 'norte', 120, 'rotacion', 90,
        'medidas', '{"largo": 25, "ancho": 12}'::jsonb),
      jsonb_build_object('instalacion_id', (select id from _t where clave = 'inst_otra_sede'),
        'este', 0, 'norte', 0, 'rotacion', 0, 'medidas', '{"largo": 20, "ancho": 12, "alto": 5}'::jsonb)
    ),
      '[]'::jsonb
  );
  select count(*) into v_n from public.elemento_predio
  where predio_id = (select id from _t where clave = 'predio_a');
  if v_n <> 2 then
    raise exception 'Deberían quedar ubicadas 2 instalaciones, hay %', v_n;
  end if;

  -- Mueve y rota la cancha, y quita la pileta del predio.
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, '[[0, 0], [200, 0], [200, 150], [0, 150]]'::jsonb,
    jsonb_build_array(
      jsonb_build_object('instalacion_id', v_cancha, 'este', 80.5, 'norte', 50, 'rotacion', 47.5,
        'medidas', '{"largo": 100, "ancho": 68, "ingoal": 10}'::jsonb)
    ),
      '[]'::jsonb
  );
  select este into v_este from public.elemento_predio where instalacion_id = v_cancha;
  if v_este is distinct from 80.5 then
    raise exception 'La cancha debería estar en 80.5 m al este, está en %', v_este;
  end if;
  if exists (select 1 from public.elemento_predio where instalacion_id = v_pileta) then
    raise exception 'La pileta debería haber salido del predio';
  end if;
  if not exists (select 1 from public.instalacion where id = v_pileta) then
    raise exception 'Quitar la pileta del predio no debería borrarla de la sede';
  end if;

  -- Guardar es todo o nada: con una medida inválida no cambia ni el área.
  begin
    perform public.guardar_predio(
      v_sede, -37.336, -59.08, '[[0, 0], [10, 0], [10, 10]]'::jsonb,
      jsonb_build_array(
        jsonb_build_object('instalacion_id', v_cancha, 'este', 0, 'norte', 0, 'rotacion', 0,
          'medidas', '{"largo": -1, "ancho": 68, "ingoal": 10}'::jsonb)
      ),
      '[]'::jsonb
    );
    raise exception 'Una medida negativa no debería guardarse';
  exception
    when check_violation then null;
  end;
  select area into v_area from public.predio where id = (select id from _t where clave = 'predio_a');
  if jsonb_array_length(v_area) <> 4 then
    raise exception 'Si guardar falla, el área no debería cambiar';
  end if;

  -- Una instalación se ubica a lo sumo una vez.
  begin
    insert into public.elemento_predio (predio_id, instalacion_id, este, norte, rotacion, medidas)
    values ((select id from _t where clave = 'predio_a'), v_cancha, 0, 0, 0,
      '{"largo": 100, "ancho": 70, "ingoal": 10}');
    raise exception 'Una instalación no debería ubicarse dos veces';
  exception
    when unique_violation then null;
  end;

  -- Solo instalaciones de la sede del predio.
  begin
    insert into public.elemento_predio (predio_id, instalacion_id, este, norte, rotacion, medidas)
    values ((select id from _t where clave = 'predio_a'),
      (select id from _t where clave = 'inst_otra_sede'), 0, 0, 0, '{"largo": 20, "ancho": 12, "alto": 5}');
    raise exception 'No debería ubicarse una instalación de otra sede';
  exception
    when check_violation then null;
  end;

  -- La rotación va de 0 a 360 y la posición, a no más de 5 km del origen.
  begin
    update public.elemento_predio set rotacion = 360 where instalacion_id = v_cancha;
    raise exception 'Una rotación de 360° no debería guardarse';
  exception
    when check_violation then null;
  end;
  begin
    update public.elemento_predio set este = 6000 where instalacion_id = v_cancha;
    raise exception 'Una instalación a 6 km del origen no debería guardarse';
  exception
    when check_violation then null;
  end;
end;
$$;
select pg_temp.salir();

-- La leyenda (#45): descripción y orden se guardan con el predio.
select pg_temp.entrar('super');
do $$
declare
  v_sede uuid := (select id from _t where clave = 'sede_a');
  v_cancha uuid := (select id from _t where clave = 'inst_cancha');
  v_pileta uuid := (select id from _t where clave = 'inst_pileta');
  v_area jsonb := '[[0, 0], [200, 0], [200, 150], [0, 150]]'::jsonb;
  v_cancha_medidas jsonb := '{"largo": 100, "ancho": 68, "ingoal": 10}'::jsonb;
  v_pileta_medidas jsonb := '{"largo": 25, "ancho": 12}'::jsonb;
  v_orden int;
  v_en boolean;
  v_descripcion text;
begin
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, v_area,
    jsonb_build_array(
      jsonb_build_object('instalacion_id', v_cancha, 'este', 80.5, 'norte', 50, 'rotacion', 47.5,
        'medidas', v_cancha_medidas, 'descripcion', 'La cancha principal.', 'orden_leyenda', 1),
      jsonb_build_object('instalacion_id', v_pileta, 'este', 20, 'norte', 120, 'rotacion', 90,
        'medidas', v_pileta_medidas, 'descripcion', null, 'orden_leyenda', 2)
    ),
      '[]'::jsonb
  );
  select descripcion, orden_leyenda, en_leyenda into v_descripcion, v_orden, v_en
  from public.elemento_predio where instalacion_id = v_cancha;
  if v_descripcion is distinct from 'La cancha principal.' or v_orden <> 1 or not v_en then
    raise exception 'La cancha debería ser la 1 de la leyenda, con su descripción';
  end if;

  -- Reordenar intercambia los lugares en un solo guardado.
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, v_area,
    jsonb_build_array(
      jsonb_build_object('instalacion_id', v_cancha, 'este', 80.5, 'norte', 50, 'rotacion', 47.5,
        'medidas', v_cancha_medidas, 'descripcion', 'La cancha principal.', 'orden_leyenda', 2),
      jsonb_build_object('instalacion_id', v_pileta, 'este', 20, 'norte', 120, 'rotacion', 90,
        'medidas', v_pileta_medidas, 'descripcion', null, 'orden_leyenda', 1)
    ),
      '[]'::jsonb
  );
  select orden_leyenda into v_orden from public.elemento_predio where instalacion_id = v_pileta;
  if v_orden <> 1 then
    raise exception 'La pileta debería haber pasado al lugar 1 de la leyenda, está en %', v_orden;
  end if;

  -- Sacar de la leyenda: sin orden, en_leyenda es falso.
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, v_area,
    jsonb_build_array(
      jsonb_build_object('instalacion_id', v_cancha, 'este', 80.5, 'norte', 50, 'rotacion', 47.5,
        'medidas', v_cancha_medidas, 'descripcion', 'La cancha principal.', 'orden_leyenda', 1),
      jsonb_build_object('instalacion_id', v_pileta, 'este', 20, 'norte', 120, 'rotacion', 90,
        'medidas', v_pileta_medidas, 'descripcion', null, 'orden_leyenda', null)
    ),
      '[]'::jsonb
  );
  select en_leyenda into v_en from public.elemento_predio where instalacion_id = v_pileta;
  if v_en then
    raise exception 'La pileta debería haber salido de la leyenda';
  end if;

  -- La descripción tiene un tope de 280 caracteres.
  begin
    update public.elemento_predio set descripcion = repeat('a', 281) where instalacion_id = v_cancha;
    raise exception 'Una descripción de 281 caracteres no debería guardarse';
  exception
    when check_violation then null;
  end;

  -- El orden va de 1 en adelante.
  begin
    update public.elemento_predio set orden_leyenda = 0 where instalacion_id = v_cancha;
    raise exception 'El lugar 0 en la leyenda no debería guardarse';
  exception
    when check_violation then null;
  end;

  -- en_leyenda sale del orden: no se escribe a mano.
  begin
    update public.elemento_predio set en_leyenda = false where instalacion_id = v_cancha;
    raise exception 'en_leyenda no debería poder escribirse';
  exception
    when generated_always then null;
  end;
end;
$$;
select pg_temp.salir();

-- Dos elementos del mismo predio no comparten lugar en la leyenda (se
-- controla al terminar la transacción, así que se prueba con set constraints).
select pg_temp.entrar('super');
do $$
begin
  set constraints elemento_predio_orden_leyenda_key immediate;
  begin
    update public.elemento_predio set orden_leyenda = 1
    where instalacion_id = (select id from _t where clave = 'inst_pileta');
    raise exception 'Dos elementos no deberían compartir el lugar 1 de la leyenda';
  exception
    when unique_violation then null;
  end;
  set constraints elemento_predio_orden_leyenda_key deferred;
end;
$$;
select pg_temp.salir();

-- Elementos de referencia (#46): se guardan con el predio, con nombre opcional,
-- y comparten la leyenda con las instalaciones.
select pg_temp.entrar('super');
do $$
declare
  v_sede uuid := (select id from _t where clave = 'sede_a');
  v_predio uuid := (select id from _t where clave = 'predio_a');
  v_cancha uuid := (select id from _t where clave = 'inst_cancha');
  v_area jsonb := '[[0, 0], [200, 0], [200, 150], [0, 150]]'::jsonb;
  v_instalaciones jsonb;
  v_ombu uuid := gen_random_uuid();
  v_gradas uuid := gen_random_uuid();
  v_id_cancha uuid;
  v_n int;
  v_nombre text;
  v_orden int;
  v_este double precision;
begin
  v_instalaciones := jsonb_build_array(
    jsonb_build_object('instalacion_id', v_cancha, 'este', 80.5, 'norte', 50, 'rotacion', 47.5,
      'medidas', '{"largo": 100, "ancho": 68, "ingoal": 10}'::jsonb,
      'descripcion', 'La cancha principal.', 'orden_leyenda', 1)
  );
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, v_area, v_instalaciones,
    jsonb_build_array(
      jsonb_build_object('id', v_ombu, 'tipo', 'arbol', 'nombre', 'El ombú',
        'este', 10, 'norte', 20, 'rotacion', 0, 'medidas', '{"alto": 12, "copa": 14}'::jsonb,
        'descripcion', 'Al lado de la cancha principal.', 'orden_leyenda', 2),
      jsonb_build_object('id', v_gradas, 'tipo', 'gradas', 'nombre', null,
        'este', 30, 'norte', 20, 'rotacion', 90, 'medidas', '{"largo": 20, "ancho": 4, "alto": 2}'::jsonb,
        'descripcion', null, 'orden_leyenda', null)
    )
  );
  select count(*) into v_n from public.elemento_predio
  where predio_id = v_predio and tipo_referencia is not null;
  if v_n <> 2 then
    raise exception 'Deberían quedar 2 elementos de referencia, hay %', v_n;
  end if;
  select nombre, orden_leyenda into v_nombre, v_orden from public.elemento_predio where id = v_ombu;
  if v_nombre is distinct from 'El ombú' or v_orden is distinct from 2 then
    raise exception 'El ombú debería tener su nombre y ser el 2 de la leyenda';
  end if;

  -- Mover el ombú y borrar las gradas, en un solo guardado.
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, v_area, v_instalaciones,
    jsonb_build_array(
      jsonb_build_object('id', v_ombu, 'tipo', 'arbol', 'nombre', 'El ombú',
        'este', 15, 'norte', 20, 'rotacion', 0, 'medidas', '{"alto": 12, "copa": 14}'::jsonb,
        'descripcion', null, 'orden_leyenda', 2)
    )
  );
  select este into v_este from public.elemento_predio where id = v_ombu;
  if v_este is distinct from 15::double precision then
    raise exception 'El ombú debería estar en 15 m al este, está en %', v_este;
  end if;
  if exists (select 1 from public.elemento_predio where id = v_gradas) then
    raise exception 'Las gradas deberían haberse borrado';
  end if;

  -- Un id que es de una instalación no se pisa con un elemento de referencia.
  select id into v_id_cancha from public.elemento_predio where instalacion_id = v_cancha;
  perform public.guardar_predio(
    v_sede, -37.336, -59.08, v_area, v_instalaciones,
    jsonb_build_array(
      jsonb_build_object('id', v_ombu, 'tipo', 'arbol', 'nombre', 'El ombú',
        'este', 15, 'norte', 20, 'rotacion', 0, 'medidas', '{"alto": 12, "copa": 14}'::jsonb,
        'descripcion', null, 'orden_leyenda', 2),
      jsonb_build_object('id', v_id_cancha, 'tipo', 'piedra', 'nombre', 'Trampa',
        'este', 0, 'norte', 0, 'rotacion', 0, 'medidas', '{"diametro": 1, "alto": 1}'::jsonb,
        'descripcion', null, 'orden_leyenda', null)
    )
  );
  if not exists (
    select 1 from public.elemento_predio
    where id = v_id_cancha and instalacion_id = v_cancha and tipo_referencia is null
  ) then
    raise exception 'La cancha no debería haberse convertido en elemento de referencia';
  end if;

  -- Solo tipos en código: un camino no es (todavía) un elemento puntual.
  begin
    insert into public.elemento_predio (predio_id, tipo_referencia, este, norte, medidas)
    values (v_predio, 'camino', 0, 0, '{"ancho": 4}');
    raise exception 'Un tipo de elemento de referencia desconocido no debería guardarse';
  exception
    when check_violation then null;
  end;

  -- Cada elemento es una instalación o un elemento de referencia.
  begin
    insert into public.elemento_predio (predio_id, este, norte, medidas)
    values (v_predio, 0, 0, '{}');
    raise exception 'Un elemento sin instalación ni tipo no debería guardarse';
  exception
    when check_violation then null;
  end;
  begin
    update public.elemento_predio set tipo_referencia = 'arbol' where instalacion_id = v_cancha;
    raise exception 'Un elemento no debería ser instalación y elemento de referencia a la vez';
  exception
    when check_violation then null;
  end;

  -- El nombre es solo de los elementos de referencia, de hasta 60 caracteres.
  begin
    update public.elemento_predio set nombre = 'Cancha' where instalacion_id = v_cancha;
    raise exception 'Una instalación no debería llevar nombre en el predio';
  exception
    when check_violation then null;
  end;
  begin
    update public.elemento_predio set nombre = repeat('a', 61) where id = v_ombu;
    raise exception 'Un nombre de 61 caracteres no debería guardarse';
  exception
    when check_violation then null;
  end;
end;
$$;
select pg_temp.salir();

-- Admin A ve el ombú, pero no lo cambia ni lo borra.
select pg_temp.entrar('admin_a');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.elemento_predio
  where tipo_referencia = 'arbol' and nombre = 'El ombú';
  if v_n <> 1 then
    raise exception 'Admin A debería ver el ombú, ve %', v_n;
  end if;

  update public.elemento_predio set nombre = 'Otro' where tipo_referencia = 'arbol';
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder cambiar un elemento de referencia';
  end if;

  delete from public.elemento_predio where tipo_referencia = 'arbol';
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder borrar un elemento de referencia';
  end if;
end;
$$;
select pg_temp.salir();

-- Admin A ve las instalaciones ubicadas, pero no las mueve ni las quita.
select pg_temp.entrar('admin_a');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.elemento_predio
  where instalacion_id = (select id from _t where clave = 'inst_cancha');
  if v_n <> 1 then
    raise exception 'Admin A debería ver la cancha ubicada, ve %', v_n;
  end if;

  select count(*) into v_n from public.elemento_predio
  where instalacion_id = (select id from _t where clave = 'inst_cancha')
    and descripcion = 'La cancha principal.' and orden_leyenda = 1;
  if v_n <> 1 then
    raise exception 'Admin A debería ver la descripción y el lugar en la leyenda de la cancha';
  end if;

  update public.elemento_predio set descripcion = 'Otra cosa.'
  where instalacion_id = (select id from _t where clave = 'inst_cancha');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder cambiar la descripción';
  end if;

  update public.elemento_predio set este = 0
  where instalacion_id = (select id from _t where clave = 'inst_cancha');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder mover una instalación del predio';
  end if;

  delete from public.elemento_predio
  where instalacion_id = (select id from _t where clave = 'inst_cancha');
  get diagnostics v_n = row_count;
  if v_n <> 0 then
    raise exception 'Admin A no debería poder quitar una instalación del predio';
  end if;
end;
$$;
select pg_temp.salir();

-- Admin B no ve las instalaciones ubicadas del club A.
select pg_temp.entrar('admin_b');
do $$
declare
  v_n int;
begin
  select count(*) into v_n from public.elemento_predio
  where instalacion_id = (select id from _t where clave = 'inst_cancha');
  if v_n <> 0 then
    raise exception 'Admin B no debería ver el predio del club A';
  end if;
end;
$$;
select pg_temp.salir();

-- Borrar la instalación la saca del predio.
select pg_temp.entrar('super');
do $$
begin
  delete from public.instalacion where id = (select id from _t where clave = 'inst_cancha');
  if exists (
    select 1 from public.elemento_predio
    where instalacion_id = (select id from _t where clave = 'inst_cancha')
  ) then
    raise exception 'Borrar la instalación debería sacarla del predio';
  end if;
end;
$$;
select pg_temp.salir();

select 'Pruebas de RLS: ok' as resultado;

rollback;
