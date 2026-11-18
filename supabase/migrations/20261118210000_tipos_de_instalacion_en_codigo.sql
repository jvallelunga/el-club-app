-- Los tipos de instalación pasan a estar definidos en código (ADR 0001, #41).
--
-- La instalación guarda la clave del tipo en `instalacion.tipo`. Las que
-- tenían un tipo propio del club (o un tipo de base que ya no existe) pasan a
-- «Otra» y llevan «Tipo: <nombre viejo>» al principio de sus notas. Después se
-- borra la tabla `tipo_instalacion`.
--
-- Idempotente: si `tipo_instalacion` ya no existe, la conversión no se repite.

alter table public.instalacion
  add column if not exists tipo text;

comment on column public.instalacion.tipo is
  'Clave del tipo de instalación, definido en código (src/dominio/tipos-instalacion.ts). «otra» es un bloque genérico.';

do $$
begin
  if to_regclass('public.tipo_instalacion') is null then
    return;
  end if;

  with tipos as (
    select
      t.id,
      t.nombre,
      case
        when t.club_id is not null then null
        else case lower(t.nombre)
          when 'cancha de rugby' then 'cancha_rugby'
          when 'cancha de hockey' then 'cancha_hockey'
          when 'cancha de tenis' then 'cancha_tenis'
          when 'cancha de fútbol' then 'cancha_futbol'
          when 'house' then 'house'
          when 'pileta' then 'pileta'
          when 'gym' then 'gym'
          when 'vestuario' then 'vestuario'
          when 'quincho' then 'quincho'
          when 'salón' then 'salon'
          when 'otra' then 'otra'
        end
      end as clave
    from public.tipo_instalacion t
  )
  update public.instalacion i
  set
    tipo = coalesce(tipos.clave, 'otra'),
    notas = case
      when tipos.clave is not null then i.notas
      when nullif(trim(i.notas), '') is null then 'Tipo: ' || tipos.nombre
      else 'Tipo: ' || tipos.nombre || E'\n' || i.notas
    end
  from tipos
  where tipos.id = i.tipo_instalacion_id
    and i.tipo is null;

  drop trigger if exists validar_tipo_de_instalacion on public.instalacion;
  drop function if exists interno.validar_tipo_de_instalacion();
  alter table public.instalacion drop column if exists tipo_instalacion_id;
  drop table public.tipo_instalacion;
end
$$;

alter table public.instalacion
  alter column tipo set not null;

alter table public.instalacion
  drop constraint if exists instalacion_tipo_check;

-- La lista tiene que coincidir con TIPOS_INSTALACION en código.
alter table public.instalacion
  add constraint instalacion_tipo_check check (
    tipo in (
      'cancha_rugby',
      'cancha_hockey',
      'cancha_tenis',
      'cancha_futbol',
      'house',
      'pileta',
      'gym',
      'vestuario',
      'quincho',
      'salon',
      'otra'
    )
  );

comment on table public.instalacion is
  'Instalación de una sede: un tipo definido en código, un nombre (por ejemplo «Cancha 1») y notas opcionales.';
