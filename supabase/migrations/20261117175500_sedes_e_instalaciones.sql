-- Contacto del club, redes sociales, sedes e instalaciones.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.

-- ---------------------------------------------------------------------------
-- Columnas de contacto en club (todas opcionales).
-- ---------------------------------------------------------------------------

alter table public.club add column if not exists telefono text;
alter table public.club add column if not exists email text;
alter table public.club add column if not exists direccion text;
alter table public.club add column if not exists web text;

comment on column public.club.telefono is
  'Teléfono de contacto del club (opcional).';
comment on column public.club.email is
  'Email de contacto del club (opcional). No es el email de un usuario.';
comment on column public.club.direccion is
  'Dirección de contacto del club (opcional).';
comment on column public.club.web is
  'Sitio web público del club (opcional).';

-- ---------------------------------------------------------------------------
-- Redes sociales del club.
-- ---------------------------------------------------------------------------

create table if not exists public.club_red_social (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club (id) on delete cascade,
  red text not null,
  etiqueta text,
  valor text not null,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  constraint club_red_social_red_check
    check (red in (
      'instagram',
      'facebook',
      'x',
      'youtube',
      'tiktok',
      'whatsapp',
      'linkedin',
      'otra'
    )),
  constraint club_red_social_valor_check
    check (length(trim(valor)) > 0),
  constraint club_red_social_orden_check
    check (orden >= 0),
  constraint club_red_social_etiqueta_otra_check
    check (
      red <> 'otra'
      or (etiqueta is not null and length(trim(etiqueta)) > 0)
    )
);

comment on table public.club_red_social is
  'Redes sociales del club. red es una de la lista o «otra» (con etiqueta). valor es la URL, el usuario o el número. orden define la lista.';

create index if not exists club_red_social_club_id_orden_idx
  on public.club_red_social (club_id, orden);

-- ---------------------------------------------------------------------------
-- Sedes.
-- ---------------------------------------------------------------------------

create table if not exists public.sede (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club (id) on delete cascade,
  nombre text not null,
  direccion text,
  maps_url text,
  creado_en timestamptz not null default now(),
  constraint sede_nombre_check check (length(trim(nombre)) > 0)
);

comment on table public.sede is
  'Sede de un club. maps_url es el link de Google Maps; las coordenadas se parsean en la app, sin clave de API.';

create index if not exists sede_club_id_idx on public.sede (club_id);

-- ---------------------------------------------------------------------------
-- Tipos de instalación: club_id null = tipos de base (compartidos).
-- ---------------------------------------------------------------------------

create table if not exists public.tipo_instalacion (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.club (id) on delete cascade,
  nombre text not null,
  creado_en timestamptz not null default now(),
  constraint tipo_instalacion_nombre_check check (length(trim(nombre)) > 0)
);

comment on table public.tipo_instalacion is
  'Tipo de instalación. club_id null son los tipos de base, compartidos por todos los clubes. Un club_id indica un tipo propio de ese club.';

create unique index if not exists tipo_instalacion_base_nombre_uidx
  on public.tipo_instalacion (lower(nombre))
  where club_id is null;

create unique index if not exists tipo_instalacion_club_nombre_uidx
  on public.tipo_instalacion (club_id, lower(nombre))
  where club_id is not null;

create index if not exists tipo_instalacion_club_id_idx
  on public.tipo_instalacion (club_id);

insert into public.tipo_instalacion (club_id, nombre)
select null, v.nombre
from (
  values
    ('Cancha de rugby'),
    ('Cancha de hockey'),
    ('Cancha de tenis'),
    ('Cancha de fútbol'),
    ('House'),
    ('Pileta'),
    ('Gym'),
    ('Vestuario'),
    ('Quincho'),
    ('Salón'),
    ('Otra')
) as v(nombre)
where not exists (
  select 1
  from public.tipo_instalacion t
  where t.club_id is null
    and lower(t.nombre) = lower(v.nombre)
);

-- ---------------------------------------------------------------------------
-- Instalaciones de una sede.
-- ---------------------------------------------------------------------------

create table if not exists public.instalacion (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sede (id) on delete cascade,
  tipo_instalacion_id uuid not null references public.tipo_instalacion (id),
  nombre text not null,
  notas text,
  creado_en timestamptz not null default now(),
  constraint instalacion_nombre_check check (length(trim(nombre)) > 0)
);

comment on table public.instalacion is
  'Instalación de una sede: un tipo (de base o propio del club), un nombre (por ejemplo «Cancha 1») y notas opcionales.';

create index if not exists instalacion_sede_id_idx on public.instalacion (sede_id);
create index if not exists instalacion_tipo_id_idx
  on public.instalacion (tipo_instalacion_id);

-- El tipo tiene que ser de base o del mismo club que la sede.
create or replace function interno.validar_tipo_de_instalacion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_club_sede uuid;
  v_club_tipo uuid;
  v_existe boolean;
begin
  select club_id into v_club_sede from public.sede where id = new.sede_id;
  if v_club_sede is null then
    raise exception 'La sede no existe.'
      using errcode = 'P0001';
  end if;

  select club_id into v_club_tipo
  from public.tipo_instalacion
  where id = new.tipo_instalacion_id;
  v_existe := found;
  if not v_existe then
    raise exception 'El tipo de instalación no existe.'
      using errcode = 'P0001';
  end if;

  if v_club_tipo is not null and v_club_tipo is distinct from v_club_sede then
    raise exception 'El tipo de instalación no pertenece a este club.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function interno.validar_tipo_de_instalacion() is
  'Impide asignar a una instalación un tipo de otro club. Los tipos de base (club_id null) se pueden usar en cualquier sede.';

revoke all on function interno.validar_tipo_de_instalacion()
  from public, anon, authenticated;

