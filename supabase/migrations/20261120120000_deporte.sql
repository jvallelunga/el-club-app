-- Catálogo de deportes (#73).
--
-- Lo arma el Super Admin; cada club elige sus deportes de él (#75). Un deporte
-- tiene nombre, el ícono (la clave de un set definido en código,
-- src/dominio/deportes.ts) y una descripción opcional. La condición llega en
-- #74.
--
-- Borrar es un soft delete: se completa borrado_en y la fila queda. Un
-- deporte borrado ya no se puede editar, y nadie borra filas de verdad.
-- Escribe solo el Super Admin; leen el Super Admin y los Admins de cualquier
-- club, que eligen de este catálogo.
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

create table if not exists public.deporte (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  icono text not null,
  descripcion text,
  borrado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.deporte drop constraint if exists deporte_nombre_check;
alter table public.deporte add constraint deporte_nombre_check
  check (nombre = btrim(nombre) and char_length(nombre) between 1 and 60);

alter table public.deporte drop constraint if exists deporte_descripcion_check;
alter table public.deporte add constraint deporte_descripcion_check
  check (descripcion is null or char_length(descripcion) between 1 and 280);

-- La lista tiene que coincidir con ICONOS_DEPORTE en código.
alter table public.deporte drop constraint if exists deporte_icono_check;
alter table public.deporte
  add constraint deporte_icono_check check (
    icono in (
      'rugby',
      'hockey',
      'futbol',
      'voley',
      'natacion',
      'atletismo',
      'running',
      'ciclismo',
      'remo',
      'vela',
      'montania',
      'gimnasio',
      'tiro',
      'esgrima',
      'boxeo',
      'trofeo'
    )
  );

-- Dos deportes del catálogo no comparten nombre. Un borrado no cuenta: su
-- nombre se puede volver a usar.
create unique index if not exists deporte_nombre_activo_key
  on public.deporte (lower(nombre))
  where borrado_en is null;

comment on table public.deporte is
  'Catálogo de deportes del Super Admin. icono es la clave de un set en código (src/dominio/deportes.ts). borrado_en marca el soft delete: un deporte borrado no se edita ni se elige.';
comment on column public.deporte.borrado_en is
  'Cuándo lo borró el Super Admin (soft delete), o null si está en el catálogo.';

-- ---------------------------------------------------------------------------
-- Permiso: Admin de algún club.
-- ---------------------------------------------------------------------------

create or replace function interno.es_admin_de_algun_club()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.club_miembro
    where usuario_id = auth.uid()
      and rol = 'admin'
  );
$$;

comment on function interno.es_admin_de_algun_club() is
  'True si la persona autenticada es Admin de al menos un club. SECURITY DEFINER para usarla en RLS sin recursión.';

revoke all on function interno.es_admin_de_algun_club() from public, anon;
grant execute on function interno.es_admin_de_algun_club() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Grants y RLS.
-- ---------------------------------------------------------------------------

-- Sin delete: borrar es completar borrado_en.
revoke all on table public.deporte from public, anon, authenticated;
grant select, insert, update on table public.deporte to authenticated;
grant select, insert, update, delete on table public.deporte to service_role;

alter table public.deporte enable row level security;
alter table public.deporte force row level security;

drop policy if exists deporte_select on public.deporte;
create policy deporte_select on public.deporte
  for select
  to authenticated
  using (interno.es_super_admin() or interno.es_admin_de_algun_club());

drop policy if exists deporte_insert on public.deporte;
create policy deporte_insert on public.deporte
  for insert
  to authenticated
  with check (interno.es_super_admin() and borrado_en is null);

-- Solo se edita (o se borra) un deporte que no está borrado.
drop policy if exists deporte_update on public.deporte;
create policy deporte_update on public.deporte
  for update
  to authenticated
  using (interno.es_super_admin() and borrado_en is null)
  with check (interno.es_super_admin());
