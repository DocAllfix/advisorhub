#!/usr/bin/env bash
# Punta l'apex e il www di un dominio alla landing su Vercel, via API Hostinger.
#
#   ./deploy/dns-landing.sh punta finbeacon.eu <ipv4[,ipv4...]> <cname> --prova
#   ./deploy/dns-landing.sh punta finbeacon.eu <ipv4[,ipv4...]> <cname>
#   CONFERMA=si ./deploy/dns-landing.sh ripristina finbeacon.eu <istantanea.json>
#
# I valori di destinazione NON si scrivono a memoria: si leggono da Vercel dopo
# aver aggiunto il dominio al progetto (GET /v6/domains/<dominio>/config). Non
# e' prudenza teorica: il 24/09 Vercel ha chiesto DUE indirizzi per l'apex e un
# CNAME specifico del progetto, non il 76.76.21.21 / cname.vercel-dns.com che si
# trova in giro e che la prima versione di questo esempio riportava.
#
# PERCHE' UNO SCRIPT DIVERSO DA dns-hostinger.sh
# Quello AGGIUNGE record con `overwrite: false` ed e' condiviso con gli altri
# prodotti: e' sicuro proprio perche' non sostituisce mai niente. Qui invece
# l'apex ha gia' un record A (il parcheggio di Hostinger), e aggiungerne un
# secondo lascerebbe DUE indirizzi: meta' delle visite finirebbe sulla pagina di
# parcheggio. Serve SOSTITUIRE. Mescolare le due operazioni nello stesso script
# renderebbe pericoloso quello della flotta.
#
# La sostituzione e' MIRATA: si cancellano solo `@ A` e `www CNAME`, poi si
# aggiungono i nuovi con `overwrite: false`. Mai `overwrite: true` in `punta`:
# su finbeacon.it la stessa zona ospitera' i sottodomini delle istanze cliente.
#
# Stessa disciplina di dns-hostinger.sh, piu' una:
#   - proprieta' del dominio verificata sul portafoglio (una zona non posseduta
#     risponde 200 con lista vuota: vedi dns-hostinger.sh e G-36);
#   - istantanea della zona PRIMA di scrivere, per ripristinare;
#   - DOPO, ogni record che non e' @ A o www CNAME deve essere IDENTICO a prima.
#     Non basta contarli: un conteggio uguale puo' nascondere un record cambiato.
set -euo pipefail

AZIONE="${1:?Uso: dns-landing.sh punta <dominio> <ipv4> <cname> [--prova] | ripristina <dominio> <istantanea>}"
DOMINIO="${2:?dominio mancante}"
: "${HOSTINGER_API_TOKEN:?Imposta HOSTINGER_API_TOKEN (da ~/.config/flotta/hostinger.env, mai nel repository)}"

API="https://developers.hostinger.com/api/dns/v1/zones/${DOMINIO}"
AUTH=(-H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H "Content-Type: application/json")
ISTANTANEE="${ISTANTANEE:-$HOME/.finbeacon/dns}"
mkdir -p "$ISTANTANEE"

verifica_proprieta() {
  curl -fsS "${AUTH[@]}" "https://developers.hostinger.com/api/domains/v1/portfolio" |
    node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);const l=Array.isArray(j)?j:(j.data||[]);process.exit(l.some(x=>x.domain===process.argv[1])?0:1)})' "$DOMINIO" ||
    { echo "ERRORE: '$DOMINIO' non e' fra i domini di questo account Hostinger." >&2; exit 1; }
}

zona() { curl -fsS "${AUTH[@]}" "$API"; }

# Record della zona ESCLUSI quelli che stiamo per sostituire, in forma canonica
# e ordinata: due zone con gli stessi "altri" record danno la stessa stringa.
altri_record() {
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    const z=JSON.parse(d);const r=Array.isArray(z)?z:(z.zone||z.records||[]);
    const altri=r.filter(x=>!((x.name==="@"&&x.type==="A")||(x.name==="www"&&x.type==="CNAME")))
      .map(x=>`${x.name}|${x.type}|${x.ttl}|${(x.records||[]).map(y=>y.content).sort().join(",")}`).sort();
    console.log(altri.join("\n"))})'
}

