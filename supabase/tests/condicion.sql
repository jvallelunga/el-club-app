-- Pruebas de la forma de una condición (#74): interno.es_condicion_valida y
-- el check de deporte.condicion. Es la misma forma que validarCondicion en
-- src/dominio/condicion.ts.
-- Corre dentro de una transacción que hace rollback. No deja datos atrás.

begin;

do $$
declare
  v_validas jsonb[] := array[
    '{"conector": "Y", "items": []}',
    '{"conector": "Y", "items": [{"campo": "sexo", "valor": "M"}, {"campo": "edad", "desde": 16}]}',
    '{"conector": "O", "items": [{"campo": "edad", "desde": 25}, {"conector": "Y", "items": [{"campo": "sexo", "valor": "F"}, {"campo": "edad", "desde": 20}]}]}',
    '{"conector": "Y", "items": [{"campo": "anio", "desde": 1980, "hasta": 1986}]}',
    '{"conector": "Y", "items": [{"campo": "edad", "desde": 10, "hasta": 10}]}'
  ]::jsonb[];
  v_invalidas jsonb[] := array[
    'null',
    '"Y"',
    '{"conector": "Z", "items": []}',
    '{"conector": "Y"}',
    '{"conector": "Y", "items": [], "extra": 1}',
    -- Más de un subnivel.
    '{"conector": "Y", "items": [{"conector": "O", "items": [{"conector": "Y", "items": [{"campo": "sexo", "valor": "M"}]}]}]}',
    -- Grupo vacío.
    '{"conector": "Y", "items": [{"conector": "O", "items": []}]}',
    '{"conector": "Y", "items": [{"campo": "sexo", "valor": "X"}]}',
    '{"conector": "Y", "items": [{"campo": "altura", "desde": 1}]}',
    '{"conector": "Y", "items": [{"campo": "edad"}]}',
    '{"conector": "Y", "items": [{"campo": "edad", "desde": 16.5}]}',
    '{"conector": "Y", "items": [{"campo": "edad", "desde": "16"}]}',
    '{"conector": "Y", "items": [{"campo": "edad", "desde": 20, "hasta": 10}]}',
    '{"conector": "Y", "items": [{"campo": "edad", "desde": -1}]}',
    '{"conector": "Y", "items": [{"campo": "anio", "desde": 1800}]}',
    '{"conector": "Y", "items": [{"campo": "edad", "desde": 1, "extra": true}]}'
  ]::jsonb[];
  v jsonb;
begin
  foreach v in array v_validas loop
    if not interno.es_condicion_valida(v) then
      raise exception 'Debería ser válida: %', v;
    end if;
  end loop;
  foreach v in array v_invalidas loop
    if interno.es_condicion_valida(v) then
      raise exception 'No debería ser válida: %', v;
    end if;
  end loop;
end;
$$;

-- Un deporte nuevo arranca sin condición, y la base no guarda una mal formada.
do $$
declare
  v_id uuid;
begin
  insert into public.deporte (nombre, icono) values ('Prueba condición', 'trofeo')
  returning id into v_id;
  if (select condicion from public.deporte where id = v_id) <> '{"conector": "Y", "items": []}'::jsonb then
    raise exception 'Un deporte nuevo debería arrancar sin condición';
  end if;

  update public.deporte
  set condicion = '{"conector": "Y", "items": [{"campo": "sexo", "valor": "M"}]}'
  where id = v_id;

  begin
    update public.deporte
    set condicion = '{"conector": "Y", "items": [{"conector": "O", "items": [{"conector": "Y", "items": [{"campo": "sexo", "valor": "M"}]}]}]}'
    where id = v_id;
    raise exception 'Una condición con dos subniveles no debería guardarse';
  exception when check_violation then null;
  end;
end;
$$;

select 'Pruebas de la condición: ok' as resultado;

rollback;
