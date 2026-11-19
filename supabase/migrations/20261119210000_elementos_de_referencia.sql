-- Elementos de referencia puntuales (#46).
--
-- Un elemento del predio es una instalación de la sede o un elemento de
-- referencia: árbol, piedra, bebedero, gradas o tribuna. Los tipos viven en
-- código (src/dominio/tipos-referencia.ts), como los de instalación (ADR
-- 0001); la base solo acepta sus claves. Caminos y vallas van aparte (#47).
--
-- elemento_predio suma:
-- - tipo_referencia: la clave del tipo de elemento de referencia, o null si
--   es una instalación. Cada fila es una cosa o la otra, nunca las dos.
-- - nombre: opcional y solo para elementos de referencia (por ejemplo «El
--   ombú» o «Gradas Tito»). La instalación usa su propio nombre.
--
-- Mismo RLS que antes. Guardar sigue yendo por guardar_predio(), que ahora
-- recibe también los elementos de referencia y guarda todo junto.
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

alter table public.elemento_predio add column if not exists tipo_referencia text;
alter table public.elemento_predio add column if not exists nombre text;

-- Antes de #46 todo elemento era una instalación.
alter table public.elemento_predio drop constraint if exists elemento_predio_es_instalacion_check;

alter table public.elemento_predio drop constraint if exists elemento_predio_instalacion_o_referencia_check;
alter table public.elemento_predio add constraint elemento_predio_instalacion_o_referencia_check
  check ((instalacion_id is null) <> (tipo_referencia is null));

-- La lista tiene que coincidir con TIPOS_REFERENCIA en código.
alter table public.elemento_predio drop constraint if exists elemento_predio_tipo_referencia_check;
alter table public.elemento_predio add constraint elemento_predio_tipo_referencia_check
  check (tipo_referencia in ('arbol', 'piedra', 'bebedero', 'gradas', 'tribuna'));

-- El nombre: solo en elementos de referencia, de 1 a 60 caracteres.
alter table public.elemento_predio drop constraint if exists elemento_predio_nombre_check;
alter table public.elemento_predio add constraint elemento_predio_nombre_check
  check (
    nombre is null
    or (tipo_referencia is not null and char_length(nombre) between 1 and 60)
  );

comment on table public.elemento_predio is
  'Lo ubicado en el predio de una sede: una instalación de la sede (a lo sumo una vez cada una) o un elemento de referencia. Posición [este, norte] en metros desde el origen del predio, rotación en grados (sentido horario) y medidas según el tipo.';
comment on column public.elemento_predio.medidas is
  'Medidas en metros según el tipo (claves definidas en src/dominio/tipos-instalacion.ts y src/dominio/tipos-referencia.ts).';
comment on column public.elemento_predio.tipo_referencia is
  'Clave del tipo de elemento de referencia (src/dominio/tipos-referencia.ts), o null si es una instalación.';
comment on column public.elemento_predio.nombre is
  'Nombre propio opcional de un elemento de referencia (por ejemplo «El ombú»). Las instalaciones usan el suyo.';

-- ---------------------------------------------------------------------------
-- Guardar el predio: ahora también los elementos de referencia.
-- ---------------------------------------------------------------------------

-- La firma cambia (suma p_referencias): se borra la de cinco parámetros.
drop function if exists public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb);

-- p_instalaciones: lista de {instalacion_id, este, norte, rotacion, medidas,
-- descripcion, orden_leyenda}. Reemplaza las instalaciones ubicadas: las que
-- no vienen salen del predio. Las que ya no son de la sede (por ejemplo,
-- borradas mientras se editaba) se ignoran.
--
-- p_referencias: lista de {id, tipo, nombre, este, norte, rotacion, medidas,
-- descripcion, orden_leyenda}. El id lo pone el editor al agregarlo.
-- Reemplaza los elementos de referencia: los que no vienen se borran. Un id
-- que ya es de otro predio, o de una instalación, no se toca.
--
-- security invoker: valen las políticas RLS de quien llama.
create or replace function public.guardar_predio(
  p_sede_id uuid,
  p_origen_lat double precision,
  p_origen_lng double precision,
  p_area jsonb,
  p_instalaciones jsonb,
  p_referencias jsonb
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
  if p_referencias is null or jsonb_typeof(p_referencias) <> 'array' then
    raise exception 'Los elementos de referencia tienen que ser una lista.'
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

  delete from public.elemento_predio e
  where e.predio_id = v_predio_id
    and e.tipo_referencia is not null
    and e.id not in (
      select (x ->> 'id')::uuid
      from jsonb_array_elements(p_referencias) as x
      where x ->> 'id' is not null
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

  insert into public.elemento_predio (
    id, predio_id, tipo_referencia, nombre, este, norte, rotacion, medidas,
    descripcion, orden_leyenda
  )
  select
    coalesce(r.id, gen_random_uuid()), v_predio_id, r.tipo, r.nombre, r.este, r.norte,
    r.rotacion, r.medidas, r.descripcion, r.orden_leyenda
  from jsonb_to_recordset(p_referencias) as r(
    id uuid,
    tipo text,
    nombre text,
    este double precision,
    norte double precision,
    rotacion double precision,
    medidas jsonb,
    descripcion text,
    orden_leyenda integer
  )
  on conflict (id) do update
  set
    tipo_referencia = excluded.tipo_referencia,
    nombre = excluded.nombre,
    este = excluded.este,
    norte = excluded.norte,
    rotacion = excluded.rotacion,
    medidas = excluded.medidas,
    descripcion = excluded.descripcion,
    orden_leyenda = excluded.orden_leyenda,
    actualizado_en = now()
  where elemento_predio.predio_id = excluded.predio_id
    and elemento_predio.tipo_referencia is not null;
end;
$$;

comment on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb, jsonb) is
  'Guarda el origen, el área, las instalaciones ubicadas y los elementos de referencia (con su descripción y su lugar en la leyenda) del predio de una sede en una sola transacción. Respeta RLS.';

revoke all on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb, jsonb) to authenticated, service_role;