valori() { # stampa i contenuti di <nome> <tipo>
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    const z=JSON.parse(d);const r=Array.isArray(z)?z:(z.zone||z.records||[]);
    const x=r.filter(x=>x.name===process.argv[1]&&x.type===process.argv[2]).flatMap(x=>(x.records||[]).map(y=>y.content));
    console.log(x.sort().join(","))})' "$1" "$2"
}

case "$AZIONE" in
  punta)
    IP="${3:?indirizzi IPv4 mancanti (da Vercel, separati da virgola)}"
    # In forma canonica: ordinati, come li restituisce `valori`.
    IP="$(printf '%s' "$IP" | tr ',' '\n' | sort | paste -sd, -)"
    RECORD_A="$(printf '%s' "$IP" | tr ',' '\n' | sed 's/.*/{ "content": "&" }/' | paste -sd, -)"
    CNAME="${4:?CNAME mancante (da Vercel)}"
    PROVA="${5:-}"
    verifica_proprieta

    PRIMA="$(zona)"
    ISTA="$ISTANTANEE/${DOMINIO}-$(date -u +%FT%H%M%SZ).json"
    printf '%s' "$PRIMA" > "$ISTA"
    chmod 600 "$ISTA"
    echo "[dns] istantanea: $ISTA"
    echo "[dns] oggi:   @ A = $(printf '%s' "$PRIMA" | valori @ A) · www CNAME = $(printf '%s' "$PRIMA" | valori www CNAME)"
    echo "[dns] dopo:   @ A = $IP · www CNAME = $CNAME"
    echo "[dns] altri record che devono restare identici: $(printf '%s' "$PRIMA" | altri_record | grep -c . || true)"

    if [ "$PROVA" = "--prova" ]; then
      echo "[dns] PROVA A SECCO: nessuna scrittura."
      exit 0
    fi

    curl -fsS -X DELETE "${AUTH[@]}" "$API" \
      -d '{"filters":[{"name":"@","type":"A"},{"name":"www","type":"CNAME"}]}' > /dev/null
    curl -fsS -X PUT "${AUTH[@]}" "$API" -d "$(printf '{
      "overwrite": false,
      "zone": [
        { "name": "@",   "type": "A",     "ttl": 300, "records": [%s] },
        { "name": "www", "type": "CNAME", "ttl": 300, "records": [{ "content": "%s" }] }
      ]
    }' "$RECORD_A" "$CNAME")" > /dev/null

    DOPO="$(zona)"
    ESITO=0
    [ "$(printf '%s' "$DOPO" | valori @ A)" = "$IP" ] || { echo "ERRORE: @ A non vale solo $IP" >&2; ESITO=1; }
    [ "$(printf '%s' "$DOPO" | valori www CNAME)" = "$CNAME" ] || { echo "ERRORE: www CNAME non vale $CNAME" >&2; ESITO=1; }
    if [ "$(printf '%s' "$PRIMA" | altri_record)" != "$(printf '%s' "$DOPO" | altri_record)" ]; then
      echo "ERRORE GRAVE: sono cambiati record che non andavano toccati." >&2
      ESITO=1
    fi
    if [ "$ESITO" -ne 0 ]; then
      echo "Ripristina con: CONFERMA=si ./deploy/dns-landing.sh ripristina $DOMINIO $ISTA" >&2
      exit 1
    fi
    echo "[dns] OK: @ e www puntano a Vercel, ogni altro record e' identico a prima."
    ;;

  ripristina)
    FILE="${3:?istantanea mancante}"
    # Qui `overwrite: true` e' voluto: si rimette la zona ESATTAMENTE com'era.
    # Proprio perche' riscrive tutto, chiede una conferma esplicita.
    [ "${CONFERMA:-}" = "si" ] || { echo "Il ripristino riscrive l'intera zona: rilancia con CONFERMA=si." >&2; exit 1; }
    verifica_proprieta
    CORPO=$(node -e 'const z=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const r=Array.isArray(z)?z:(z.zone||z.records||[]);
      console.log(JSON.stringify({overwrite:true,zone:r.map(x=>({name:x.name,type:x.type,ttl:x.ttl,records:(x.records||[]).map(y=>({content:y.content}))}))}))' "$FILE")
    curl -fsS -X PUT "${AUTH[@]}" "$API" -d "$CORPO" > /dev/null
    echo "[dns] zona di $DOMINIO riportata all'istantanea $FILE"
    ;;

  *) echo "azione sconosciuta: $AZIONE" >&2; exit 1 ;;
esac
