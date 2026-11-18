-- Guardar el contacto del club y sus redes en una sola transacción.
-- Idempotente. Se aplica solo en el proyecto de desarrollo
-- (paacpcdurdcmbamdhcmt). No tocar producción.
--
-- Antes la app actualizaba el club, borraba todas las redes y después
-- insertaba las nuevas, en tres pedidos separados. Si el último fallaba, el
-- club quedaba sin redes. Esta función hace los tres pasos juntos: si algo
-- falla, no cambia nada.
--
-- security invoker: corre con los permisos de quien llama, así que valen las
-- mismas políticas RLS que antes (solo Admins del club o el Super Admin).

create or replace function public.guardar_contacto_club(
  p_club_id uuid,
  p_telefono text,
  p_email text,
  p_direccion text,
  p_web text,
  p_redes jsonb
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_actualizados integer;
begin
  if p_redes is null or jsonb_typeof(p_redes) <> 'array' then
    raise exception 'Las redes tienen que ser una lista.'
      using errcode = '22023';
  end if;

  update public.club
  set
    telefono = p_telefono,
    email = p_email,
    direccion = p_direccion,
    web = p_web
  where id = p_club_id;
  get diagnostics v_actualizados = row_count;
  if v_actualizados = 0 then
    raise exception 'No encontramos ese club.'
      using errcode = 'P0002';
  end if;

  delete from public.club_red_social
  where club_id = p_club_id;

  insert into public.club_red_social (club_id, red, etiqueta, valor, orden)
  select
    p_club_id,
    r.red,
    r.etiqueta,
    r.valor,
    coalesce(r.orden, 0)
  from jsonb_to_recordset(p_redes)
    as r(red text, etiqueta text, valor text, orden integer);
end;
$$;

comment on function public.guardar_contacto_club(uuid, text, text, text, text, jsonb) is
  'Actualiza el contacto del club y reemplaza sus redes en una sola transacción. Respeta RLS.';

revoke all on function public.guardar_contacto_club(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function public.guardar_contacto_club(uuid, text, text, text, text, jsonb) to authenticated, service_role;
