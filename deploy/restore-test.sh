#!/usr/bin/env bash
# Prova di ripristino automatizzata. Un backup non testato non e' un backup.
#
#   RESTIC_REPOSITORY=... RESTIC_PASSWORD_FILE=... ./deploy/restore-test.sh
#
# Verifica, senza toccare l'istanza in esercizio:
#   1. esiste uno snapshot recente
#   2. si ripristina davvero
#   3. il dump si carica in un Postgres EFFIMERO
#   4. CONTA LE RIGHE — un dump vuoto si ripristina benissimo
#   5. env.prod contiene BETTER_AUTH_SECRET (senza, tutte le sessioni cadono)
#
# Exit 0 = ripristino verificato. Diverso da 0 = il backup NON e' affidabile.
set -euo pipefail

RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"
ENV_FILE="${ENV_FILE:-deploy/.env.prod}"
SLUG="${SLUG:-$(grep -E '^SLUG=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || echo prova)}"

: "${RESTIC_REPOSITORY:?Imposta RESTIC_REPOSITORY}"
: "${RESTIC_PASSWORD_FILE:?Imposta RESTIC_PASSWORD_FILE}"
export RESTIC_REPOSITORY RESTIC_PASSWORD_FILE

WEBHOOK="${SENTINELLA_WEBHOOK:-}"
avvisa() {
  [ -n "$WEBHOOK" ] || return 0
  curl -fsS -m 10 -X POST "$WEBHOOK" -H 'Content-Type: application/json' \
    -d "{\"istanza\":\"$SLUG\",\"evento\":\"$1\",\"dettaglio\":\"${2:-}\",\"quando\":\"$(date -u +%FT%TZ)\"}" \
    >/dev/null 2>&1 || true
}
trap 'avvisa restore_test_fallito "riga $LINENO"' ERR

LAVORO="$(mktemp -d)"
EFFIMERO="advisorhub-restore-$$"
pulisci() {
  docker rm -f "$EFFIMERO" >/dev/null 2>&1 || true
  rm -rf "$LAVORO"
}
trap pulisci EXIT

echo "[restore-test] $SLUG"

# 1. Uno snapshot recente deve esistere. Un repository con l'ultimo backup di
#    tre settimane fa e' un backup fermo che nessuno ha notato.
ETA_ORE=$(restic snapshots --tag "$SLUG" --latest 1 --json \
  | python3 -c 'import sys,json,datetime
s=json.load(sys.stdin)
if not s: print(99999); raise SystemExit
t=datetime.datetime.fromisoformat(s[-1]["time"].split(".")[0].replace("Z","+00:00") if "+" in s[-1]["time"] or "Z" in s[-1]["time"] else s[-1]["time"])
if t.tzinfo is None: t=t.replace(tzinfo=datetime.timezone.utc)
print(int((datetime.datetime.now(datetime.timezone.utc)-t).total_seconds()//3600))')
echo "[restore-test] ultimo snapshot: ${ETA_ORE}h fa"
if [ "$ETA_ORE" -gt 26 ]; then
  echo "ERRORE: nessuno snapshot nelle ultime 26 ore" >&2
  exit 1
fi

# 2. Ripristino.
restic restore latest --tag "$SLUG" --target "$LAVORO" --quiet
DUMP="$(find "$LAVORO" -name db.dump | head -1)"
ENVP="$(find "$LAVORO" -name env.prod | head -1)"
[ -f "$DUMP" ] || { echo "ERRORE: db.dump assente nello snapshot" >&2; exit 1; }
echo "[restore-test] dump ripristinato: $(du -h "$DUMP" | cut -f1)"

# 5. I segreti dell'istanza devono esserci: senza, al ripristino nessuno rientra.
grep -qE '^BETTER_AUTH_SECRET=..+' "$ENVP" \
  || { echo "ERRORE: env.prod senza BETTER_AUTH_SECRET" >&2; exit 1; }
echo "[restore-test] env.prod contiene il segreto di sessione"

# 3. Postgres effimero.
docker run -d --rm --name "$EFFIMERO" \
  -e POSTGRES_PASSWORD=provaripristino -e POSTGRES_DB=provaripristino \
  postgres:17-alpine >/dev/null

# Attesa con una query REALE, non pg_isready: durante initdb il server
# temporaneo accetta connessioni e poi si riavvia, e pg_isready darebbe un
# falso "pronto" proprio nell'attimo in cui il socket sparisce.
# (Dettaglio gia' pagato una volta in WhistleVault: non va riscoperto.)
for _ in $(seq 1 60); do
  docker exec "$EFFIMERO" psql -U postgres -d provaripristino -c 'select 1' >/dev/null 2>&1 && break
  sleep 1
done

docker exec -i "$EFFIMERO" pg_restore -U postgres -d provaripristino --no-owner < "$DUMP" >/dev/null 2>&1 \
  || echo "[restore-test] pg_restore ha segnalato avvisi (normale su --no-owner)"

# 4. Conta le righe. Un dump vuoto si ripristina benissimo: e' il controllo che
#    distingue "ripristinato" da "ripristinato con dentro qualcosa".
conta() {
  docker exec "$EFFIMERO" psql -tA -U postgres -d provaripristino \
    -c "select count(*) from \"$1\";" 2>/dev/null | tr -d '\r' || echo 0
}
STUDI=$(conta organization); UTENTI=$(conta user)
CLIENTI=$(conta clienti);    ESERCIZI=$(conta esercizi)
echo "[restore-test] studi=$STUDI utenti=$UTENTI clienti=$CLIENTI esercizi=$ESERCIZI"

[ "${STUDI:-0}" -ge 1 ] || { echo "ERRORE: ripristino senza alcuno studio" >&2; exit 1; }
[ "${UTENTI:-0}" -ge 1 ] || { echo "ERRORE: ripristino senza alcun utente" >&2; exit 1; }

avvisa restore_test_ok "studi=$STUDI utenti=$UTENTI clienti=$CLIENTI"
trap - ERR
echo "[restore-test] PASSED — il backup e' ripristinabile"

# --- Cron mensile -----------------------------------------------------------
#  0 4 1 * *  cd /opt/advisorhub && RESTIC_REPOSITORY=... RESTIC_PASSWORD_FILE=... \
#             ./deploy/restore-test.sh >> /var/log/advisorhub-restore.log 2>&1
