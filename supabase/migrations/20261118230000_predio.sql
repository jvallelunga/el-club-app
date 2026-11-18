-- Predio de una sede (#42): el origen y el área del predio.
--
-- Una fila por sede. El origen es un punto (lat/lng) propio del predio; el
-- área es un polígono guardado como lista de puntos [este, norte] en metros
-- desde el origen, así el predio no depende del proveedor del mapa.
-- Escribe solo el Super Admin; leen el Super Admin y los Admins del club.
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

create table if not exists public.predio (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null unique references public.sede (id) on delete cascade,
  origen_lat double precision not null,
  origen_lng double precision not null,
  area jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint predio_origen_lat_check check (origen_lat between -90 and 90),
  constraint predio_origen_lng_check check (origen_lng between -180 and 180)
);

-- El área: vacía (todavía sin dibujar) o entre 3 y 500 puntos [este, norte].
alter table public.predio drop constraint if exists predio_area_check;
alter table public.predio add constraint predio_area_check check (
  jsonb_typeof(area) = 'array'
  and (jsonb_array_length(area) = 0 or jsonb_array_length(area) between 3 and 500)
  and not jsonb_path_exists(area, 'strict $[*] ? (@.type() != "array" || @.size() != 2)')
  and not jsonb_path_exists(area, 'strict $[*][*] ? (@.type() != "number")')
);

comment on table public.predio is
  'Predio de una sede (a lo sumo uno). origen_lat/origen_lng es el origen del predio; area es el polígono del área del predio como lista de puntos [este, norte] en metros desde el origen.';
comment on column public.predio.area is
  'Área del predio: lista de puntos [este, norte] en metros desde el origen. Vacía mientras no se dibuja.';

-- ---------------------------------------------------------------------------
-- Grants y RLS.
-- ---------------------------------------------------------------------------

revoke all on table public.predio from public, anon;
grant select, insert, update, delete on table public.predio
  to authenticated, service_role;

alter table public.predio enable row level security;
alter table public.predio force row level security;

-- Leen los Admins del club de la sede (y el Super Admin, por es_admin_club).
drop policy if exists predio_select on public.predio;
create policy predio_select on public.predio
  for select
  to authenticated
  using (interno.es_admin_club(interno.club_id_de_sede(sede_id)));

-- Escribe solo el Super Admin.
drop policy if exists predio_insert on public.predio;
create policy predio_insert on public.predio
  for insert
  to authenticated
  with check (interno.es_super_admin());

drop policy if exists predio_update on public.predio;
create policy predio_update on public.predio
  for update
  to authenticated
  using (interno.es_super_admin())
  with check (interno.es_super_admin());

drop policy if exists predio_delete on public.predio;
create policy predio_delete on public.predio
  for delete
  to authenticated
  using (interno.es_super_admin());
