#!/usr/bin/env bash
# Levanta el servidor local de un worktree de .claude/worktrees: enlaza las
# claves (.env.local) de la carpeta principal si faltan, usa la versión de
# Node de .nvmrc, instala las dependencias si hace falta y corre `npm run dev`.
#
#   npm run worktree                 # lista los worktrees y elegís uno
#   npm run worktree <nombre>        # levanta ese
#   npm run worktree <nombre> -- -p 3001   # lo que va después de -- es para Next

set -euo pipefail

fallar() {
  echo "$*" >&2
  exit 1
}

# La carpeta principal es siempre el primer worktree que lista git.
principal="$(git -C "$(dirname "$0")" worktree list --porcelain | sed -n '1s/^worktree //p')"
carpeta="$principal/.claude/worktrees"

nombres=()
for ruta in "$carpeta"/*/; do
  [[ -e "${ruta}.git" ]] && nombres+=("$(basename "$ruta")")
done
[[ ${#nombres[@]} -gt 0 ]] || fallar "No hay worktrees en $carpeta."

rama() {
  git -C "$carpeta/$1" symbolic-ref --quiet --short HEAD || echo "sin rama"
}

listar() {
  local i
  for i in "${!nombres[@]}"; do
    printf '%3d) %s  (%s)\n' "$((i + 1))" "${nombres[$i]}" "$(rama "${nombres[$i]}")"
  done
}

nombre="${1:-}"
[[ $# -gt 0 ]] && shift
if [[ -z "$nombre" ]]; then
  listar
  [[ -t 0 ]] || fallar "Pasá el nombre: npm run worktree <nombre>"
  read -r -p "Número: " numero
  [[ "$numero" =~ ^[1-9][0-9]*$ && "$numero" -le ${#nombres[@]} ]] || fallar "No hay un worktree con ese número."
  nombre="${nombres[$((numero - 1))]}"
fi

destino="$carpeta/$nombre"
if [[ "$nombre" == */* || ! -e "$destino/.git" ]]; then
  listar >&2
  fallar "No existe el worktree «$nombre»."
fi
cd "$destino"

if [[ ! -e .env.local && ! -L .env.local ]]; then
  [[ -f "$principal/.env.local" ]] || fallar "Falta $principal/.env.local: copiá .env.example y completá las claves."
  ln -s "$principal/.env.local" .env.local
  echo "Enlacé .env.local al de la carpeta principal."
fi

# npm run deja estas variables apuntando a la carpeta desde la que se llamó, y
# con npm_config_prefix puesto nvm no cambia de versión.
unset npm_config_prefix npm_config_local_prefix

version="$(tr -d 'v[:space:]' < .nvmrc)"
node_sirve() {
  [[ "$(node -v 2>/dev/null)" == "v$version" || "$(node -v 2>/dev/null)" == "v$version".* ]]
}
if ! node_sirve; then
  nvm_sh="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  if [[ -s "$nvm_sh" ]]; then
    set +eu # nvm.sh no aguanta el modo estricto
    # shellcheck disable=SC1090
    . "$nvm_sh" --no-use
    nvm use "$version" >/dev/null
    set -eu
    hash -r
  fi
  node_sirve || fallar "Hace falta Node $version. Instalalo con: nvm install $version"
fi

if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then
  echo "Instalando dependencias…"
  npm ci --no-audit --no-fund
fi

if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Ojo: el puerto 3000 está ocupado. Mirá abajo en qué puerto quedó; el ingreso puede no andar fuera del 3000."
fi

echo "Levantando $nombre ($(rama "$nombre")) con Node $(node -v)."
exec npm run dev -- "$@"
