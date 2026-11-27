-- Quitar Admins y eliminar clubes (#85).
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- 1. Regla nueva para quitar Admins: un Admin puede quitar a los otros
--    Admins del club, pero no a sí mismo; el Super Admin puede quitar a
--    cualquiera, también al último. Reemplaza la salvaguarda del «último
--    Admin» (20261117153000 y 20261118120100).
-- 2. Eliminar un club es un soft delete: se completa club.borrado_en y la
--    fila queda. Solo el Super Admin lo elimina o lo restaura. Un club
--    eliminado deja de existir para sus Admins (no lo ven ni lo administran)
--    y para el público (no tiene marca pública).

-- ---------------------------------------------------------------------------
-- 1. Un Admin no se puede quitar a sí mismo
-- ---------------------------------------------------------------------------

create or replace function interno.evitar_quitarse_a_si_mismo()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.rol is distinct from 'admin' then
    return old;
  end if;

  -- Borrado en cascada del club o de la persona: no hay nada que cuidar.
  if not exists (select 1 from public.club where id = old.club_id)
    or not exists (select 1 from public.usuario where id = old.usuario_id)
  then
    return old;
  end if;

  if old.usuario_id = auth.uid() and not interno.es_super_admin() then
    raise exception 'No te podés quitar a vos mismo.'
      using errcode = 'P0001';
  end if;

  return old;
end;
$$;

comment on function interno.evitar_quitarse_a_si_mismo() is
  'Impide que un Admin se quite a sí mismo de un club. El Super Admin puede quitar a cualquiera.';

revoke all on function interno.evitar_quitarse_a_si_mismo() from public, anon, authenticated;

drop trigger if exists evitar_quitar_ultimo_admin on public.club_miembro;
drop trigger if exists evitar_quitarse_a_si_mismo on public.club_miembro;
create trigger evitar_quitarse_a_si_mismo
  before delete on public.club_miembro
  for each row
  execute function interno.evitar_quitarse_a_si_mismo();

drop function if exists interno.evitar_quitar_ultimo_admin();

-- ---------------------------------------------------------------------------
-- 2. Clubes eliminados (soft delete)
-- ---------------------------------------------------------------------------

alter table public.club add column if not exists borrado_en timestamptz;

comment on column public.club.borrado_en is
  'Soft delete: cuándo el Super Admin eliminó el club. Null si está activo. Un club eliminado no existe para sus Admins ni para el público, y el Super Admin lo puede restaurar.';

-- Un Admin solo administra su club mientras no esté eliminado. Como casi
-- todas las políticas RLS del club pasan por acá, eliminarlo le corta el
-- acceso a todo (club, sedes, predio, deportes, Admins).
create or replace function interno.es_admin_club(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (
      select 1
      from public.super_admin
      where usuario_id = auth.uid()
    )
    or exists (
      select 1
      from public.club_miembro m
      join public.club c on c.id = m.club_id
      where m.club_id = p_club_id
        and m.usuario_id = auth.uid()
        and m.rol = 'admin'
        and c.borrado_en is null
    );
$$;

-- Solo el Super Admin cambia el identificador, el dominio o si el club está
-- eliminado.
create or replace function interno.impedir_cambio_de_rutas_del_club()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.slug is distinct from old.slug
     or new.dominio_base is distinct from old.dominio_base then
    if not interno.es_super_admin() then
      raise exception
        'Solo el Super Admin puede cambiar el identificador o el dominio del club.'
        using errcode = 'P0001';
    end if;
  end if;
  if new.borrado_en is distinct from old.borrado_en
     and not interno.es_super_admin() then
    raise exception
      'Solo el Super Admin puede eliminar o restaurar un club.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

comment on function interno.impedir_cambio_de_rutas_del_club() is
  'Impide que alguien que no sea Super Admin cambie club.slug, club.dominio_base o club.borrado_en.';

-- Un club eliminado no tiene marca pública.
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
  where c.borrado_en is null
    and (
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
    )
  limit 1;
$$;