drop trigger if exists validar_tipo_de_instalacion on public.instalacion;
create trigger validar_tipo_de_instalacion
  before insert or update of sede_id, tipo_instalacion_id
  on public.instalacion
  for each row
  execute function interno.validar_tipo_de_instalacion();

-- ---------------------------------------------------------------------------
-- Helper: club de una sede (para políticas de instalación).
-- ---------------------------------------------------------------------------

create or replace function interno.club_id_de_sede(p_sede_id uuid)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select club_id from public.sede where id = p_sede_id
$$;

comment on function interno.club_id_de_sede(uuid) is
  'Devuelve el club_id de una sede. Se usa en las políticas de instalación.';

revoke all on function interno.club_id_de_sede(uuid) from public, anon;
grant execute on function interno.club_id_de_sede(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Grants y RLS.
-- ---------------------------------------------------------------------------

revoke all on table public.club_red_social from public, anon;
revoke all on table public.sede from public, anon;
revoke all on table public.tipo_instalacion from public, anon;
revoke all on table public.instalacion from public, anon;

grant select, insert, update, delete on table public.club_red_social
  to authenticated, service_role;
grant select, insert, update, delete on table public.sede
  to authenticated, service_role;
grant select, insert, update, delete on table public.tipo_instalacion
  to authenticated, service_role;
grant select, insert, update, delete on table public.instalacion
  to authenticated, service_role;

alter table public.club_red_social enable row level security;
alter table public.sede enable row level security;
alter table public.tipo_instalacion enable row level security;
alter table public.instalacion enable row level security;

alter table public.club_red_social force row level security;
alter table public.sede force row level security;
alter table public.tipo_instalacion force row level security;
alter table public.instalacion force row level security;

-- club_red_social: Admin de su club, Super Admin de todos.
drop policy if exists club_red_social_select on public.club_red_social;
create policy club_red_social_select on public.club_red_social
  for select
  to authenticated
  using (interno.es_admin_club(club_id));

drop policy if exists club_red_social_insert on public.club_red_social;
create policy club_red_social_insert on public.club_red_social
  for insert
  to authenticated
  with check (interno.es_admin_club(club_id));

drop policy if exists club_red_social_update on public.club_red_social;
create policy club_red_social_update on public.club_red_social
  for update
  to authenticated
  using (interno.es_admin_club(club_id))
  with check (interno.es_admin_club(club_id));

drop policy if exists club_red_social_delete on public.club_red_social;
create policy club_red_social_delete on public.club_red_social
  for delete
  to authenticated
  using (interno.es_admin_club(club_id));

-- sede: igual.
drop policy if exists sede_select on public.sede;
create policy sede_select on public.sede
  for select
  to authenticated
  using (interno.es_admin_club(club_id));

drop policy if exists sede_insert on public.sede;
create policy sede_insert on public.sede
  for insert
  to authenticated
  with check (interno.es_admin_club(club_id));

drop policy if exists sede_update on public.sede;
create policy sede_update on public.sede
  for update
  to authenticated
  using (interno.es_admin_club(club_id))
  with check (interno.es_admin_club(club_id));

drop policy if exists sede_delete on public.sede;
create policy sede_delete on public.sede
  for delete
  to authenticated
  using (interno.es_admin_club(club_id));

-- tipo_instalacion:
--   SELECT: tipos de base para cualquier autenticado; tipos propios solo
--   para el Admin de ese club (el Super Admin entra por es_admin_club).
--   INSERT/UPDATE/DELETE de tipos de base: solo Super Admin.
--   Tipos propios: Admin de su club (no puede pasarlos a base ni a otro club).
drop policy if exists tipo_instalacion_select on public.tipo_instalacion;
create policy tipo_instalacion_select on public.tipo_instalacion
  for select
  to authenticated
  using (club_id is null or interno.es_admin_club(club_id));

drop policy if exists tipo_instalacion_insert on public.tipo_instalacion;
create policy tipo_instalacion_insert on public.tipo_instalacion
  for insert
  to authenticated
  with check (
    case
      when club_id is null then interno.es_super_admin()
      else interno.es_admin_club(club_id)
    end
  );

drop policy if exists tipo_instalacion_update on public.tipo_instalacion;
create policy tipo_instalacion_update on public.tipo_instalacion
  for update
  to authenticated
  using (
    case
      when club_id is null then interno.es_super_admin()
      else interno.es_admin_club(club_id)
    end
  )
  with check (
    case
      when club_id is null then interno.es_super_admin()
      else interno.es_admin_club(club_id)
    end
  );

drop policy if exists tipo_instalacion_delete on public.tipo_instalacion;
create policy tipo_instalacion_delete on public.tipo_instalacion
  for delete
  to authenticated
  using (
    case
      when club_id is null then interno.es_super_admin()
      else interno.es_admin_club(club_id)
    end
  );

-- instalacion: a través de la sede.
drop policy if exists instalacion_select on public.instalacion;
create policy instalacion_select on public.instalacion
  for select
  to authenticated
  using (interno.es_admin_club(interno.club_id_de_sede(sede_id)));

drop policy if exists instalacion_insert on public.instalacion;
create policy instalacion_insert on public.instalacion
  for insert
  to authenticated
  with check (interno.es_admin_club(interno.club_id_de_sede(sede_id)));

drop policy if exists instalacion_update on public.instalacion;
create policy instalacion_update on public.instalacion
  for update
  to authenticated
  using (interno.es_admin_club(interno.club_id_de_sede(sede_id)))
  with check (interno.es_admin_club(interno.club_id_de_sede(sede_id)));

drop policy if exists instalacion_delete on public.instalacion;
create policy instalacion_delete on public.instalacion
  for delete
  to authenticated
  using (interno.es_admin_club(interno.club_id_de_sede(sede_id)));
