-- Pruebas de invitaciones pendientes, borrados en cascada y guardado del contacto.
-- Pensado para ejecutarse en desarrollo, dentro de una transacción que
-- hace rollback. No deja datos atrás.

begin;

create temporary table _t (
  clave text primary key,
  id uuid not null
);

-- Un club con su único Admin.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
  'authenticated', 'inv-admin@ejemplo.test', crypt('no-se-usa', gen_salt('bf')),
  now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin Único"}'::jsonb, now(), now(), '', '', '', ''
);

insert into public.usuario (id, nombre, email)
select id, 'Admin Único', email from auth.users where email = 'inv-admin@ejemplo.test'
on conflict (id) do nothing;
insert into _t select 'admin', id from public.usuario where email = 'inv-admin@ejemplo.test';

insert into public.club (slug, nombre, color_principal, color_claro)
values ('inv-club', 'Club Invitaciones', '#1c1917', '#ffffff');
insert into _t select 'club', id from public.club where slug = 'inv-club';

insert into public.club_miembro (club_id, usuario_id, rol)
values ((select id from _t where clave = 'club'), (select id from _t where clave = 'admin'), 'admin');

-- 1) Mandar el link (Auth crea el usuario sin ingreso) no acepta la invitación.
insert into public.club_invitacion (club_id, email, rol)
values ((select id from _t where clave = 'club'), 'inv-nuevo@ejemplo.test', 'admin');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
  'authenticated', 'inv-nuevo@ejemplo.test', '', now(),
  -- Según la configuración, Auth lo crea ya confirmado y con last_sign_in_at.
  now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb, now(), now(), '', '', '', ''
);

do $$
declare
  v_n integer;
begin
  select count(*) into v_n
  from public.club_miembro m
  join auth.users u on u.id = m.usuario_id
  where u.email = 'inv-nuevo@ejemplo.test';
  if v_n <> 0 then
    raise exception 'Mandar el link no debería hacer Admin a nadie, hay % membresías', v_n;
  end if;

  select count(*) into v_n
  from public.club_invitacion
  where email = 'inv-nuevo@ejemplo.test' and aceptada_en is null;
  if v_n <> 1 then
    raise exception 'La invitación debería seguir pendiente hasta que la persona entre';
  end if;
end;
$$;

-- 2) Cuando la persona entra (la app llama a aplicar_invitaciones_al_entrar
-- con su sesión), la invitación se acepta.
grant select on _t to authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id from auth.users where email = 'inv-nuevo@ejemplo.test'),
    'role', 'authenticated'
  )::text,
  true
);
select set_config('role', 'authenticated', true);
select public.aplicar_invitaciones_al_entrar();
select set_config('role', 'postgres', true);
select set_config('request.jwt.claims', '', true);

do $$
declare
  v_n integer;
begin
  select count(*) into v_n
  from public.club_miembro m
  join auth.users u on u.id = m.usuario_id
  where u.email = 'inv-nuevo@ejemplo.test';
  if v_n <> 1 then
    raise exception 'Al entrar, la invitación debería crear la membresía, hay %', v_n;
  end if;

  select count(*) into v_n
  from public.club_invitacion
  where email = 'inv-nuevo@ejemplo.test' and aceptada_en is not null;
  if v_n <> 1 then
    raise exception 'Al entrar, la invitación debería quedar aceptada';
  end if;
end;
$$;

-- Dejar al club otra vez con un único Admin.
delete from public.club_miembro
where usuario_id = (select id from auth.users where email = 'inv-nuevo@ejemplo.test');

-- 3) Guardar el contacto es todo o nada: si una red es inválida, no se pierden las anteriores.
insert into public.club_red_social (club_id, red, valor, orden)
values ((select id from _t where clave = 'club'), 'instagram', '@inv', 0);

do $$
declare
  v_n integer;
begin
  begin
    perform public.guardar_contacto_club(
      (select id from _t where clave = 'club'),
      '123', null, null, null,
      '[{"red":"no-existe","etiqueta":null,"valor":"x","orden":0}]'::jsonb
    );
    raise exception 'Guardar con una red inválida debería fallar';
  exception
    when check_violation then null;
  end;

  select count(*) into v_n
  from public.club_red_social
  where club_id = (select id from _t where clave = 'club') and red = 'instagram';
  if v_n <> 1 then
    raise exception 'Si falla el guardado, las redes anteriores deberían quedar, hay %', v_n;
  end if;

  perform public.guardar_contacto_club(
    (select id from _t where clave = 'club'),
    '123', 'club@ejemplo.test', null, null,
    '[{"red":"facebook","etiqueta":null,"valor":"club","orden":0}]'::jsonb
  );
  select count(*) into v_n
  from public.club_red_social
  where club_id = (select id from _t where clave = 'club');
  if v_n <> 1 then
    raise exception 'Guardar debería reemplazar las redes, hay %', v_n;
  end if;
  if (select telefono from public.club where id = (select id from _t where clave = 'club')) <> '123' then
    raise exception 'Guardar debería actualizar el teléfono';
  end if;
end;
$$;

-- 4) Se puede borrar un usuario que es el último Admin de un club.
do $$
begin
  delete from auth.users where email = 'inv-admin@ejemplo.test';
exception
  when others then
    raise exception 'Borrar al usuario último Admin debería poder hacerse: %', sqlerrm;
end;
$$;

-- 5) Se puede borrar un club con Admins.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
  'authenticated', 'inv-admin-2@ejemplo.test', crypt('no-se-usa', gen_salt('bf')),
  now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin Dos"}'::jsonb, now(), now(), '', '', '', ''
);
insert into public.usuario (id, nombre, email)
select id, 'Admin Dos', email from auth.users where email = 'inv-admin-2@ejemplo.test'
on conflict (id) do nothing;
insert into public.club_miembro (club_id, usuario_id, rol)
select (select id from _t where clave = 'club'), id, 'admin'
from public.usuario where email = 'inv-admin-2@ejemplo.test';

do $$
begin
  delete from public.club where id = (select id from _t where clave = 'club');
exception
  when others then
    raise exception 'Borrar un club con Admins debería poder hacerse: %', sqlerrm;
end;
$$;

-- 6) Sin sesión (procesos del servidor), quitar al último Admin se puede:
-- la única regla es que un Admin no se quite a sí mismo.
insert into public.club (slug, nombre, color_principal, color_claro)
values ('inv-club-2', 'Club Invitaciones 2', '#1c1917', '#ffffff');
insert into public.club_miembro (club_id, usuario_id, rol)
select c.id, u.id, 'admin'
from public.club c, public.usuario u
where c.slug = 'inv-club-2' and u.email = 'inv-admin-2@ejemplo.test';

delete from public.club_miembro
where club_id = (select id from public.club where slug = 'inv-club-2');

do $$
begin
  if exists (
    select 1 from public.club_miembro
    where club_id = (select id from public.club where slug = 'inv-club-2')
  ) then
    raise exception 'Quitar al último Admin sin sesión debería poder hacerse';
  end if;
end;
$$;

select 'Pruebas de invitaciones y borrados: ok' as resultado;

rollback;
