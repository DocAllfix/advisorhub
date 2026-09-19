#!/usr/bin/env bash
# Sentinella di monitoraggio proattivo, sulla macchina del cliente.
#
#   */10 * * * *  cd /opt/advisorhub && SENTINELLA_WEBHOOK=... ./deploy/sentinella.sh
#
# Quello che Uptime Kuma NON vede: lui sa solo se la porta risponde. Qui si
# guarda dentro — disco, container, database, coda di posta, certificati — per
# accorgersi dei guasti PRIMA che il cliente apra un ticket.
#
# Ogni anomalia viene spedita al control plane. Il silenzio non e' una buona
# notizia: sul monitor push c'e' anche un battito, cosi' una sentinella ferma
# fa scattare l'allarme da sola.
set -uo pipefail   # NON -e: una sonda che fallisce non deve zittire le altre

RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"
COMPOSE="${COMPOSE:-deploy/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-deploy/.env.prod}"
WEBHOOK="${SENTINELLA_WEBHOOK:-}"

leggi() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2-; }
SLUG="$(leggi SLUG)"; SLUG="${SLUG:-sconosciuto}"
DOMINIO="$(leggi DOMINIO)"
PGUSER="$(leggi POSTGRES_USER)"; PGDB="$(leggi POSTGRES_DB)"

ANOMALIE=0
segnala() { # segnala <gravita> <sonda> <messaggio>
  ANOMALIE=$((ANOMALIE + 1))
  echo "[$1] $2: $3"
  [ -n "$WEBHOOK" ] || return 0
  curl -fsS -m 10 -X POST "$WEBHOOK" -H 'Content-Type: application/json' \
    -d "$(printf '{"istanza":"%s","gravita":"%s","sonda":"%s","messaggio":"%s","quando":"%s"}' \
         "$SLUG" "$1" "$2" "$(echo "$3" | tr '"' "'" | tr -d '\n')" "$(date -u +%FT%TZ)")" \
    >/dev/null 2>&1 || true
}
dc() { docker compose -f "$COMPOSE" --env-file "$ENV_FILE" "$@" 2>/dev/null; }
psql_q() { dc exec -T db psql -tA -U "$PGUSER" -d "$PGDB" -c "$1" 2>/dev/null | tr -d '\r'; }

echo "=== sentinella $SLUG — $(date -u +%FT%TZ) ==="

# --- 1. Disco. Pieno = Postgres in sola lettura, e l'istanza e' ferma. --------
for PUNTO in / /var/lib/docker; do
  USO=$(df -P "$PUNTO" 2>/dev/null | awk 'NR==2 {gsub("%","",$5); print $5}')
  # Una sonda che salta in silenzio e' indistinguibile da una che dice "tutto
  # bene". Se il punto di mount non si legge, va detto.
  if [ -z "$USO" ]; then
    [ -d "$PUNTO" ] && segnala avviso disco "$PUNTO non misurabile"
    continue
  fi
  if   [ "$USO" -ge 90 ]; then segnala critico disco "$PUNTO al ${USO}%"
  elif [ "$USO" -ge 80 ]; then segnala avviso  disco "$PUNTO al ${USO}%"
  fi
done

# --- 2. Container: fermi o malati -------------------------------------------
for SERVIZIO in db web posta caddy; do
  CID=$(dc ps -q "$SERVIZIO")
  if [ -z "$CID" ]; then segnala critico container "$SERVIZIO non esiste"; continue; fi
  STATO=$(docker inspect "$CID" --format '{{.State.Status}}' 2>/dev/null)
  SALUTE=$(docker inspect "$CID" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}assente{{end}}' 2>/dev/null)
  [ "$STATO" = "running" ] || segnala critico container "$SERVIZIO in stato $STATO"
  [ "$SALUTE" = "unhealthy" ] && segnala critico container "$SERVIZIO malato"

  # Autoheal riavvia: la sentinella dice CHE e' successo. Senza, un crash-loop
  # resta invisibile perche' il container risulta sempre "running".
  RIAVVII=$(docker inspect "$CID" --format '{{.RestartCount}}' 2>/dev/null)
  [ "${RIAVVII:-0}" -gt 3 ] && segnala avviso container "$SERVIZIO riavviato $RIAVVII volte"
done

# --- 3. Database -------------------------------------------------------------
LENTE=$(psql_q "select count(*) from pg_stat_activity where state='active' and now()-query_start > interval '30 seconds';")
[ "${LENTE:-0}" -gt 0 ] && segnala avviso database "$LENTE query attive da oltre 30s"

