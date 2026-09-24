#!/usr/bin/env bash
# Dismissione ordinata di un'istanza cliente.
#
#   ./deploy/dismetti-cliente.sh acme --export ./consegne/
#   ./deploy/dismetti-cliente.sh acme --conferma-distruzione
#
# L'ORDINE non è negoziabile, ed è il motivo per cui questo è uno script e non
# una lista di comandi da ricordare:
#
#   1. DNS per PRIMO. Un record che punta a un indirizzo non più nostro è un
#      sottodominio che chiunque può rivendicare, e resta a nome del prodotto.
#   2. Export finale PRIMA di spegnere: dopo, i dati non ci sono più.
#   3. Distruzione solo con --conferma-distruzione, mai per scivolamento.
#   4. Backup all'ultimo: sopravvivono alla retention concordata, non un giorno
#      di più (fine del trattamento, GDPR).
set -euo pipefail

RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"

SLUG="${1:?Uso: dismetti-cliente.sh <slug> [--export <cartella>] [--conferma-distruzione]}"
shift
EXPORT=""; DISTRUGGI=0
while [ $# -gt 0 ]; do
  case "$1" in
    --export) EXPORT="$2"; shift 2 ;;
    --conferma-distruzione) DISTRUGGI=1; shift ;;
    *) echo "argomento sconosciuto: $1" >&2; exit 1 ;;
  esac
done

FLEET="${FLEET:-deploy/fleet.txt}"
RIGA="$(grep -E "^$SLUG\b" "$FLEET" 2>/dev/null || true)"
[ -n "$RIGA" ] || { echo "ERRORE: '$SLUG' non è in $FLEET" >&2; exit 1; }
read -r _ HOST PERCORSO DOMINIO <<< "$RIGA"
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 "$HOST")

echo "Dismissione di '$SLUG' ($DOMINIO, $HOST)"
[ "$DISTRUGGI" = 1 ] || echo "  (modalità sicura: senza --conferma-distruzione non si cancella nulla)"

# ── 1. DNS per primo: anti-rivendicazione del sottodominio ───────────────────
echo ""
echo "[1/6] rimozione del record DNS"
if [ "$DISTRUGGI" = 1 ]; then
  bash deploy/dns-hostinger.sh rimuovi "$SLUG"
else
  echo "      [sicura] ./deploy/dns-hostinger.sh rimuovi $SLUG"
fi

# ── 2. Export finale, finché i dati ci sono ancora ───────────────────────────
echo "[2/6] export finale"
if [ -n "$EXPORT" ]; then
  mkdir -p "$EXPORT"
  DEST="$EXPORT/${SLUG}-$(date -u +%F).dump"
  "${SSH[@]}" "cd '$PERCORSO' && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec -T db \
     pg_dump -U finbeacon -d finbeacon --format=custom" > "$DEST"
  chmod 600 "$DEST"
  echo "      salvato in $DEST ($(du -h "$DEST" | cut -f1))"
  echo "      NOTA: contiene dati personali dei clienti dello studio. Consegnarlo"
  echo "            su canale sicuro e cancellarlo appena consegnato."
else
  echo "      saltato (nessun --export). Se il cliente li chiederà dopo, non ci saranno più."
fi

# ── 3. Monitoraggio: prima di spegnere, o arriva una raffica di allarmi ──────
echo "[3/6] rimozione dal monitoraggio"
if [ "$DISTRUGGI" = 1 ]; then
  bash deploy/registra-monitor.sh --rimuovi "$SLUG" || echo "      (da rimuovere a mano dal control plane)"
else
  echo "      [sicura] ./deploy/registra-monitor.sh --rimuovi $SLUG"
fi

# ── 4. Spegnimento dello stack ──────────────────────────────────────────────
echo "[4/6] spegnimento"
if [ "$DISTRUGGI" = 1 ]; then
  # Senza --remove-orphans: su una macchina condivisa porterebbe via i
  # container di altri progetti (GUASTI G-01).
  "${SSH[@]}" "cd '$PERCORSO' && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod down -v"
else
  echo "      [sicura] docker compose ... down -v"
fi

# ── 5. Distruzione del server ───────────────────────────────────────────────
echo "[5/6] server Hetzner"
if [ "$DISTRUGGI" = 1 ]; then
  hcloud server delete "finbeacon-$SLUG"
  hcloud ssh-key delete "finbeacon-$SLUG" 2>/dev/null || true
else
  echo "      [sicura] hcloud server delete finbeacon-$SLUG"
fi

# ── 6. Registro ─────────────────────────────────────────────────────────────
echo "[6/6] registro della flotta"
if [ "$DISTRUGGI" = 1 ]; then
  grep -vE "^$SLUG\b" "$FLEET" > "$FLEET.tmp" && mv "$FLEET.tmp" "$FLEET"
  echo "      riga rimossa da $FLEET"
fi

cat <<FINE

── Da fare a mano, non automatizzabile ─────────────────────────────────────
   • I BACKUP restano sullo Storage Box: vanno cancellati alla scadenza della
     retention concordata, non prima (potrebbero servire) e non dopo (fine del
     trattamento). Sub-account: backup/$SLUG
   • Annotare nel registro interno: data, chi ha dismesso, conferma delle
     cancellazioni. Serve come evidenza se il cliente chiede conto dei dati.
   • Verificare fra qualche minuto che $DOMINIO non risolva più.
FINE
