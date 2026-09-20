#!/usr/bin/env bash
# Gate anti-fuga di segreti. Gira in CI su ogni push e va eseguito PRIMA di ogni
# tag di release. Esce con 1 (e blocca) se nel repository tracciato c'e'
# materiale che non deve uscire. I segnaposto dichiarati sono ammessi.
#
# Portato da WhistleVault (deploy/check-no-secrets.sh) e adattato a TypeScript.
#
#   bash deploy/check-no-secrets.sh
set -uo pipefail
cd "$(dirname "$0")/.."

ERR=0
fail() { echo "  FAIL  $1"; ERR=$((ERR + 1)); }
ok()   { echo "  OK    $1"; }

echo "=== check-no-secrets ==="

# 1. Nessun file .env reale tracciato (gli .example sono ammessi).
ENVS=$(git ls-files | grep -E '(^|/)\.env(\.[A-Za-z0-9._-]+)?$' | grep -v -E '\.example$' || true)
if [ -n "$ENVS" ]; then
  fail ".env tracciati da git: $(echo "$ENVS" | tr '\n' ' ')"
else
  ok "nessun file .env tracciato"
fi

# 2. Nessuna chiave privata.
KEYS=$(git grep -l -E 'BEGIN (RSA |OPENSSH |EC |PGP )?PRIVATE KEY' -- . ':!deploy/check-no-secrets.sh' 2>/dev/null || true)
if [ -n "$KEYS" ]; then
  fail "blocchi PRIVATE KEY nel repository: $(echo "$KEYS" | tr '\n' ' ')"
else
  ok "nessuna chiave privata"
fi

# 3. Segreti che sembrano reali: esadecimale >= 32 assegnato a *SECRET/*TOKEN/
#    *PASSWORD/*KEY. I valori dichiarati per CI e sviluppo non sono esadecimali
#    e quindi non corrispondono.
HITS=$(git grep -nE '(SECRET|TOKEN|PASSWORD|APIKEY|API_KEY)[A-Za-z_]*"?\s*[:=]\s*"?[0-9a-fA-F]{32,}' \
  -- . ':!*.example' ':!pnpm-lock.yaml' ':!deploy/check-no-secrets.sh' 2>/dev/null || true)
if [ -n "$HITS" ]; then
  fail "possibili segreti esadecimali nel codice:"
  echo "$HITS" | sed 's/^/        /'
else
  ok "nessun segreto esadecimale sospetto"
fi

# 4. Stringhe di connessione con password incorporata.
#    Escluse quelle verso la macchina stessa o un servizio della rete Docker:
#    una credenziale conta solo se indirizza un host reale, e i segnaposto di
#    CI e sviluppo puntano sempre a localhost.
DSN=$(git grep -nE 'postgres(ql)?://[A-Za-z0-9._%-]+:[^<@[:space:]"]{6,}@' \
  -- . ':!*.example' ':!deploy/check-no-secrets.sh' ':!deploy/*.md' 2>/dev/null \
  | grep -vE '@(localhost|127\.0\.0\.1|\[::1\]|db|postgres):' || true)
if [ -n "$DSN" ]; then
  fail "stringhe di connessione con password:"
  echo "$DSN" | sed 's/^/        /'
else
  ok "nessuna stringa di connessione con password"
fi

# 5. Documenti d'ufficio: spesso contengono credenziali e contratti.
DOCS=$(git ls-files | grep -Ei '\.(docx?|xlsx?)$' || true)
if [ -n "$DOCS" ]; then
  fail "documenti d'ufficio tracciati: $(echo "$DOCS" | tr '\n' ' ')"
else
  ok "nessun documento d'ufficio tracciato"
fi

# 6. Credenziali in chiaro negli script di seed: devono venire dall'ambiente.
SEED=$(git grep -nE 'const (PASSWORD|ADMIN_PASSWORD)\s*=\s*"[^"]+"' -- 'apps/web/src/lib/seed*.ts' 2>/dev/null \
  | grep -v 'process\.env' || true)
if [ -n "$SEED" ]; then
  fail "password in chiaro negli script di seed:"
  echo "$SEED" | sed 's/^/        /'
else
  ok "seed senza password fisse"
fi

# 7. Bundle dei container: nessun segreto impacchettato (vedi GUASTI G-20 —
#    le variabili di un'immagine si leggono senza avviarla).
for F in apps/web/worker.js apps/web/migra.js; do
  [ -f "$F" ] || continue
  if grep -qE 'BETTER_AUTH_SECRET\s*[:=]\s*"[^"]{8,}"|postgres(ql)?://[^:]+:[^@]{6,}@' "$F"; then
    fail "possibile segreto dentro $F"
  else
    ok "bundle $F pulito"
  fi
done

echo ""
if [ "$ERR" -gt 0 ]; then
  echo "RISULTATO: $ERR problemi — NON rilasciare finche' non sono risolti"
  exit 1
fi
echo "RISULTATO: pulito"
