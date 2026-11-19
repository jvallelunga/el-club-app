-- Condición del deporte (#74).
--
-- Una condición son chequeos sobre el sexo y la fecha de nacimiento, unidos
-- por Y u O, con como máximo un subnivel. Se guarda como jsonb:
--
--   { "conector": "Y" | "O", "items": [ chequeo | subgrupo, ... ] }
--   subgrupo: { "conector": "Y" | "O", "items": [ chequeo, ... ] }  (no vacío)
--   chequeo:  { "campo": "sexo", "valor": "M" | "F" }
--           | { "campo": "edad", "desde"?: 0..120, "hasta"?: 0..120 }
--           | { "campo": "anio", "desde"?: 1900..2100, "hasta"?: 1900..2100 }
--   (edad y anio con desde, hasta o los dos, enteros y desde <= hasta)
--
-- interno.es_condicion_valida valida esa forma, la misma que
-- validarCondicion en src/dominio/condicion.ts. No depende del deporte: la
-- van a usar la condición del club (#77) y las categorías (#57).
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

create or replace function interno.es_chequeo_valido(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_min int;
  v_max int;
  v_desde jsonb;
  v_hasta jsonb;
begin
  if jsonb_typeof(p) is distinct from 'object' then
    return false;
  end if;

  if p->>'campo' = 'sexo' then
    return (select coalesce(bool_and(k in ('campo', 'valor')), true) from jsonb_object_keys(p) as k)
      and jsonb_typeof(p->'valor') = 'string'
      and p->>'valor' in ('M', 'F');
  end if;

  if p->>'campo' = 'edad' then
    v_min := 0;
    v_max := 120;
  elsif p->>'campo' = 'anio' then
    v_min := 1900;
    v_max := 2100;
  else
    return false;
  end if;

  if not (select coalesce(bool_and(k in ('campo', 'desde', 'hasta')), true) from jsonb_object_keys(p) as k) then
    return false;
  end if;

  v_desde := p->'desde';
  v_hasta := p->'hasta';
  if v_desde is null and v_hasta is null then
    return false;
  end if;
  if v_desde is not null and not (
    jsonb_typeof(v_desde) = 'number'
    and (v_desde::text)::numeric = trunc((v_desde::text)::numeric)
    and (v_desde::text)::numeric between v_min and v_max
  ) then
    return false;
  end if;
  if v_hasta is not null and not (
    jsonb_typeof(v_hasta) = 'number'
    and (v_hasta::text)::numeric = trunc((v_hasta::text)::numeric)
    and (v_hasta::text)::numeric between v_min and v_max
  ) then
    return false;
  end if;
  if v_desde is not null and v_hasta is not null
    and (v_desde::text)::numeric > (v_hasta::text)::numeric then
    return false;
  end if;
  return true;
end;
$$;

comment on function interno.es_chequeo_valido(jsonb) is
  'True si p es un chequeo de condición: sexo (M/F), edad (0..120) o anio (1900..2100) con desde y/o hasta enteros, desde <= hasta. Ver src/dominio/condicion.ts.';

create or replace function interno.es_condicion_valida(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_item jsonb;
  v_chequeo jsonb;
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (select coalesce(bool_and(k in ('conector', 'items')), true) from jsonb_object_keys(p) as k)
    or jsonb_typeof(p->'conector') is distinct from 'string'
    or p->>'conector' not in ('Y', 'O')
    or jsonb_typeof(p->'items') is distinct from 'array' then
    return false;
  end if;

  for v_item in select * from jsonb_array_elements(p->'items') loop
    if jsonb_typeof(v_item) = 'object' and v_item ? 'items' then
      -- Subgrupo: su propio conector, al menos un chequeo y ningún grupo adentro.
      if not (select coalesce(bool_and(k in ('conector', 'items')), true) from jsonb_object_keys(v_item) as k)
        or jsonb_typeof(v_item->'conector') is distinct from 'string'
        or v_item->>'conector' not in ('Y', 'O')
        or jsonb_typeof(v_item->'items') is distinct from 'array'
        or jsonb_array_length(v_item->'items') = 0 then
        return false;
      end if;
      for v_chequeo in select * from jsonb_array_elements(v_item->'items') loop
        if not interno.es_chequeo_valido(v_chequeo) then
          return false;
        end if;
      end loop;
    elsif not interno.es_chequeo_valido(v_item) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

comment on function interno.es_condicion_valida(jsonb) is
  'True si p es una condición: {conector Y/O, items} con chequeos y como máximo un subnivel de grupos no vacíos. La misma forma que validarCondicion en src/dominio/condicion.ts.';

revoke all on function interno.es_chequeo_valido(jsonb) from public, anon;
revoke all on function interno.es_condicion_valida(jsonb) from public, anon;
grant execute on function interno.es_chequeo_valido(jsonb) to authenticated, service_role;
grant execute on function interno.es_condicion_valida(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- La condición del deporte. Sin chequeos, puede anotarse cualquier socio.
-- ---------------------------------------------------------------------------

alter table public.deporte
  add column if not exists condicion jsonb not null default '{"conector": "Y", "items": []}'::jsonb;

alter table public.deporte drop constraint if exists deporte_condicion_check;
alter table public.deporte add constraint deporte_condicion_check
  check (interno.es_condicion_valida(condicion));

comment on column public.deporte.condicion is
  'Condición para anotarse en el deporte (interno.es_condicion_valida). Sin items, puede anotarse cualquier socio.';
