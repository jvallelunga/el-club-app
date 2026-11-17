-- El alta en la app es solo por invitación (Super Admin o Admin de un club).
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- Si alguien entra con Google y no tiene invitación ni un perfil ya creado,
-- no se inserta public.usuario ni se asigna ningún rol. La app lo manda a
-- /sin-acceso. Auth puede crear el usuario de Auth (es el login con Google);
-- en las tablas de la app no se crea nada.

create or replace function interno.sincronizar_usuario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, interno
as $$
declare
  v_nombre text;
  v_email text;
  v_ya_existe boolean;
  v_invitado boolean;
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

  select exists(select 1 from public.usuario where id = new.id)
    into v_ya_existe;

  select
    exists(select 1 from public.super_admin_invitacion i where i.email = v_email)
    or exists(select 1 from public.club_invitacion i where i.email = v_email)
    into v_invitado;

  -- Sin invitación y sin perfil previo: no se crea nada en la app.
  if not v_ya_existe and not v_invitado then
    return new;
  end if;

  insert into public.usuario (id, nombre, email)
  values (new.id, v_nombre, v_email)
  on conflict (id) do update
    set
      nombre = excluded.nombre,
      email = excluded.email;

  insert into public.super_admin (usuario_id)
  select new.id
  from public.super_admin_invitacion i
  where i.email = v_email
  on conflict (usuario_id) do nothing;

  delete from public.super_admin_invitacion
  where email = v_email;

  insert into public.club_miembro (club_id, usuario_id, rol)
  select i.club_id, new.id, i.rol
  from public.club_invitacion i
  where i.email = v_email
    and i.aceptada_en is null
  on conflict (club_id, usuario_id) do nothing;

  update public.club_invitacion
  set aceptada_en = now()
  where email = v_email
    and aceptada_en is null;

  return new;
end;
$$;

comment on function interno.sincronizar_usuario() is
  'Aplica invitaciones pendientes al entrar con Auth. Solo crea public.usuario si hay invitación o el perfil ya existía.';
