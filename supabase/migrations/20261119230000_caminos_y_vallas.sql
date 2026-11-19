-- Caminos y vallas (#47).
--
-- Son elementos de referencia, como el árbol o las gradas (#46), pero se
-- dibujan punto a punto: en vez de posición y rotación guardan una lista de
-- puntos [este, norte] en metros desde el origen del predio. Sus medidas
-- (ancho del camino, alto de la valla) van en `medidas`, como las demás.
--
-- elemento_predio:
-- - suma `puntos`: la lista de puntos de un camino o una valla, o null;
-- - afloja `este`, `norte` y `rotacion`: un camino o una valla no los tiene;
-- - suma 'camino' y 'valla' a los tipos de elemento de referencia;
-- - elemento_predio_forma_check: un camino o una valla tiene puntos y no
--   tiene posición ni rotación; todo lo demás, al revés.
--
-- guardar_predio() mantiene la firma: cada elemento de p_referencias puede
-- traer `puntos` en vez de `este`, `norte` y `rotacion`.
--
-- Mismo RLS que antes. Idempotente. Se aplica solo en el proyecto de
-- desarrollo. No tocar producción.

alter table public.elemento_predio add column if not exists puntos jsonb;

alter table public.elemento_predio alter column este drop not null;
alter table public.elemento_predio alter column norte drop not null;
alter table public.elemento_predio alter column rotacion drop not null;

-- La lista tiene que coincidir con TIPOS_REFERENCIA y TIPOS_LINEA en código.
alter table public.elemento_predio drop constraint if exists elemento_predio_tipo_referencia_check;
alter table public.elemento_predio add constraint elemento_predio_tipo_referencia_check
  check (tipo_referencia in ('arbol', 'piedra', 'bebedero', 'gradas', 'tribuna', 'camino', 'valla'));

-- Un camino o una valla: puntos, sin posición ni rotación. Lo demás, al revés.
alter table public.elemento_predio drop constraint if exists elemento_predio_forma_check;
alter table public.elemento_predio add constraint elemento_predio_forma_check check (
  case
    when tipo_referencia in ('camino', 'valla') then
      puntos is not null and este is null and norte is null and rotacion is null
    else
      puntos is null and este is not null and norte is not null and rotacion is not null
  end
);

-- Los puntos: de 2 a 500, cada uno [este, norte] en números. El case evita
-- pedirle el largo a algo que no es una lista.
alter table public.elemento_predio drop constraint if exists elemento_predio_puntos_check;
alter table public.elemento_predio add constraint elemento_predio_puntos_check check (
  puntos is null
  or case
    when jsonb_typeof(puntos) = 'array' then
      jsonb_array_length(puntos) between 2 and 500
      and not jsonb_path_exists(puntos, 'strict $[*] ? (@.type() != "array" || @.size() != 2)')
      and not jsonb_path_exists(puntos, 'strict $[*][*] ? (@.type() != "number")')
    else false
  end
);

comment on table public.elemento_predio is
  'Lo ubicado en el predio de una sede: una instalación de la sede (a lo sumo una vez cada una) o un elemento de referencia. Posición [este, norte] en metros desde el origen del predio y rotación en grados (sentido horario), o, si es un camino o una valla, una lista de puntos. Medidas según el tipo.';
comment on column public.elemento_predio.puntos is
  'Solo caminos y vallas: lista de puntos [este, norte] en metros desde el origen del predio, en el orden en que se dibujaron.';
comment on column public.elemento_predio.este is
  'Metros al este del origen del predio (centro del elemento). Null en caminos y vallas.';
comment on column public.elemento_predio.norte is
  'Metros al norte del origen del predio (centro del elemento). Null en caminos y vallas.';
comment on column public.elemento_predio.rotacion is
  'Grados en sentido horario, de 0 a 360. Con 0, el largo va de oeste a este. Null en caminos y vallas.';
comment on column public.elemento_predio.tipo_referencia is
  'Clave del tipo de elemento de referencia (src/dominio/tipos-referencia.ts: TIPOS_REFERENCIA o TIPOS_LINEA), o null si es una instalación.';

-- ---------------------------------------------------------------------------
-- Guardar el predio: los elementos de referencia pueden traer puntos.
-- ---------------------------------------------------------------------------

-- p_instalaciones: lista de {instalacion_id, este, norte, rotacion, medidas,
-- descripcion, orden_leyenda}. Reemplaza las instalaciones ubicadas: las que
-- no vienen salen del predio. Las que ya no son de la sede (por ejemplo,
-- borradas mientras se editaba) se ignoran.
--
-- p_referencias: lista de {id, tipo, nombre, este, norte, rotacion, puntos,
-- medidas, descripcion, orden_leyenda}. Un camino o una valla trae `puntos`
-- y no trae `este`, `norte` ni `rotacion`. El id lo pone el editor al
-- agregarlo. Reemplaza los elementos de referencia: los que no vienen se
-- borran. Un id que ya es de otro predio, o de una instalación, no se toca.
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
    id, predio_id, tipo_referencia, nombre, este, norte, rotacion, puntos, medidas,
    descripcion, orden_leyenda
  )
  select
    coalesce(r.id, gen_random_uuid()), v_predio_id, r.tipo, r.nombre, r.este, r.norte,
    r.rotacion, r.puntos, r.medidas, r.descripcion, r.orden_leyenda
  from jsonb_to_recordset(p_referencias) as r(
    id uuid,
    tipo text,
    nombre text,
    este double precision,
    norte double precision,
    rotacion double precision,
    puntos jsonb,
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
    puntos = excluded.puntos,
    medidas = excluded.medidas,
    descripcion = excluded.descripcion,
    orden_leyenda = excluded.orden_leyenda,
    actualizado_en = now()
  where elemento_predio.predio_id = excluded.predio_id
    and elemento_predio.tipo_referencia is not null;
end;
$$;

comment on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb, jsonb) is
  'Guarda el origen, el área, las instalaciones ubicadas y los elementos de referencia (con caminos y vallas, su descripción y su lugar en la leyenda) del predio de una sede en una sola transacción. Respeta RLS.';

revoke all on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_predio(uuid, double precision, double precision, jsonb, jsonb, jsonb) to authenticated, service_role;
