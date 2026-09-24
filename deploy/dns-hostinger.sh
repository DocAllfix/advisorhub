#!/usr/bin/env bash
# Record DNS di un'istanza sul dominio-brand, via API Hostinger.
#
#   ./deploy/dns-hostinger.sh crea   acme 203.0.113.10
#   ./deploy/dns-hostinger.sh rimuovi acme
#
# ATTENZIONE — la riga piu' pericolosa dell'intero deploy.
# L'API Hostinger accetta `overwrite`. Con `overwrite: true` SOSTITUISCE L'INTERA
# ZONA, cancellando i record di ogni cliente gia' attivo: un comando solo mette
# offline tutta la flotta del prodotto. Qui si usa SEMPRE `overwrite: false`, e
# in piu':
#   - si salva uno snapshot della zona PRIMA di scrivere (per ripristinare)
#   - si conta i record DOPO (per accorgersi)
#
# Uno snapshot fa ripristinare, un conteggio fa ACCORGERE. Servono entrambi.
#
# Variante concordata con le sessioni gdprhub e flowcrm, che condividono lo
# stesso dominio-brand su provider diversi: quando arrivera' la loro versione
# comune, questa si sostituisce mantenendo la stessa interfaccia.
set -euo pipefail

AZIONE="${1:?Uso: dns-hostinger.sh crea|rimuovi <slug> [ip]}"
SLUG="${2:?slug mancante}"
IP="${3:-}"

# Il dominio-brand e' finbeacon.it, verificato sull'account Hostinger.
#
# Il valore predefinito era finbeacon.it, che NON e' fra i domini dell'account:
# scritto quando il token non c'era ancora e nessuno poteva controllarlo.
#
# E il difetto non si sarebbe fatto notare, perche' la rete di sicurezza qui
# sotto non lo copre. L'API risponde 200 con LISTA VUOTA per qualunque dominio
# non posseduto, compreso uno inventato:
#
#     GET zones/finbeacon.it                  -> 200  [due record]
#     GET zones/finbeacon.it                 -> 200  []
#     GET zones/dominio-inventato-12345.it    -> 200  []
#
# Una zona inesistente e' quindi INDISTINGUIBILE da una zona vuota: l'istantanea
# salverebbe [], il conteggio direbbe 0 prima e 0 dopo, e nessuno dei due griderebbe.
# Da qui il controllo esplicito sul portafoglio, prima di qualunque scrittura.
DOMINIO_BRAND="${DOMINIO_BRAND:-finbeacon.it}"
API="https://developers.hostinger.com/api/dns/v1/zones/${DOMINIO_BRAND}"
: "${HOSTINGER_API_TOKEN:?Imposta HOSTINGER_API_TOKEN (dal gestore di password, mai nel repository)}"
AUTH=(-H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H "Content-Type: application/json")

ISTANTANEE="${ISTANTANEE:-$HOME/.finbeacon/dns}"
mkdir -p "$ISTANTANEE"

# Il dominio-brand e' davvero NOSTRO? Senza questo, scrivere su un dominio che
# non possediamo fallisce in silenzio (vedi sopra). Costa una chiamata.
verifica_proprieta() {
  local trovato
  trovato=$(curl -fsS "${AUTH[@]}" "https://developers.hostinger.com/api/domains/v1/portfolio"     | python3 -c 'import sys,json
d=json.load(sys.stdin)
print("si" if any(x.get("domain")==sys.argv[1] for x in d) else "no")' "$DOMINIO_BRAND")
  if [ "$trovato" != "si" ]; then
    echo "ERRORE: '$DOMINIO_BRAND' non e' fra i domini di questo account Hostinger." >&2
    echo "        Scrivere su una zona non posseduta non da' errore: da' una lista vuota." >&2
    echo "        Controlla DOMINIO_BRAND, o il token." >&2
    exit 1
  fi
}

conta_record() {
  curl -fsS "${AUTH[@]}" "$API" | python3 -c 'import sys,json
d=json.load(sys.stdin)
r=d.get("zone") or d.get("records") or d
print(len(r) if isinstance(r,list) else 0)'
}

istantanea() {
  local file="$ISTANTANEE/${DOMINIO_BRAND}-$(date -u +%FT%H%M%SZ).json"
  curl -fsS "${AUTH[@]}" "$API" > "$file"
  chmod 600 "$file"
  echo "$file"
}

case "$AZIONE" in
  crea)
    [ -n "$IP" ] || { echo "ERRORE: serve l'indirizzo IP" >&2; exit 1; }
    verifica_proprieta
    PRIMA=$(conta_record)
    ISTA=$(istantanea)
    echo "[dns] record prima: $PRIMA — istantanea: $ISTA"

    curl -fsS -X PUT "${AUTH[@]}" "$API" -d "$(printf '{
      "overwrite": false,
      "zone": [{ "name": "%s", "type": "A", "ttl": 300, "records": [{ "content": "%s" }] }]
    }' "$SLUG" "$IP")" > /dev/null

    DOPO=$(conta_record)
    echo "[dns] record dopo: $DOPO"
    if [ "$DOPO" -lt "$PRIMA" ]; then
      echo "ERRORE GRAVE: i record sono DIMINUITI ($PRIMA -> $DOPO)." >&2
      echo "               La zona potrebbe essere stata sovrascritta." >&2
      echo "               Ripristina da: $ISTA" >&2
      exit 1
    fi
    ;;

  rimuovi)
    # Alla dismissione il DNS va per PRIMO: un record che punta a un indirizzo
    # non piu' nostro e' un sottodominio che qualcun altro puo' rivendicare.
    verifica_proprieta
    PRIMA=$(conta_record)
    ISTA=$(istantanea)
    curl -fsS -X DELETE "${AUTH[@]}" "$API" \
      -d "$(printf '{"filters":[{"name":"%s","type":"A"}]}' "$SLUG")" > /dev/null
    DOPO=$(conta_record)
    echo "[dns] record: $PRIMA -> $DOPO (istantanea: $ISTA)"
    ;;

  *) echo "azione sconosciuta: $AZIONE" >&2; exit 1 ;;
esac

# Controprova: due slug gia' attivi devono continuare a risolvere. Se la zona
# fosse stata azzerata lo si scopre adesso, in dieci secondi, e non quando
# chiama il primo cliente.
if [ -f deploy/fleet.txt ]; then
  awk 'NF && $1 !~ /^#/ {print $1}' deploy/fleet.txt | head -2 | while read -r ALTRO; do
    if [ -n "$(dig +short "${ALTRO}.${DOMINIO_BRAND}")" ]; then
      echo "[dns] controprova ok: ${ALTRO}.${DOMINIO_BRAND} risolve ancora"
    else
      echo "[dns] ALLARME: ${ALTRO}.${DOMINIO_BRAND} NON risolve piu'" >&2
    fi
  done
fi
