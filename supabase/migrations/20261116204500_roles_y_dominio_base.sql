-- Roles, permisos e invitaciones, y dominio base del club.
-- Idempotente. Se aplica solo en el proyecto de desarrollo, con OK explícito
-- para producción.
--
-- El dominio raíz del club (ej. loscardosrc.com.ar) es el SITIO WEB del club,
-- no la app. La app vive en subdominios por superficie:
--   admin.<dominio_base>  → administrador
--   vivo.<dominio_base>   → partidos en vivo / tablero
-- Se guarda club.dominio_base (nullable, único), no cada host.
-- Las superficies conocidas viven en código (admin, vivo; extensible).
-- Sin dominio propio, el fallback es /c/<slug>/<superficie>.
--
-- Las funciones SECURITY DEFINER viven en el esquema interno, que no está
-- expuesto por la API (config.toml solo publica public).

create schema if not exists interno;

revoke all on schema interno from public, anon;
grant usage on schema interno to postgres, service_role, authenticated;

comment on schema interno is
  'Funciones internas (SECURITY DEFINER) para permisos. No expuesto por la API.';

-- ---------------------------------------------------------------------------
-- club.dominio_base
-- ---------------------------------------------------------------------------

alter table public.club
  add column if not exists dominio_base text;

comment on column public.club.dominio_base is
  'Dominio base del club, sin esquema ni www (ej. loscardosrc.com.ar). El sitio web vive en ese dominio; la app usa <superficie>.<dominio_base>. Nullable hasta que el club tenga dominio propio.';

create unique index if not exists club_dominio_base_key
  on public.club (dominio_base)
  where dominio_base is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'club_dominio_base_formato'
      and conrelid = 'public.club'::regclass
  ) then
    alter table public.club
      add constraint club_dominio_base_formato
      check (
        dominio_base is null
        or (
          dominio_base = lower(dominio_base)
          and dominio_base !~ '^www\.'
          and dominio_base ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
        )
      );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Enum de rol por club (extensible; hoy solo admin)
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.rol_club as enum ('admin');
exception
  when duplicate_object then null;
end
$$;

comment on type public.rol_club is
  'Rol de una persona en un club. Hoy solo admin; se pueden sumar valores después.';

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  creado_en timestamptz not null default now(),
  constraint usuario_email_key unique (email),
  constraint usuario_email_minuscula check (email = lower(email))
);

comment on table public.usuario is
  'Perfil de una persona que entra a la app. El id coincide con auth.users.';

comment on column public.usuario.nombre is
  'Nombre visible, tomado del perfil de Google en el primer ingreso.';

comment on column public.usuario.email is
  'Email en minúsculas, único. Se usa para vincular invitaciones.';

comment on column public.usuario.creado_en is
  'Momento de alta del perfil.';

create table if not exists public.super_admin (
  usuario_id uuid primary key references public.usuario (id) on delete cascade,
  creado_en timestamptz not null default now()
);

comment on table public.super_admin is
  'Quién es Super Admin. El alta inicial se hace directo en la base, no en el repo.';

create table if not exists public.super_admin_invitacion (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  creado_en timestamptz not null default now(),
  constraint super_admin_invitacion_email_key unique (email),
  constraint super_admin_invitacion_email_minuscula check (email = lower(email))
);

comment on table public.super_admin_invitacion is
  'Email invitado a Super Admin. Si el usuario todavía no existe, se vincula en el primer login con Google.';

create table if not exists public.club_miembro (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club (id) on delete cascade,
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  rol public.rol_club not null default 'admin',
  creado_en timestamptz not null default now(),
  constraint club_miembro_club_usuario_key unique (club_id, usuario_id)
);

comment on table public.club_miembro is
  'Membresía de una persona en un club, con su rol. Una persona puede ser Admin de más de un club.';

create index if not exists club_miembro_usuario_id_idx
  on public.club_miembro (usuario_id);

create index if not exists club_miembro_club_id_idx
  on public.club_miembro (club_id);

create table if not exists public.club_invitacion (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club (id) on delete cascade,
  email text not null,
  rol public.rol_club not null default 'admin',
  creado_en timestamptz not null default now(),
  aceptada_en timestamptz,
  constraint club_invitacion_email_minuscula check (email = lower(email))
);

comment on table public.club_invitacion is
  'Invitación a un club por email. Se vincula al usuario en el primer login con Google, o de inmediato si el perfil ya existe.';

create unique index if not exists club_invitacion_pendiente_key
  on public.club_invitacion (club_id, email)
  where aceptada_en is null;

