-- Condición del deporte (#74).
--
-- Una condición son chequeos sobre el sexo y la fecha de nacimiento, unidos
-- por Y u O, con como máximo un subnivel. Se guarda como jsonb:
--
--   { "conector": "Y" | "O", "items": [ chequeo | subgrupo, ... ] }
--   subgrupo: { "conector": "Y" | "O", "items": [ chequeo, ... ] }  (no vacío, uno solo)
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

create or replace function interno.tiene_solo_claves(p jsonb, p_claves text[])
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select not exists (select 1 from jsonb_object_keys(p) as k where k <> all (p_claves));
$$;

comment on function interno.tiene_solo_claves(jsonb, text[]) is
  'True si el objeto p no tiene claves fuera de p_claves.';

-- Un extremo de un rango: ausente, o un entero entre p_min y p_max.
create or replace function interno.es_extremo_valido(p jsonb, p_min int, p_max int)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  -- case: el cast a numeric solo corre si p es un número.
  select case
    when p is null then true
    when jsonb_typeof(p) <> 'number' then false
    else (p::text)::numeric = trunc((p::text)::numeric)
      and (p::text)::numeric between p_min and p_max
  end;
$$;

comment on function interno.es_extremo_valido(jsonb, int, int) is
  'True si p (desde o hasta de un chequeo) falta o es un entero entre p_min y p_max.';

create or replace function interno.es_chequeo_valido(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_min int;
  v_max int;
begin
  if jsonb_typeof(p) is distinct from 'object' then
    return false;
  end if;

  if p->>'campo' = 'sexo' then
    return interno.tiene_solo_claves(p, array['campo', 'valor'])
      and jsonb_typeof(p->'valor') = 'string'
      and p->>'valor' in ('M', 'F');
  end if;

  -- Los mismos límites que RANGOS en src/dominio/condicion.ts.
  if p->>'campo' = 'edad' then
    v_min := 0;
    v_max := 120;
  elsif p->>'campo' = 'anio' then
    v_min := 1900;
    v_max := 2100;
  else
    return false;
  end if;

  if not interno.tiene_solo_claves(p, array['campo', 'desde', 'hasta'])
    or not (p ? 'desde' or p ? 'hasta')
    or not interno.es_extremo_valido(p->'desde', v_min, v_max)
    or not interno.es_extremo_valido(p->'hasta', v_min, v_max) then
    return false;
  end if;
  -- Recién acá desde y hasta son números.
  return not (p ? 'desde' and p ? 'hasta')
    or ((p->'desde')::text)::numeric <= ((p->'hasta')::text)::numeric;
end;
$$;

comment on function interno.es_chequeo_valido(jsonb) is
  'True si p es un chequeo de condición: sexo (M/F), edad (0..120) o anio (1900..2100) con desde y/o hasta enteros, desde <= hasta. Ver src/dominio/condicion.ts.';

-- La condición o un subgrupo: un objeto {conector Y/O, items: array}.
create or replace function interno.es_bloque_de_condicion(p jsonb)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select jsonb_typeof(p) = 'object'
    and interno.tiene_solo_claves(p, array['conector', 'items'])
    and jsonb_typeof(p->'conector') = 'string'
    and p->>'conector' in ('Y', 'O')
    and jsonb_typeof(p->'items') = 'array';
$$;

comment on function interno.es_bloque_de_condicion(jsonb) is
  'True si p tiene la forma de la condición o de un subgrupo: {conector Y/O, items: array}, sin mirar los items.';

create or replace function interno.es_condicion_valida(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_item jsonb;
  v_grupos int := 0;
begin
  if not coalesce(interno.es_bloque_de_condicion(p), false) then
    return false;
  end if;

  for v_item in select * from jsonb_array_elements(p->'items') loop
    if jsonb_typeof(v_item) = 'object' and v_item ? 'items' then
      -- El único subgrupo: al menos un chequeo y ningún grupo adentro.
      v_grupos := v_grupos + 1;
      if v_grupos > 1
        or not interno.es_bloque_de_condicion(v_item)
        or jsonb_array_length(v_item->'items') = 0
        or exists (
          select 1 from jsonb_array_elements(v_item->'items') as c
          where not interno.es_chequeo_valido(c)
        ) then
        return false;
      end if;
    elsif not interno.es_chequeo_valido(v_item) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

comment on function interno.es_condicion_valida(jsonb) is
  'True si p es una condición: {conector Y/O, items} con chequeos y como máximo un subgrupo, no vacío y sin grupos adentro. La misma forma que validarCondicion en src/dominio/condicion.ts.';

revoke all on function interno.tiene_solo_claves(jsonb, text[]) from public, anon;
revoke all on function interno.es_extremo_valido(jsonb, int, int) from public, anon;
revoke all on function interno.es_chequeo_valido(jsonb) from public, anon;
revoke all on function interno.es_bloque_de_condicion(jsonb) from public, anon;
revoke all on function interno.es_condicion_valida(jsonb) from public, anon;
grant execute on function interno.tiene_solo_claves(jsonb, text[]) to authenticated, service_role;
grant execute on function interno.es_extremo_valido(jsonb, int, int) to authenticated, service_role;
grant execute on function interno.es_chequeo_valido(jsonb) to authenticated, service_role;
grant execute on function interno.es_bloque_de_condicion(jsonb) to authenticated, service_role;
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
