-- Marca pública de un club (nombre, escudo, paleta) para el ingreso y
-- el tema, también sin sesión. Solo devuelve un club si se pide por
-- slug o por dominio base exactos: no lista todos los clubes.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.

create or replace function public.marca_publica_del_club(
  p_slug text default null,
  p_dominio_base text default null
)
returns table (
  slug text,
  nombre text,
  escudo_ruta text,
  color_principal text,
  color_claro text,
  color_2 text,
  color_3 text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    c.slug,
    c.nombre,
    c.escudo_ruta,
    c.color_principal,
    c.color_claro,
    c.color_2,
    c.color_3
  from public.club c
  where
    (
      p_slug is not null
      and btrim(p_slug) <> ''
      and c.slug = btrim(p_slug)
    )
    or (
      (p_slug is null or btrim(p_slug) = '')
      and p_dominio_base is not null
      and btrim(p_dominio_base) <> ''
      and c.dominio_base = lower(btrim(p_dominio_base))
    )
  limit 1;
$$;

comment on function public.marca_publica_del_club(text, text) is
  'Devuelve la marca pública de un club (nombre, escudo, paleta) por slug o dominio base. Para el ingreso y el tema, también sin sesión.';

revoke all on function public.marca_publica_del_club(text, text)
  from public;
grant execute on function public.marca_publica_del_club(text, text)
  to anon, authenticated;