create index if not exists club_invitacion_email_idx
  on public.club_invitacion (email);

-- ---------------------------------------------------------------------------
-- Funciones de permiso (SECURITY DEFINER, search_path fijo)
-- ---------------------------------------------------------------------------

create or replace function interno.es_super_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.super_admin
    where usuario_id = auth.uid()
  );
$$;

comment on function interno.es_super_admin() is
  'True si la persona autenticada es Super Admin. SECURITY DEFINER para usarla en RLS sin recursión.';

create or replace function interno.es_admin_club(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (
      select 1
      from public.super_admin
      where usuario_id = auth.uid()
    )
    or exists (
      select 1
      from public.club_miembro
      where club_id = p_club_id
        and usuario_id = auth.uid()
        and rol = 'admin'
    );
$$;

comment on function interno.es_admin_club(uuid) is
  'True si la persona autenticada es Super Admin o Admin de ese club. SECURITY DEFINER para usarla en RLS sin recursión.';

create or replace function interno.puede_ver_usuario(p_usuario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p_usuario_id = auth.uid()
    or exists (
      select 1
      from public.super_admin
      where usuario_id = auth.uid()
    )
    or exists (
      select 1
      from public.club_miembro yo
      join public.club_miembro otro on otro.club_id = yo.club_id
      where yo.usuario_id = auth.uid()
        and yo.rol = 'admin'
        and otro.usuario_id = p_usuario_id
    );
$$;

comment on function interno.puede_ver_usuario(uuid) is
  'True si puede ver el perfil: es esa persona, es Super Admin, o comparte un club como Admin.';

revoke all on function interno.es_super_admin() from public, anon;
revoke all on function interno.es_admin_club(uuid) from public, anon;
revoke all on function interno.puede_ver_usuario(uuid) from public, anon;
grant execute on function interno.es_super_admin() to authenticated, service_role;
grant execute on function interno.es_admin_club(uuid) to authenticated, service_role;
grant execute on function interno.puede_ver_usuario(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Sincronizar perfil e invitaciones al entrar con Auth
-- ---------------------------------------------------------------------------

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
  'Crea o actualiza public.usuario y aplica invitaciones pendientes cuando entra un usuario de Auth.';

revoke all on function interno.sincronizar_usuario() from public, anon, authenticated;

drop trigger if exists al_crear_o_actualizar_usuario on auth.users;
create trigger al_crear_o_actualizar_usuario
  after insert or update of email, raw_user_meta_data
  on auth.users
  for each row
  execute function interno.sincronizar_usuario();

-- Si la persona ya tiene perfil, la invitación se acepta al crearla.

create or replace function interno.aceptar_invitacion_club_si_existe()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_usuario_id uuid;
begin
  if new.aceptada_en is not null then
    return new;
  end if;

  select id into v_usuario_id
  from public.usuario
  where email = new.email;

  if v_usuario_id is not null then
    insert into public.club_miembro (club_id, usuario_id, rol)
    values (new.club_id, v_usuario_id, new.rol)
    on conflict (club_id, usuario_id) do nothing;

    new.aceptada_en := now();
  end if;

  return new;
end;
$$;

revoke all on function interno.aceptar_invitacion_club_si_existe() from public, anon, authenticated;

drop trigger if exists al_crear_invitacion_club on public.club_invitacion;
create trigger al_crear_invitacion_club
  before insert on public.club_invitacion
  for each row
  execute function interno.aceptar_invitacion_club_si_existe();

create or replace function interno.aceptar_invitacion_super_admin_si_existe()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_usuario_id uuid;
begin
  select id into v_usuario_id
  from public.usuario
  where email = new.email;

  if v_usuario_id is not null then
    insert into public.super_admin (usuario_id)
    values (v_usuario_id)
    on conflict (usuario_id) do nothing;

    -- Ya no hace falta dejar la invitación pendiente.
    return null;
  end if;

  return new;
end;
$$;

revoke all on function interno.aceptar_invitacion_super_admin_si_existe() from public, anon, authenticated;

drop trigger if exists al_crear_invitacion_super_admin on public.super_admin_invitacion;
create trigger al_crear_invitacion_super_admin
  before insert on public.super_admin_invitacion
  for each row
  execute function interno.aceptar_invitacion_super_admin_si_existe();

-- ---------------------------------------------------------------------------
-- RLS
-- Super Admin ve y escribe todo; Admin solo su club; el resto no accede.
-- Las políticas usan las funciones interno.* para no recursionar.
-- ---------------------------------------------------------------------------

alter table public.club enable row level security;
alter table public.usuario enable row level security;
alter table public.super_admin enable row level security;
alter table public.super_admin_invitacion enable row level security;
alter table public.club_miembro enable row level security;
alter table public.club_invitacion enable row level security;

alter table public.club force row level security;
alter table public.usuario force row level security;
alter table public.super_admin force row level security;
alter table public.super_admin_invitacion force row level security;
alter table public.club_miembro force row level security;
alter table public.club_invitacion force row level security;

revoke all on table public.club from public, anon;
revoke all on table public.usuario from public, anon;
revoke all on table public.super_admin from public, anon;
revoke all on table public.super_admin_invitacion from public, anon;
revoke all on table public.club_miembro from public, anon;
revoke all on table public.club_invitacion from public, anon;

grant select, insert, update, delete on table public.club to authenticated;
grant select, update on table public.usuario to authenticated;
grant select, insert, delete on table public.super_admin to authenticated;
grant select, insert, delete on table public.super_admin_invitacion to authenticated;
grant select, insert, delete on table public.club_miembro to authenticated;
grant select, insert, update, delete on table public.club_invitacion to authenticated;

drop policy if exists club_select on public.club;
create policy club_select on public.club
  for select to authenticated
  using (interno.es_admin_club(id));

drop policy if exists club_insert on public.club;
create policy club_insert on public.club
  for insert to authenticated
  with check (interno.es_super_admin());

drop policy if exists club_update on public.club;
create policy club_update on public.club
  for update to authenticated
  using (interno.es_super_admin())
  with check (interno.es_super_admin());

drop policy if exists club_delete on public.club;
create policy club_delete on public.club
  for delete to authenticated
  using (interno.es_super_admin());

drop policy if exists usuario_select on public.usuario;
create policy usuario_select on public.usuario
  for select to authenticated
  using (interno.puede_ver_usuario(id));

drop policy if exists usuario_update on public.usuario;
create policy usuario_update on public.usuario
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists super_admin_select on public.super_admin;
create policy super_admin_select on public.super_admin
  for select to authenticated
  using (usuario_id = auth.uid() or interno.es_super_admin());

drop policy if exists super_admin_insert on public.super_admin;
create policy super_admin_insert on public.super_admin
  for insert to authenticated
  with check (interno.es_super_admin());

drop policy if exists super_admin_delete on public.super_admin;
create policy super_admin_delete on public.super_admin
  for delete to authenticated
  using (interno.es_super_admin());

drop policy if exists super_admin_invitacion_select on public.super_admin_invitacion;
create policy super_admin_invitacion_select on public.super_admin_invitacion
  for select to authenticated
  using (interno.es_super_admin());

drop policy if exists super_admin_invitacion_insert on public.super_admin_invitacion;
create policy super_admin_invitacion_insert on public.super_admin_invitacion
  for insert to authenticated
  with check (interno.es_super_admin());

drop policy if exists super_admin_invitacion_delete on public.super_admin_invitacion;
create policy super_admin_invitacion_delete on public.super_admin_invitacion
  for delete to authenticated
  using (interno.es_super_admin());

drop policy if exists club_miembro_select on public.club_miembro;
create policy club_miembro_select on public.club_miembro
  for select to authenticated
  using (usuario_id = auth.uid() or interno.es_admin_club(club_id));

drop policy if exists club_miembro_insert on public.club_miembro;
create policy club_miembro_insert on public.club_miembro
  for insert to authenticated
  with check (interno.es_admin_club(club_id));

drop policy if exists club_miembro_delete on public.club_miembro;
create policy club_miembro_delete on public.club_miembro
  for delete to authenticated
  using (interno.es_admin_club(club_id));

drop policy if exists club_invitacion_select on public.club_invitacion;
create policy club_invitacion_select on public.club_invitacion
  for select to authenticated
  using (interno.es_admin_club(club_id));

drop policy if exists club_invitacion_insert on public.club_invitacion;
create policy club_invitacion_insert on public.club_invitacion
  for insert to authenticated
  with check (interno.es_admin_club(club_id));

drop policy if exists club_invitacion_update on public.club_invitacion;
create policy club_invitacion_update on public.club_invitacion
  for update to authenticated
  using (interno.es_admin_club(club_id))
  with check (interno.es_admin_club(club_id));

drop policy if exists club_invitacion_delete on public.club_invitacion;
create policy club_invitacion_delete on public.club_invitacion
  for delete to authenticated
  using (interno.es_admin_club(club_id));
