#!/usr/bin/env bash
# Backup notturno di un'istanza cliente su Hetzner Storage Box.
#
#   cd /opt/advisorhub && ./deploy/backup.sh
#
# Evoluzione di WhistleVault (gpg + rclone) con tre differenze volute:
#
#  1. restic al posto di gpg+rclone: cifratura lato client, deduplica reale
#     (senza, 365 dump interi all'anno) e verifica del repository, non del solo
#     file locale.
#  2. La chiave SSH su questa macchina e' APPEND-ONLY: puo' scrivere, non
#     cancellare. Potatura e verifica girano dal control plane con la chiave
#     piena. Chi entra nel server non puo' distruggere i backup.
#  3. Heartbeat a fine corsa. Il backup.sh di WhistleVault falliva in silenzio su
#     un log che nessuno legge: qui il silenzio stesso fa scattare l'allarme.
set -euo pipefail

RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"

COMPOSE="${COMPOSE:-deploy/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-deploy/.env.prod}"
[ -f "$ENV_FILE" ] || { echo "ERRORE: $ENV_FILE non trovato" >&2; exit 1; }

leggi() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2-; }
SLUG="$(leggi SLUG)"
PGUSER="$(leggi POSTGRES_USER)"
PGDB="$(leggi POSTGRES_DB)"
[ -n "$SLUG" ] && [ -n "$PGUSER" ] && [ -n "$PGDB" ] || { echo "ERRORE: SLUG/POSTGRES_* mancanti in $ENV_FILE" >&2; exit 1; }

: "${RESTIC_REPOSITORY:?Imposta RESTIC_REPOSITORY (es. sftp:uXXXXX@uXXXXX.your-storagebox.de:/backup/$SLUG)}"
: "${RESTIC_PASSWORD_FILE:?Imposta RESTIC_PASSWORD_FILE (chmod 600, fuori dal repo)}"
export RESTIC_REPOSITORY RESTIC_PASSWORD_FILE

WEBHOOK="${SENTINELLA_WEBHOOK:-}"
avvisa() { # avvisa <evento> <dettaglio>
  [ -n "$WEBHOOK" ] || return 0
  curl -fsS -m 10 -X POST "$WEBHOOK" -H 'Content-Type: application/json' \
    -d "{\"istanza\":\"$SLUG\",\"evento\":\"$1\",\"dettaglio\":\"${2:-}\",\"quando\":\"$(date -u +%FT%TZ)\"}" \
    >/dev/null 2>&1 || true
}
trap 'avvisa backup_fallito "riga $LINENO"' ERR

STAMP="$(date -u +%FT%H%M%SZ)"
LAVORO="$(mktemp -d)"
trap 'rm -rf "$LAVORO"' EXIT

echo "[backup] $SLUG — $STAMP"

# 1. Dump logico in formato custom: permette il ripristino selettivo per tabella.
#    --compress=0 e' essenziale: comprimere qui rende inutile la deduplica di
#    restic, e ogni notte produrrebbe un blob completamente nuovo.
docker compose -f "$COMPOSE" --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$PGUSER" -d "$PGDB" --format=custom --compress=0 > "$LAVORO/db.dump"
echo "[backup] dump: $(du -h "$LAVORO/db.dump" | cut -f1)"

# 2. Segreti dell'istanza. Senza BETTER_AUTH_SECRET il ripristino riparte con
#    tutte le sessioni invalide: e' l'equivalente del pepper di WhistleVault.
cp "$ENV_FILE" "$LAVORO/env.prod"

# 3. Snapshot. La chiave locale puo' solo aggiungere.
restic backup "$LAVORO" --tag "$SLUG" --tag notturno --host "$SLUG" \
  --exclude-caches --quiet

# 4. Potatura e verifica NON qui: girano dal control plane con la chiave piena.
#    Se questa macchina potesse cancellare, un attaccante lo potrebbe anche lui.

# 5. Il silenzio e' un guasto: senza questo battito il monitor push scatta da solo.
avvisa backup_ok "$(restic snapshots --tag "$SLUG" --latest 1 --json 2>/dev/null | head -c 200)"
trap - ERR
echo "[backup] completato"

# --- Cron (root sulla macchina del cliente) ---------------------------------
#  15 2 * * *  cd /opt/advisorhub && \
#              RESTIC_REPOSITORY=sftp:uXXXXX@uXXXXX.your-storagebox.de:/backup/acme \
#              RESTIC_PASSWORD_FILE=/root/.advisorhub-restic \
#              SENTINELLA_WEBHOOK=https://monitor.advisorhub.it/push/xxxx \
#              ./deploy/backup.sh >> /var/log/advisorhub-backup.log 2>&1
