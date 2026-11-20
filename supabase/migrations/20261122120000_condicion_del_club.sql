-- Condición del club (#77).
--
-- Cada club puede sumarle su propia condición a cada deporte que eligió. Se
-- guarda en el vínculo (club_deporte.condicion) con la misma forma que la del
-- deporte (interno.es_condicion_valida). Solo suma requisitos: para anotarse
-- hay que cumplir la del deporte Y la del club (condicionEfectiva en
-- src/dominio/condicion.ts). Sin chequeos, el club no suma nada.
--
-- La cambian el Admin del club y el Super Admin. El update se limita a la
-- columna condicion: un deporte se sigue sumando o quitando, no se edita.
--
-- Idempotente. Se aplica solo en el proyecto de desarrollo. No tocar producción.

alter table public.club_deporte
  add column if not exists condicion jsonb not null default '{"conector": "Y", "items": []}'::jsonb;

alter table public.club_deporte drop constraint if exists club_deporte_condicion_check;
alter table public.club_deporte add constraint club_deporte_condicion_check
  check (interno.es_condicion_valida(condicion));

comment on column public.club_deporte.condicion is
  'Condición del club: requisitos que el club suma a la del deporte (interno.es_condicion_valida). Hay que cumplir las dos. Sin items, el club no suma nada.';

-- ---------------------------------------------------------------------------
-- Grants y RLS: update solo de la condición.
-- ---------------------------------------------------------------------------

revoke update on table public.club_deporte from authenticated;
grant update (condicion) on table public.club_deporte to authenticated;

drop policy if exists club_deporte_update on public.club_deporte;
create policy club_deporte_update on public.club_deporte
  for update
  to authenticated
  using (interno.es_admin_club(club_id))
  with check (interno.es_admin_club(club_id));