USATE=$(psql_q "select count(*) from pg_stat_activity;")
MASSIME=$(psql_q "show max_connections;")
if [ -n "$USATE" ] && [ -n "$MASSIME" ] && [ "$MASSIME" -gt 0 ]; then
  PERC=$(( USATE * 100 / MASSIME ))
  [ "$PERC" -ge 70 ] && segnala avviso database "connessioni al ${PERC}% ($USATE/$MASSIME)"
fi

DEADLOCK=$(psql_q "select coalesce(sum(deadlocks),0) from pg_stat_database where datname='$PGDB';")
[ "${DEADLOCK:-0}" -gt 0 ] && segnala avviso database "$DEADLOCK deadlock dall'ultimo azzeramento"

# --- 4. Coda di posta. Relay giu' = nessuno recupera la password. ------------
BLOCCATE=$(psql_q "select count(*) from mail_outbox where inviata_at is null and tentativi >= 5;")
[ "${BLOCCATE:-0}" -gt 0 ] && segnala critico posta "$BLOCCATE messaggi esauriti i tentativi"

FERME=$(psql_q "select count(*) from mail_outbox where inviata_at is null and created_at < now() - interval '30 minutes';")
[ "${FERME:-0}" -gt 0 ] && segnala critico posta "$FERME messaggi in coda da oltre 30 minuti"

ERRORE=$(psql_q "select coalesce(left(ultimo_errore,120),'') from mail_outbox where inviata_at is null and ultimo_errore is not null order by created_at desc limit 1;")
[ -n "$ERRORE" ] && segnala avviso posta "ultimo errore: $ERRORE"

# --- 5. Backup. Un backup fermo e' silenzioso per definizione. ----------------
if [ -n "${RESTIC_REPOSITORY:-}" ] && [ -n "${RESTIC_PASSWORD_FILE:-}" ]; then
  ULTIMO=$(restic snapshots --tag "$SLUG" --latest 1 --json 2>/dev/null | head -c 4000)
  if [ -z "$ULTIMO" ] || [ "$ULTIMO" = "[]" ]; then
    segnala critico backup "nessuno snapshot nel repository"
  else
    ORE=$(echo "$ULTIMO" | python3 -c 'import sys,json,datetime
try:
    s=json.load(sys.stdin)
    t=datetime.datetime.fromisoformat(s[-1]["time"].replace("Z","+00:00"))
    if t.tzinfo is None: t=t.replace(tzinfo=datetime.timezone.utc)
    print(int((datetime.datetime.now(datetime.timezone.utc)-t).total_seconds()//3600))
except Exception: print(99999)' 2>/dev/null)
    [ "${ORE:-99999}" -gt 26 ] && segnala critico backup "ultimo snapshot ${ORE}h fa"
  fi
fi

# --- 6. Certificato. Caddy rinnova da solo, ma se fallisce va saputo prima. ---
if [ -n "$DOMINIO" ]; then
  SCADENZA=$(echo | openssl s_client -servername "$DOMINIO" -connect "$DOMINIO:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$SCADENZA" ]; then
    GIORNI=$(( ( $(date -d "$SCADENZA" +%s) - $(date +%s) ) / 86400 ))
    [ "$GIORNI" -lt 14 ] && segnala critico tls "certificato in scadenza fra $GIORNI giorni"
  else
    segnala avviso tls "certificato non leggibile per $DOMINIO"
  fi
fi

# --- 7. Memoria e swap -------------------------------------------------------
if [ -r /proc/meminfo ]; then
  ST=$(awk '/SwapTotal/{print $2}' /proc/meminfo); SL=$(awk '/SwapFree/{print $2}' /proc/meminfo)
  if [ "${ST:-0}" -gt 0 ]; then
    USO_SWAP=$(( (ST - SL) * 100 / ST ))
    [ "$USO_SWAP" -ge 50 ] && segnala avviso memoria "swap al ${USO_SWAP}%"
  fi
fi

# --- 8. Aggiornamenti di sicurezza in attesa ---------------------------------
if command -v apt-get >/dev/null 2>&1; then
  PATCH=$(apt-get -s upgrade 2>/dev/null | grep -ci '^Inst.*security' || true)
  [ "${PATCH:-0}" -gt 0 ] && segnala avviso sistema "$PATCH aggiornamenti di sicurezza in attesa"
fi

# --- Battito: dice al control plane che la sentinella e' viva ----------------
if [ -n "$WEBHOOK" ]; then
  curl -fsS -m 10 -X POST "$WEBHOOK" -H 'Content-Type: application/json' \
    -d "{\"istanza\":\"$SLUG\",\"evento\":\"sentinella_ok\",\"anomalie\":$ANOMALIE,\"quando\":\"$(date -u +%FT%TZ)\"}" \
    >/dev/null 2>&1 || true
fi

echo "=== $ANOMALIE anomalie ==="
exit 0   # la sentinella non deve MAI far fallire il cron: segnala e basta
