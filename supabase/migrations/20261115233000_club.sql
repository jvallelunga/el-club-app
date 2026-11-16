-- Tabla inicial de club. Idempotente.
-- Solo id, slug, nombre y creado_en. La marca (escudo, paleta, dominio, PWA)
-- se suma en el ítem 2 (personalización por club).
-- No se siembra ningún club.

create table if not exists public.club (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  nombre text not null,
  creado_en timestamptz not null default now(),
  constraint club_slug_key unique (slug)
);

comment on table public.club is
  'Un club que usa la app. La personalización (marca, paleta, dominio) se suma después.';

comment on column public.club.slug is
  'Identificador único y estable del club, para URLs.';

comment on column public.club.nombre is
  'Nombre visible del club.';

comment on column public.club.creado_en is
  'Momento de alta. Mismo criterio de nombres que copa-raices (español).';

alter table public.club enable row level security;
