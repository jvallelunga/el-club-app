-- Leyenda del predio (#45).
--
-- Cada elemento del predio suma:
-- - descripcion: texto corto (hasta 280 caracteres), sin formato, que se ve
--   en la leyenda y al tocar su número en el 3D. No son las notas internas de
--   la instalación.
-- - orden_leyenda: su lugar en la leyenda (1, 2, 3…), o null si no entra.
-- - en_leyenda: si entra en la leyenda. Se calcula del orden, así nunca se
--   contradicen.
--
-- El número que se ve es el puesto en la leyenda: lo calcula el código, así un
-- hueco (por ejemplo, una instalación borrada) no salta un número. Guardar el
-- predio deja el orden corrido.
--
-- Lo que ya estaba ubicado entra en la leyenda, en el orden en que se ubicó.
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

alter table public.elemento_predio add column if not exists descripcion text;
alter table public.elemento_predio add column if not exists orden_leyenda integer;
alter table public.elemento_predio add column if not exists en_leyenda boolean
  generated always as (orden_leyenda is not null) stored;

-- Antes de #45 no había leyenda: lo ubicado entra, en el orden en que se ubicó.
-- Corre una sola vez: después, en_leyenda se guarda junto con lo demás.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'elemento_predio_orden_leyenda_check'
      and conrelid = 'public.elemento_predio'::regclass
  ) then
    update public.elemento_predio e
    set orden_leyenda = n.orden
    from (
      select id, row_number() over (partition by predio_id order by creado_en, id) as orden
      from public.elemento_predio
    ) n
    where n.id = e.id;
  end if;
end;
$$;

alter table public.elemento_predio drop constraint if exists elemento_predio_descripcion_check;
alter table public.elemento_predio add constraint elemento_predio_descripcion_check
  check (descripcion is null or char_length(descripcion) between 1 and 280);

alter table public.elemento_predio drop constraint if exists elemento_predio_orden_leyenda_check;
alter table public.elemento_predio add constraint elemento_predio_orden_leyenda_check
  check (orden_leyenda is null or orden_leyenda >= 1);

-- Dos elementos del mismo predio no comparten lugar. Se controla al terminar
-- la transacción: guardar_predio reordena varios a la vez.
alter table public.elemento_predio drop constraint if exists elemento_predio_orden_leyenda_key;
alter table public.elemento_predio add constraint elemento_predio_orden_leyenda_key
  unique (predio_id, orden_leyenda) deferrable initially deferred;

comment on column public.elemento_predio.descripcion is
  'Texto corto (hasta 280 caracteres, sin formato) que se ve en la leyenda y al tocar el número en el 3D. No son las notas internas.';
comment on column public.elemento_predio.orden_leyenda is
  'Lugar en la leyenda (1, 2, 3…), o null si no entra. El número que se ve es el puesto en ese orden.';
comment on column public.elemento_predio.en_leyenda is
  'Si entra en la leyenda (con número). Se calcula de orden_leyenda.';

-- ---------------------------------------------------------------------------
-- Guardar el predio: ahora también la descripción y la leyenda.
-- ---------------------------------------------------------------------------

-- p_instalaciones: lista de {instalacion_id, este, norte, rotacion, medidas,
-- descripcion, orden_leyenda}. Reemplaza las instalaciones ubicadas: las que
-- no vienen salen del predio. Las que ya no son de la sede (por ejemplo,
-- borradas mientras se editaba) se ignoran. security invoker: valen las
-- políticas RLS de quien llama.
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
    predio_id, instalacion_id, este, norte, rotacion, medidas, descripcion, orden_leyenda
  )
  select
    v_predio_id, r.instalacion_id, r.este, r.norte, r.rotacion, r.medidas,
    r.descripcion, r.orden_leyenda
  from jsonb_to_recordset(p_instalaciones) as r(
    instalacion_id uuid,
    este double precision,
    norte double precision,
    rotacion double precision,
    medidas jsonb,
    descripcion text,
    orden_leyenda integer
  )
  join public.instalacion i on i.id = r.instalacion_id and i.sede_id = p_sede_id
  on conflict (instalacion_id) do update
  set
    este = excluded.este,
    norte = excluded.norte,
    rotacion = excluded.rotacion,
    medidas = excluded.medidas,
    descripcion = excluded.descripcion,
    orden_leyenda = excluded.orden_leyenda,
    actualizado_en = now();
end;
$$;

comment on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb) is
  'Guarda el origen, el área y las instalaciones ubicadas (con su descripción y su lugar en la leyenda) del predio de una sede en una sola transacción. Respeta RLS.';

revoke all on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb) to authenticated, service_role;
