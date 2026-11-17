-- Paleta y escudo del club, y bucket de Storage para escudos.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- El escudo se guarda en el bucket público "escudos", con la ruta en
-- club.escudo_ruta (p. ej. <id>/escudo.png). La paleta tiene hasta 3
-- colores: color_principal obligatorio; color_2 y color_3 opcionales
-- (null = se derivan en la app). El color claro de fondo queda aparte.

-- ---------------------------------------------------------------------------
-- Columnas en public.club
-- ---------------------------------------------------------------------------

alter table public.club
  add column if not exists escudo_ruta text;

alter table public.club
  add column if not exists color_principal text;

alter table public.club
  add column if not exists color_claro text;

alter table public.club
  add column if not exists color_2 text;

alter table public.club
  add column if not exists color_3 text;

comment on column public.club.escudo_ruta is
  'Ruta del escudo en el bucket público escudos, p. ej. <id>/escudo.png. Nullable si el club todavía no subió imagen; en ese caso se muestran las iniciales.';

comment on column public.club.color_principal is
  'Color 1 de la paleta (HEX #rrggbb). Obligatorio. Se usa en botones, header y acentos.';

comment on column public.club.color_claro is
  'Color de fondo claro (HEX #rrggbb). Default #ffffff. No forma parte de los 3 colores de paleta.';

comment on column public.club.color_2 is
  'Color 2 opcional (HEX #rrggbb). Null = se deriva del principal en la app.';

comment on column public.club.color_3 is
  'Color 3 opcional (HEX #rrggbb). Null = se deriva del principal en la app.';

-- Default genérico para filas previas (no es el color de un club real).
update public.club
  set color_principal = '#1c1917'
  where color_principal is null;

update public.club
  set color_claro = '#ffffff'
  where color_claro is null;

alter table public.club
  alter column color_claro set default '#ffffff';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'club'
      and column_name = 'color_principal'
      and is_nullable = 'YES'
  ) then
    alter table public.club
      alter column color_principal set not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'club'
      and column_name = 'color_claro'
      and is_nullable = 'YES'
  ) then
    alter table public.club
      alter column color_claro set not null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'club_color_principal_hex'
      and conrelid = 'public.club'::regclass
  ) then
    alter table public.club
      add constraint club_color_principal_hex
      check (color_principal ~ '^#[0-9a-f]{6}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'club_color_claro_hex'
      and conrelid = 'public.club'::regclass
  ) then
    alter table public.club
      add constraint club_color_claro_hex
      check (color_claro ~ '^#[0-9a-f]{6}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'club_color_2_hex'
      and conrelid = 'public.club'::regclass
  ) then
    alter table public.club
      add constraint club_color_2_hex
      check (color_2 is null or color_2 ~ '^#[0-9a-f]{6}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'club_color_3_hex'
      and conrelid = 'public.club'::regclass
  ) then
    alter table public.club
      add constraint club_color_3_hex
      check (color_3 is null or color_3 ~ '^#[0-9a-f]{6}$');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Storage: bucket público escudos (solo Super Admin sube, actualiza o borra)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'escudos',
  'escudos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists escudos_select_publico on storage.objects;
create policy escudos_select_publico
  on storage.objects
  for select
  using (bucket_id = 'escudos');

drop policy if exists escudos_insert_super_admin on storage.objects;
create policy escudos_insert_super_admin
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'escudos' and interno.es_super_admin());

drop policy if exists escudos_update_super_admin on storage.objects;
create policy escudos_update_super_admin
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'escudos' and interno.es_super_admin())
  with check (bucket_id = 'escudos' and interno.es_super_admin());

drop policy if exists escudos_delete_super_admin on storage.objects;
create policy escudos_delete_super_admin
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'escudos' and interno.es_super_admin());
