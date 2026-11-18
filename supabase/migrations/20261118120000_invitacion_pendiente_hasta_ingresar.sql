-- Las invitaciones quedan pendientes hasta que la persona entra.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- Mandar el magic link (al invitar o con «Reenviar link») hace que Auth cree
-- el usuario en auth.users antes de que la persona abra el link, y según la
-- configuración de Auth hasta lo deja confirmado y con last_sign_in_at. El
-- trigger sobre auth.users creaba el perfil y aceptaba las invitaciones en ese
-- alta, así que la persona figuraba como Admin sin haber entrado nunca.
--
-- Ahora:
-- - El trigger sobre auth.users solo mantiene al día nombre y email de un
--   perfil que ya existe. No crea perfiles ni acepta invitaciones.
-- - public.aplicar_invitaciones_al_entrar() crea el perfil y aplica las
--   invitaciones de quien tiene la sesión. La app la llama en /auth/callback,
--   después de validar el link o el ingreso con Google.

create or replace function interno.sincronizar_usuario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, interno
as $$
declare
  v_nombre text;
  v_email text;
begin
  v_email := lower(new.email);
  if v_email is null or v_email = '' then
    return new;
  end if;

  v_nombre := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(v_email, '@', 1)
      )
    ),
    ''
  );
  if v_nombre is null then
    v_nombre := split_part(v_email, '@', 1);
  end if;

  update public.usuario
  set
    nombre = v_nombre,
    email = v_email
  where id = new.id;

  return new;
end;
$$;

comment on function interno.sincronizar_usuario() is
  'Mantiene nombre y email de un perfil existente. No crea perfiles ni acepta invitaciones: eso pasa al entrar (aplicar_invitaciones_al_entrar).';

revoke all on function interno.sincronizar_usuario() from public, anon, authenticated;

drop trigger if exists al_crear_o_actualizar_usuario on auth.users;
create trigger al_crear_o_actualizar_usuario
  after insert or update of email, raw_user_meta_data
  on auth.users
  for each row
  execute function interno.sincronizar_usuario();

create or replace function public.aplicar_invitaciones_al_entrar()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, interno
as $$
declare
  v_id uuid;
  v_email text;
  v_nombre text;
  v_ya_existe boolean;
  v_invitado boolean;
begin
  v_id := auth.uid();
  if v_id is null then
    return;
  end if;

  select
    lower(u.email),
    nullif(
      trim(
        coalesce(
          u.raw_user_meta_data->>'full_name',
          u.raw_user_meta_data->>'name',
          split_part(lower(u.email), '@', 1)
        )
      ),
      ''
    )
  into v_email, v_nombre
  from auth.users u
  where u.id = v_id;

  if v_email is null or v_email = '' then
    return;
  end if;
  if v_nombre is null then
    v_nombre := split_part(v_email, '@', 1);
  end if;

  select exists(select 1 from public.usuario where id = v_id)
    into v_ya_existe;

  select
    exists(select 1 from public.super_admin_invitacion i where i.email = v_email)
    or exists(select 1 from public.club_invitacion i where i.email = v_email)
    into v_invitado;

  -- Sin invitación y sin perfil previo: no se crea nada en la app.
  if not v_ya_existe and not v_invitado then
    return;
  end if;

  insert into public.usuario (id, nombre, email)
  values (v_id, v_nombre, v_email)
  on conflict (id) do update
    set
      nombre = excluded.nombre,
      email = excluded.email;

  insert into public.super_admin (usuario_id)
  select v_id
  from public.super_admin_invitacion i
  where i.email = v_email
  on conflict (usuario_id) do nothing;

  delete from public.super_admin_invitacion
  where email = v_email;

  insert into public.club_miembro (club_id, usuario_id, rol)
  select i.club_id, v_id, i.rol
  from public.club_invitacion i
  where i.email = v_email
    and i.aceptada_en is null
  on conflict (club_id, usuario_id) do nothing;

  update public.club_invitacion
  set aceptada_en = now()
  where email = v_email
    and aceptada_en is null;
end;
$$;

comment on function public.aplicar_invitaciones_al_entrar() is
  'Crea el perfil y aplica las invitaciones pendientes de quien tiene la sesión. Se llama al entrar (/auth/callback).';

revoke all on function public.aplicar_invitaciones_al_entrar() from public, anon;
grant execute on function public.aplicar_invitaciones_al_entrar() to authenticated;
