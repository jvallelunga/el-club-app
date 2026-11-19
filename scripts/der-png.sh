#!/usr/bin/env bash
# Genera el PNG del DER (docs/der-el-club.png) desde docs/der-el-club.mmd,
# en local, con Mermaid CLI. No depende de ningún servicio externo.
#
#   bash scripts/der-png.sh                 # escribe docs/der-el-club.png
#   bash scripts/der-png.sh /tmp/prueba.png # escribe en otro lado
#
# La primera vez, npx baja Mermaid CLI y su Chromium. Si ya hay un Chromium
# instalado (por ejemplo en una sesión en la nube), se puede usar ese:
#   CHROMIUM_PATH=/opt/pw-browsers/chromium bash scripts/der-png.sh

set -euo pipefail

cd "$(dirname "$0")/.."

salida="${1:-docs/der-el-club.png}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Las líneas %% de arriba son notas del modelo, no parte del diagrama.
grep -v '^%%' docs/der-el-club.mmd > "$tmp/der.mmd"

opciones=()
if [[ -n "${CHROMIUM_PATH:-}" ]]; then
  printf '{"executablePath":"%s","args":["--no-sandbox"]}' "$CHROMIUM_PATH" > "$tmp/puppeteer.json"
  opciones=(-p "$tmp/puppeteer.json")
  export PUPPETEER_SKIP_DOWNLOAD=1
fi

npx -y @mermaid-js/mermaid-cli@11.4.2 \
  -i "$tmp/der.mmd" -o "$salida" -s 2 -b white ${opciones[@]+"${opciones[@]}"}

echo "✓ $salida"
