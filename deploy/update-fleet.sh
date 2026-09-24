#!/usr/bin/env bash
# Aggiornamento di TUTTE le istanze cliente.
#
#   IMMAGINE=ghcr.io/org/finbeacon:<git-sha> ./deploy/update-fleet.sh
#   IMMAGINE=... ./deploy/update-fleet.sh --solo acme       # una sola istanza
#
# Inventario: deploy/fleet.txt (gitignorato), una riga per istanza:
#   <slug>  <utente@host>  <percorso-repo>  <dominio>
#
# In sequenza, una per volta, con STOP al primo fallimento: mai propagare una
# versione rotta a tutta la flotta. Ogni istanza deve superare tre cancelli
# prima che si passi alla successiva.
#
# Differenza da WhistleVault: li' ogni macchina ricostruiva l'immagine a bordo
# (build lunga, esito diverso per macchina, e un aggiornamento poteva finire in
# OOM). Qui si tira un'immagine gia' costruita dalla CI: tutti i clienti girano
# esattamente lo stesso binario, e il tiraggio dura secondi.
set -euo pipefail

RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"

FLEET="${FLEET:-deploy/fleet.txt}"
: "${IMMAGINE:?Imposta IMMAGINE (es. ghcr.io/org/finbeacon:<git-sha>)}"
SOLO=""
[ "${1:-}" = "--solo" ] && SOLO="${2:?slug mancante dopo --solo}"

[ -f "$FLEET" ] || { echo "ERRORE: inventario '$FLEET' non trovato" >&2; exit 1; }

AGGIORNATE=0
SALTATE=0

while read -r SLUG HOST PERCORSO DOMINIO; do
  case "$SLUG" in ''|\#*) continue ;; esac
  if [ -n "$SOLO" ] && [ "$SLUG" != "$SOLO" ]; then SALTATE=$((SALTATE+1)); continue; fi

  echo ""
  echo "════ $SLUG — $DOMINIO ════"
  SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 "$HOST")

  # 1. Backup PRIMA di toccare qualcosa. Se l'aggiornamento va male, il punto
  #    di ritorno e' di pochi minuti fa e non di stanotte.
  echo "  [1/5] backup preventivo"
  "${SSH[@]}" "cd '$PERCORSO' && ./deploy/backup.sh" \
    || { echo "ERRORE: backup fallito su [$SLUG] — STOP, non aggiorno" >&2; exit 1; }

  # 2. Nuova immagine nell'env, poi pull.
  echo "  [2/5] tiraggio dell'immagine"
  "${SSH[@]}" "cd '$PERCORSO' && \
    sed -i 's|^IMMAGINE=.*|IMMAGINE=$IMMAGINE|; s|^GIT_SHA=.*|GIT_SHA=${IMMAGINE##*:}|' deploy/.env.prod && \
    docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod pull" \
    || { echo "ERRORE: pull fallito su [$SLUG] — STOP" >&2; exit 1; }

  # 3. Migrazioni e riavvio. `up -d` rispetta le dipendenze: le migrazioni
  #    girano prima del web, mai dopo.
  echo "  [3/5] migrazioni e riavvio"
  "${SSH[@]}" "cd '$PERCORSO' && \
    docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d" \
    || { echo "ERRORE: avvio fallito su [$SLUG] — STOP" >&2; exit 1; }

  # 4. Cancello: salute profonda. Verifica anche il database, non solo la porta.
  echo "  [4/5] salute"
  PRONTA=0
  for _ in $(seq 1 18); do
    if curl -fsS -m 10 "https://$DOMINIO/api/health" 2>/dev/null | grep -q '"ok"'; then PRONTA=1; break; fi
    sleep 10
  done
  [ "$PRONTA" = 1 ] || { echo "ERRORE: [$SLUG] non torna sana — STOP, intervenire subito" >&2; exit 1; }

  # 5. Cancello: le intestazioni promesse non devono regredire.
  echo "  [5/5] intestazioni di sicurezza"
  bash deploy/security-headers-check.sh "https://$DOMINIO" \
    || { echo "ERRORE: [$SLUG] intestazioni regredite — STOP" >&2; exit 1; }

  # La versione servita deve essere quella che abbiamo appena messo: senza
  # questo controllo un pull fallito in silenzio passerebbe per aggiornamento.
  SERVITA=$(curl -fsS -m 10 "https://$DOMINIO/api/health" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("version",""))')
  [ "$SERVITA" = "${IMMAGINE##*:}" ] \
    || { echo "ERRORE: [$SLUG] serve la versione '$SERVITA', attesa '${IMMAGINE##*:}' — STOP" >&2; exit 1; }

  echo "  ✓ $SLUG aggiornata a ${IMMAGINE##*:}"
  AGGIORNATE=$((AGGIORNATE+1))
done < "$FLEET"

echo ""
echo "════ $AGGIORNATE istanze aggiornate e sane${SALTATE:+, $SALTATE saltate} ════"
