#!/usr/bin/env bash
# Registra (o rimuove) un'istanza sul control plane condiviso.
#
#   ./deploy/registra-monitor.sh acme acme.finbeacon.it
#   ./deploy/registra-monitor.sh --rimuovi acme
#
# Il control plane è una VPS nostra, condivisa fra i tre prodotti (la costruisce
# la sessione gdprhub). Ospita GlitchTip, Uptime Kuma e Beszel.
#
# ── Perché un progetto GlitchTip PER CLIENTE e non per prodotto ─────────────
# Il collettore aggrega tracce di errore di TITOLARI DEL TRATTAMENTO DIVERSI:
# ogni studio commercialista è un titolare distinto, e negli stack trace possono
# affiorare dati dei suoi clienti. `environment` serve a filtrare, NON isola gli
# accessi. La segregazione dev'essere per progetto.
set -euo pipefail

if [ "${1:-}" = "--rimuovi" ]; then AZIONE=rimuovi; SLUG="${2:?slug mancante}"; DOMINIO=""
else AZIONE=crea; SLUG="${1:?slug mancante}"; DOMINIO="${2:?dominio mancante}"; fi

CONTROL="${CONTROL_PLANE:-https://monitor.finbeacon.it}"
: "${GLITCHTIP_TOKEN:?Imposta GLITCHTIP_TOKEN}"
: "${KUMA_TOKEN:?Imposta KUMA_TOKEN}"
GT_ORG="${GLITCHTIP_ORG:-finbeacon}"
GT_TEAM="${GLITCHTIP_TEAM:-finbeacon}"

gt() { curl -fsS -H "Authorization: Bearer $GLITCHTIP_TOKEN" -H "Content-Type: application/json" "$@"; }
km() { curl -fsS -H "Authorization: Bearer $KUMA_TOKEN" -H "Content-Type: application/json" "$@"; }

# Organizzazione e team sono nomi che vivono DENTRO GlitchTip: cambiarli qui non
# li cambia là. Fino al 24/09 si chiamavano `advisorhub`. Prima di creare o
# rimuovere qualunque cosa si verifica che esistano davvero, confrontando lo
# slug restituito: un'API che risponde senza la risorsa chiesta non deve passare
# per un successo (come la zona DNS non posseduta, G-36/G-45).
verifica_glitchtip() {
  local tipo="$1" percorso="$2" atteso="$3" slug
  slug="$(gt "$CONTROL/glitchtip/api/0/$percorso/" 2>/dev/null |
    node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).slug||"")}catch{console.log("")}})')" || slug=""
  if [ "$slug" != "$atteso" ]; then
    echo "ERRORE: $tipo '$atteso' non esiste su GlitchTip ($CONTROL)." >&2
    echo "        Crealo la', oppure imposta GLITCHTIP_ORG / GLITCHTIP_TEAM sul nome vero." >&2
    exit 1
  fi
}
verifica_glitchtip organizzazione "organizations/$GT_ORG" "$GT_ORG"
verifica_glitchtip team "teams/$GT_ORG/$GT_TEAM" "$GT_TEAM"

case "$AZIONE" in
crea)
  echo "[monitor] progetto GlitchTip 'finbeacon-$SLUG'"
  RISPOSTA="$(gt -X POST "$CONTROL/glitchtip/api/0/teams/$GT_ORG/$GT_TEAM/projects/" \
    -d "$(printf '{"name":"finbeacon-%s","platform":"javascript-nextjs"}' "$SLUG")" || true)"
  DSN="$(printf '%s' "$RISPOSTA" | python3 -c 'import sys,json
try:
    d=json.load(sys.stdin); k=(d.get("keys") or [{}])[0]
    print(k.get("dsn",{}).get("public",""))
except Exception: print("")' 2>/dev/null)"

  if [ -n "$DSN" ]; then
    echo "[monitor] DSN ottenuto"
    echo ""
    echo "  Va messo nel .env.prod dell'istanza COME BUILD ARG dell'immagine,"
    echo "  non a runtime: Next incorpora NEXT_PUBLIC_* a build time."
    echo ""
    echo "    NEXT_PUBLIC_SENTRY_DSN=$DSN"
    echo ""
    echo "  E la CSP deve elencare l'origine del collettore, altrimenti il"
    echo "  browser blocca gli eventi IN SILENZIO e si crede di avere la"
    echo "  telemetria senza averla (next.config.ts la ricava dal DSN)."
  else
    echo "[monitor] ATTENZIONE: nessun DSN nella risposta — crea il progetto a mano" >&2
  fi

  # Sonda di salute. La parola chiave "ok" è essenziale: senza, il monitor
  # passerebbe anche con un 200 che dice {"status":"degraded","db":"down"}.
  echo "[monitor] monitor Uptime Kuma su https://$DOMINIO/api/health"
  km -X POST "$CONTROL/kuma/api/monitors" -d "$(printf '{
    "type": "keyword", "name": "finbeacon %s — salute", "url": "https://%s/api/health",
    "keyword": "\"ok\"", "interval": 60, "retryInterval": 60, "maxretries": 2,
    "expiryNotification": true, "tags": ["finbeacon", "%s"]
  }' "$SLUG" "$DOMINIO" "$SLUG")" >/dev/null || echo "[monitor] monitor salute: da creare a mano" >&2

  # Monitor PUSH: allarma su chi NON chiama. È il battito di backup.sh e
  # sentinella.sh — senza, un backup fermo è silenzioso per definizione.
  echo "[monitor] monitor push (battito del backup, 26 h)"
  km -X POST "$CONTROL/kuma/api/monitors" -d "$(printf '{
    "type": "push", "name": "finbeacon %s — backup", "interval": 93600,
    "tags": ["finbeacon", "%s", "backup"]
  }' "$SLUG" "$SLUG")" >/dev/null || echo "[monitor] monitor push: da creare a mano" >&2

  echo "[monitor] monitor push (battito della sentinella, 30 min)"
  km -X POST "$CONTROL/kuma/api/monitors" -d "$(printf '{
    "type": "push", "name": "finbeacon %s — sentinella", "interval": 1800,
    "tags": ["finbeacon", "%s", "sentinella"]
  }' "$SLUG" "$SLUG")" >/dev/null || echo "[monitor] monitor push: da creare a mano" >&2

  cat <<NOTA

[monitor] Da completare: l'agente Beszel sul server del cliente (CPU, RAM,
          disco, rete, container). Sul control plane si aggiunge il nodo e si
          copia il comando di installazione, che contiene la chiave pubblica
          dell'hub.

[monitor] Regole di scrubbing della telemetria, concordate fra i tre prodotti —
          vanno nel codice, non qui:
            sendDefaultPii: false                      (già impostato)
            beforeSend che toglie corpo, query string, cookie e header
              con LISTA DI PERMESSI, non di divieti
            URL normalizzati: un UUID di cliente nel percorso, aggregato su un
              collettore condiviso, è tracciamento
            nessun campo `user` · retention 90 giorni
NOTA
  ;;

rimuovi)
  # Prima di spegnere l'istanza, o arriva una raffica di allarmi per un guasto
  # che non esiste.
  echo "[monitor] rimozione dei monitor di '$SLUG'"
  km -X DELETE "$CONTROL/kuma/api/monitors/tag/$SLUG" >/dev/null 2>&1 \
    || echo "[monitor] monitor: da rimuovere a mano dal control plane" >&2
  echo "[monitor] il progetto GlitchTip NON viene cancellato: conserva la storia"
  echo "          degli errori di quell'istanza. Archiviarlo a mano a fine retention."
  ;;
esac
