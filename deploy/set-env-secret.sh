#!/bin/bash
# Scrive un valore segreto nel .env del progetto senza esporlo:
# l'input e' nascosto e non passa dagli argomenti (quindi non finisce
# nella cronologia della shell).
#
#   ./deploy/set-env-secret.sh STRIPE_SECRET_KEY
#
# Se la variabile esiste gia' nel .env viene sostituita, altrimenti aggiunta.
set -eu

KEY="${1:-}"
if [ -z "$KEY" ]; then
  echo "Uso: $0 NOME_VARIABILE" >&2
  echo "Esempio: $0 STRIPE_SECRET_KEY" >&2
  exit 1
fi

case "$KEY" in
  [A-Za-z_]*) ;;
  *) echo "Nome variabile non valido: $KEY" >&2; exit 1 ;;
esac

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
[ -f "$ENV_FILE" ] || { echo "File non trovato: $ENV_FILE" >&2; exit 1; }

printf 'Valore per %s (input nascosto): ' "$KEY" >&2
IFS= read -rs VALUE
printf '\n' >&2

[ -n "$VALUE" ] || { echo "Valore vuoto: nessuna modifica." >&2; exit 1; }

KEY="$KEY" VALUE="$VALUE" ENV_FILE="$ENV_FILE" python3 - <<'PY'
import os

key, value, path = os.environ["KEY"], os.environ["VALUE"], os.environ["ENV_FILE"]
with open(path) as f:
    lines = f.read().splitlines()

line = f"{key}={value}"
prefix = f"{key}="
for i, existing in enumerate(lines):
    if existing.startswith(prefix):
        lines[i] = line
        break
else:
    lines.append(line)

with open(path, "w") as f:
    f.write("\n".join(lines) + "\n")
PY

chmod 600 "$ENV_FILE"
echo "OK: $KEY salvata in $ENV_FILE (permessi 600)." >&2
