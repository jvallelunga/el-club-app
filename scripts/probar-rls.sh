#!/usr/bin/env bash
# Prueba las migraciones y las políticas RLS en un Postgres común.
#
# 1. Crea de cero la base `probar_rls` (la borra si ya existe).
# 2. Carga lo mínimo de Supabase (supabase/tests/soporte/stub-supabase.sql).
# 3. Aplica cada migración dos veces seguidas: la segunda prueba que sea idempotente.
# 4. Corre cada prueba de supabase/tests/*.sql (cada una hace rollback al final).
#
# Necesita psql y un Postgres 16 con un usuario que pueda crear bases y roles.
# La conexión sale de las variables de psql (PGHOST, PGPORT, PGUSER, PGPASSWORD).
# Por ejemplo, con Docker:
#   docker run -d --name pg-rls -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:16
#   PGHOST=localhost PGPORT=54329 PGUSER=postgres PGPASSWORD=postgres bash scripts/probar-rls.sh
#
# Nunca apuntarlo a Supabase: es para una base local o de CI.

set -euo pipefail

cd "$(dirname "$0")/.."

BASE=probar_rls
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
psql_base() { psql -X -q -v ON_ERROR_STOP=1 -d "$BASE" "$@"; }

psql -X -q -v ON_ERROR_STOP=1 -d postgres \
  -c "drop database if exists $BASE with (force)" \
  -c "create database $BASE"

psql_base -f supabase/tests/soporte/stub-supabase.sql

for migracion in supabase/migrations/*.sql; do
  for vez in primera segunda; do
    if ! salida=$(psql_base -f "$migracion" 2>&1); then
      echo "✗ Falló la migración $migracion ($vez vez):" >&2
      echo "$salida" >&2
      exit 1
    fi
  done
done
echo "✓ Migraciones aplicadas, cada una dos veces seguidas"

for prueba in supabase/tests/*.sql; do
  if ! salida=$(psql_base -t -A -f "$prueba" 2>&1); then
    echo "✗ Falló $prueba:" >&2
    echo "$salida" >&2
    exit 1
  fi
  echo "✓ $prueba: $(echo "$salida" | grep -v '^$' | tail -1)"
done
