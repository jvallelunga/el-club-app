-- Instalaciones ubicadas en el predio (#43).
--
-- `elemento_predio` guarda lo que está ubicado en el predio de una sede. Por
-- ahora solo instalaciones de la sede: su posición [este, norte] en metros
-- desde el origen del predio, su rotación (grados, sentido horario) y sus
-- medidas según el tipo (las claves las define el código). Una instalación se
-- ubica a lo sumo una vez y, si se borra, sale del predio.
--
-- La tabla deja lugar para lo que sigue: la leyenda (#45) suma columnas; los
-- elementos de referencia (#46) aflojan elemento_predio_es_instalacion_check
-- y suman su tipo; los caminos y vallas (#47) suman una lista de puntos y
-- aflojan la posición.
--
-- Mismo RLS que predio: escribe solo el Super Admin; leen el Super Admin y
-- los Admins del club. Guardar va por guardar_predio(), que guarda el área y
-- las instalaciones en una sola transacción.
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

create table if not exists public.elemento_predio (
  id uuid primary key default gen_random_uuid(),
  predio_id uuid not null references public.predio (id) on delete cascade,
  instalacion_id uuid references public.instalacion (id) on delete cascade,
  este double precision not null,
  norte double precision not null,
  rotacion double precision not null default 0,
  medidas jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Una instalación se ubica a lo sumo una vez.
alter table public.elemento_predio drop constraint if exists elemento_predio_instalacion_id_key;
alter table public.elemento_predio add constraint elemento_predio_instalacion_id_key
  unique (instalacion_id);

create index if not exists elemento_predio_predio_id_idx
  on public.elemento_predio (predio_id);

-- Por ahora todo elemento es una instalación (#46 lo afloja).
alter table public.elemento_predio drop constraint if exists elemento_predio_es_instalacion_check;
alter table public.elemento_predio add constraint elemento_predio_es_instalacion_check
  check (instalacion_id is not null);

alter table public.elemento_predio drop constraint if exists elemento_predio_rotacion_check;
alter table public.elemento_predio add constraint elemento_predio_rotacion_check
  check (rotacion >= 0 and rotacion < 360);

-- Igual que el área: a no más de 5 km del origen.
alter table public.elemento_predio drop constraint if exists elemento_predio_posicion_check;
alter table public.elemento_predio add constraint elemento_predio_posicion_check
  check (sqrt(este * este + norte * norte) <= 5000);

-- Las medidas: un objeto de números entre 0,5 y 300 m. Qué claves lleva cada
-- tipo lo valida el código, que es donde viven los tipos (ADR 0001).
alter table public.elemento_predio drop constraint if exists elemento_predio_medidas_check;
alter table public.elemento_predio add constraint elemento_predio_medidas_check check (
  jsonb_typeof(medidas) = 'object'
  and not jsonb_path_exists(medidas, 'strict $.* ? (@.type() != "number")')
  and not jsonb_path_exists(medidas, 'strict $.* ? (@ < 0.5 || @ > 300)')
);

comment on table public.elemento_predio is
  'Lo ubicado en el predio de una sede. Por ahora, instalaciones de la sede (a lo sumo una vez cada una). Posición [este, norte] en metros desde el origen del predio, rotación en grados (sentido horario) y medidas según el tipo.';
comment on column public.elemento_predio.este is
  'Metros al este del origen del predio (centro del elemento).';
comment on column public.elemento_predio.norte is
  'Metros al norte del origen del predio (centro del elemento).';
comment on column public.elemento_predio.rotacion is
  'Grados en sentido horario, de 0 a 360. Con 0, el largo va de oeste a este.';
comment on column public.elemento_predio.medidas is
  'Medidas en metros según el tipo (claves definidas en src/dominio/tipos-instalacion.ts).';

-- ---------------------------------------------------------------------------
-- La instalación tiene que ser de la sede del predio.
-- ---------------------------------------------------------------------------

create or replace function interno.validar_elemento_predio()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.instalacion_id is not null and not exists (
    select 1
    from public.instalacion i
    join public.predio p on p.sede_id = i.sede_id
    where i.id = new.instalacion_id
      and p.id = new.predio_id
  ) then
    raise exception 'La instalación no es de la sede del predio.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function interno.validar_elemento_predio() from public, anon;

drop trigger if exists validar_elemento_predio on public.elemento_predio;
create trigger validar_elemento_predio
  before insert or update of predio_id, instalacion_id on public.elemento_predio
  for each row
  execute function interno.validar_elemento_predio();

create or replace function interno.club_id_de_predio(p_predio_id uuid)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select s.club_id
  from public.predio p
  join public.sede s on s.id = p.sede_id
  where p.id = p_predio_id
$$;

comment on function interno.club_id_de_predio(uuid) is
  'Devuelve el club_id de un predio. Se usa en las políticas de elemento_predio.';

revoke all on function interno.club_id_de_predio(uuid) from public, anon;
grant execute on function interno.club_id_de_predio(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Grants y RLS.
-- ---------------------------------------------------------------------------

revoke all on table public.elemento_predio from public, anon;
grant select, insert, update, delete on table public.elemento_predio
  to authenticated, service_role;

alter table public.elemento_predio enable row level security;
alter table public.elemento_predio force row level security;

drop policy if exists elemento_predio_select on public.elemento_predio;
create policy elemento_predio_select on public.elemento_predio
  for select
  to authenticated
  using (interno.es_admin_club(interno.club_id_de_predio(predio_id)));

drop policy if exists elemento_predio_insert on public.elemento_predio;
create policy elemento_predio_insert on public.elemento_predio
  for insert
  to authenticated
  with check (interno.es_super_admin());

drop policy if exists elemento_predio_update on public.elemento_predio;
create policy elemento_predio_update on public.elemento_predio
  for update
  to authenticated
  using (interno.es_super_admin())
  with check (interno.es_super_admin());

drop policy if exists elemento_predio_delete on public.elemento_predio;
create policy elemento_predio_delete on public.elemento_predio
  for delete
  to authenticated
  using (interno.es_super_admin());

-- ---------------------------------------------------------------------------
-- Guardar el predio: el origen, el área y las instalaciones juntos.
-- ---------------------------------------------------------------------------

-- p_instalaciones: lista de {instalacion_id, este, norte, rotacion, medidas}.
-- Reemplaza las instalaciones ubicadas: las que no vienen salen del predio.
-- Las que ya no son de la sede (por ejemplo, borradas mientras se editaba) se
-- ignoran. security invoker: valen las políticas RLS de quien llama.
create or replace function public.guardar_predio(
  p_sede_id uuid,
  p_origen_lat double precision,
  p_origen_lng double precision,
  p_area jsonb,
  p_instalaciones jsonb
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_predio_id uuid;
begin
  if p_instalaciones is null or jsonb_typeof(p_instalaciones) <> 'array' then
    raise exception 'Las instalaciones tienen que ser una lista.'
      using errcode = '22023';
  end if;

  insert into public.predio (sede_id, origen_lat, origen_lng, area)
  values (p_sede_id, p_origen_lat, p_origen_lng, p_area)
  on conflict (sede_id) do update
  set
    origen_lat = excluded.origen_lat,
    origen_lng = excluded.origen_lng,
    area = excluded.area,
    actualizado_en = now()
  returning id into v_predio_id;

  delete from public.elemento_predio e
  where e.predio_id = v_predio_id
    and e.instalacion_id is not null
    and e.instalacion_id not in (
      select (x ->> 'instalacion_id')::uuid
      from jsonb_array_elements(p_instalaciones) as x
      where x ->> 'instalacion_id' is not null
    );

  insert into public.elemento_predio (
    predio_id, instalacion_id, este, norte, rotacion, medidas
  )
  select v_predio_id, r.instalacion_id, r.este, r.norte, r.rotacion, r.medidas
  from jsonb_to_recordset(p_instalaciones) as r(
    instalacion_id uuid,
    este double precision,
    norte double precision,
    rotacion double precision,
    medidas jsonb
  )
  join public.instalacion i on i.id = r.instalacion_id and i.sede_id = p_sede_id
  on conflict (instalacion_id) do update
  set
    este = excluded.este,
    norte = excluded.norte,
    rotacion = excluded.rotacion,
    medidas = excluded.medidas,
    actualizado_en = now();
end;
$$;

comment on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb) is
  'Guarda el origen, el área y las instalaciones ubicadas del predio de una sede en una sola transacción. Respeta RLS.';

revoke all on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb) to authenticated, service_role;
