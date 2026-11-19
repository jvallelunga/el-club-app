-- Deportes del club (#75).
--
-- Cada club elige sus deportes del catálogo (public.deporte). Una fila de
-- club_deporte dice que el club tiene ese deporte. Quitarlo borra la fila;
-- en #56 eso corta los vínculos de los jugadores con el deporte en el club.
--
-- Escriben (suman y quitan) el Admin del club y el Super Admin; leen los
-- mismos (interno.es_admin_club). Un deporte borrado del catálogo no se puede
-- sumar, pero si el club ya lo tenía, la fila queda: el club lo ve marcado
-- como borrado.
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

create table if not exists public.club_deporte (
  club_id uuid not null references public.club (id) on delete cascade,
  deporte_id uuid not null references public.deporte (id),
  creado_en timestamptz not null default now(),
  primary key (club_id, deporte_id)
);

-- Para contar los clubes de cada deporte («Uso» del catálogo).
create index if not exists club_deporte_deporte_id_idx
  on public.club_deporte (deporte_id);

comment on table public.club_deporte is
  'Los deportes que eligió cada club del catálogo. Quitar un deporte borra la fila. Un deporte borrado no se suma, pero la fila de un club que ya lo tenía queda.';

-- ---------------------------------------------------------------------------
-- Permiso: el deporte está en el catálogo (no borrado).
-- ---------------------------------------------------------------------------

create or replace function interno.es_deporte_activo(p_deporte_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.deporte
    where id = p_deporte_id
      and borrado_en is null
  );
$$;

comment on function interno.es_deporte_activo(uuid) is
  'True si el deporte existe y no está borrado. SECURITY DEFINER para usarla en RLS sin depender de quién lee el catálogo.';

revoke all on function interno.es_deporte_activo(uuid) from public, anon;
grant execute on function interno.es_deporte_activo(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Grants y RLS. Sin update: un deporte se suma o se quita.
-- ---------------------------------------------------------------------------

revoke all on table public.club_deporte from public, anon, authenticated;
grant select, insert, delete on table public.club_deporte to authenticated;
grant select, insert, update, delete on table public.club_deporte to service_role;

alter table public.club_deporte enable row level security;
alter table public.club_deporte force row level security;

drop policy if exists club_deporte_select on public.club_deporte;
create policy club_deporte_select on public.club_deporte
  for select
  to authenticated
  using (interno.es_admin_club(club_id));

drop policy if exists club_deporte_insert on public.club_deporte;
create policy club_deporte_insert on public.club_deporte
  for insert
  to authenticated
  with check (interno.es_admin_club(club_id) and interno.es_deporte_activo(deporte_id));

drop policy if exists club_deporte_delete on public.club_deporte;
create policy club_deporte_delete on public.club_deporte
  for delete
  to authenticated
  using (interno.es_admin_club(club_id));
