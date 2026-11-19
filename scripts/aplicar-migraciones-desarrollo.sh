#!/usr/bin/env bash
# Aplica en el Supabase de DESARROLLO (el-club-app-desarrollo) las migraciones
# de supabase/migrations/ que todavía no se aplicaron, en orden, y las anota en
# interno.migracion_aplicada. Producción nunca: el ref está fijo.
#
# Uso (desde la raíz del repo):
#   bash scripts/aplicar-migraciones-desarrollo.sh                    # aplica las pendientes
#   bash scripts/aplicar-migraciones-desarrollo.sh --pendientes       # solo las lista
#   bash scripts/aplicar-migraciones-desarrollo.sh --marcar-aplicadas # anota todas sin correrlas
#
# Token: SUPABASE_ACCESS_TOKEN (token personal de Supabase). En el CI sale del
# secreto del repo. En una sesión de Claude en la nube lo pone el proxy de red y
# la variable puede quedar vacía.

set -euo pipefail

REF="paacpcdurdcmbamdhcmt"
API="https://api.supabase.com/v1/projects/${REF}/database/query"
DIR="supabase/migrations"

modo="aplicar"
case "${1:-}" in
  "") ;;
  --pendientes) modo="listar" ;;
  --marcar-aplicadas) modo="marcar" ;;
  *) echo "Opción desconocida: $1" >&2; exit 2 ;;
esac

if [ -n "${GITHUB_ACTIONS:-}" ] && [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "Falta el secreto SUPABASE_ACCESS_TOKEN en GitHub (Settings → Secrets and variables → Actions)." >&2
  exit 1
fi
# Sin variable, el proxy de la sesión reemplaza este valor por el token guardado.
TOKEN="${SUPABASE_ACCESS_TOKEN:-proxy-injected}"

consulta() {
  jq -n --arg q "$1" '{query: $q}' |
    curl -sS --fail-with-body -X POST "$API" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      --data-binary @-
}

consulta "create table if not exists interno.migracion_aplicada (
  nombre text primary key,
  aplicada_en timestamptz not null default now()
);
comment on table interno.migracion_aplicada is
  'Migraciones de supabase/migrations/ ya aplicadas en este proyecto. La escribe scripts/aplicar-migraciones-desarrollo.sh.';
revoke all on table interno.migracion_aplicada from public, anon, authenticated;" >/dev/null

aplicadas="$(consulta "select nombre from interno.migracion_aplicada" | jq -r '.[].nombre')"

pendientes=0
for archivo in $(ls "$DIR"/*.sql | sort); do
  nombre="$(basename "$archivo" .sql)"
  if ! [[ "$nombre" =~ ^[0-9]{14}_[a-z0-9_]+$ ]]; then
    echo "Nombre de migración inesperado: ${nombre}" >&2
    exit 1
  fi
  if grep -qxF "$nombre" <<<"$aplicadas"; then
    continue
  fi
  pendientes=$((pendientes + 1))
  case "$modo" in
    listar)
      echo "pendiente: ${nombre}"
      ;;
    marcar)
      consulta "insert into interno.migracion_aplicada (nombre) values ('${nombre}') on conflict do nothing" >/dev/null
      echo "marcada: ${nombre}"
      ;;
    aplicar)
      echo "aplicando: ${nombre}"
      if ! consulta "$(cat "$archivo")" >/dev/null; then
        echo "Falló ${nombre}: no se aplicaron las siguientes." >&2
        exit 1
      fi
      consulta "insert into interno.migracion_aplicada (nombre) values ('${nombre}') on conflict do nothing" >/dev/null
      ;;
  esac
done

echo "Listo (${modo}): ${pendientes} migración(es) pendiente(s) al empezar."
