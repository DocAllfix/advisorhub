#!/usr/bin/env bash
# Verifica esterna delle intestazioni di sicurezza promesse da un'istanza.
#
#   ./deploy/security-headers-check.sh https://acme.advisorhub.it
#
# PASS/FAIL su ciascuna, exit 1 se ne manca almeno una. E' un CANCELLO, non un
# rapporto: lo usa update-fleet.sh per fermare un aggiornamento che le fa
# regredire, e provision-cliente.sh prima di dichiarare un'istanza pronta.
#
# Portato da WhistleVault, con due aggiunte: la CSP viene cercata davvero (nel
# loro controllo non c'era, pur essendo promessa) e si verifica che l'istanza
# non sia indicizzabile.
#
# Con `-k` si accetta un certificato autofirmato: serve per collaudare in locale
# con `tls internal`.
set -uo pipefail

URL="${1:?Uso: security-headers-check.sh <url> [-k]}"
CURL=(curl -fsSI -m 15)
[ "${2:-}" = "-k" ] && CURL+=(-k)

HDRS="$("${CURL[@]}" "$URL" 2>/dev/null)" || {
  echo "ERRORE: $URL non risponde"
  exit 1
}

ERR=0
serve() { # serve <intestazione> [frammento-atteso]
  local riga
  riga="$(printf '%s\n' "$HDRS" | grep -i "^$1:" | head -1)"
  if [ -z "$riga" ]; then
    echo "  FAIL  $1 — assente"
    ERR=$((ERR + 1))
    return
  fi
  if [ -n "${2:-}" ] && ! printf '%s' "$riga" | grep -qi -- "$2"; then
    echo "  FAIL  $1 — valore inatteso: ${riga#*: }"
    ERR=$((ERR + 1))
    return
  fi
  echo "  OK    $1"
}

echo "=== intestazioni di sicurezza: $URL — $(date -u +%FT%TZ) ==="
serve Strict-Transport-Security "max-age="
serve Content-Security-Policy "default-src 'self'"
serve Content-Security-Policy "frame-ancestors 'none'"
serve X-Content-Type-Options "nosniff"
serve X-Frame-Options "DENY"
serve Referrer-Policy "strict-origin"
serve Permissions-Policy
serve Cross-Origin-Opener-Policy "same-origin"
# Nessuna istanza cliente deve comparire nei motori di ricerca.
serve X-Robots-Tag "noindex"

# Non deve dichiarare la tecnologia: e' ricognizione gratuita per un attaccante.
if printf '%s\n' "$HDRS" | grep -qiE '^(server|x-powered-by):'; then
  echo "  FAIL  intestazione Server/X-Powered-By presente"
  ERR=$((ERR + 1))
else
  echo "  OK    nessuna intestazione che dichiara la tecnologia"
fi

echo ""
if [ "$ERR" -gt 0 ]; then
  echo "RISULTATO: $ERR intestazioni mancanti — NON dichiarare l'istanza sana"
  exit 1
fi
echo "RISULTATO: tutte presenti"
