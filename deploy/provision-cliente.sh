#!/usr/bin/env bash
# Da "il cliente ha pagato" a "istanza in produzione, verificata e sorvegliata".
#
#   ./deploy/provision-cliente.sh acme --studio "Studio Rossi" --email referente@studiorossi.it
#   ./deploy/provision-cliente.sh acme --dry-run          # stampa il piano, non esegue
#
# Idempotente dove ha senso: rieseguirlo ripara cio' che manca senza rigenerare
# i segreti. Si ferma al PRIMO passo che non torna, lasciando il sistema in uno
# stato ispezionabile — mai a meta' e in silenzio.
#
# Chiavi API attese nell'ambiente (dal gestore di password, mai nel repository):
#   HCLOUD_TOKEN         progetto Hetzner del prodotto
#   HCLOUD_TOKEN_BACKUP  progetto Hetzner separato per la Storage Box
#   HOSTINGER_API_TOKEN  zone DNS del dominio-brand
#   GLITCHTIP_TOKEN KUMA_TOKEN   control plane
#   SMTP_HOST SMTP_USER SMTP_PASSWORD SMTP_FROM   relay condiviso
set -euo pipefail

RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"

# ------------------------------------------------------------------ argomenti
SLUG="${1:-}"; shift || true
STUDIO=""; EMAIL=""; PIANO="${PIANO:-cx22}"; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --studio)  STUDIO="$2"; shift 2 ;;
    --email)   EMAIL="$2";  shift 2 ;;
    --piano)   PIANO="$2";  shift 2 ;;
    --dry-run) DRY=1;       shift ;;
    *) echo "argomento sconosciuto: $1" >&2; exit 1 ;;
  esac
done

DOMINIO_BRAND="${DOMINIO_BRAND:-finbeacon.it}"
REGIONE="${REGIONE:-nbg1}"          # Norimberga: UE, per il GDPR
IMMAGINE="${IMMAGINE:?Imposta IMMAGINE (es. ghcr.io/org/advisorhub:<git-sha>)}"
FLEET="deploy/fleet.txt"

passo() { echo ""; echo "── $1"; }
fatale() { echo "ERRORE: $1" >&2; exit 1; }
esegui() { if [ "$DRY" = 1 ]; then echo "    [dry-run] $*"; else "$@"; fi; }

# ------------------------------------------------------- 1. validazione slug
passo "1/15  validazione"
echo "$SLUG" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' \
  || fatale "slug non valido '$SLUG' (solo a-z, 0-9, trattino; non ai bordi)"
[ -n "$STUDIO" ] || fatale "--studio e' obbligatorio"
[ -n "$EMAIL" ]  || fatale "--email del referente e' obbligatoria: senza, il titolare non puo' impostare la password ne' recuperarla"
if [ -f "$FLEET" ] && grep -qE "^$SLUG\b" "$FLEET"; then
  fatale "'$SLUG' e' gia' in $FLEET — usa un altro slug o dismetti l'istanza esistente"
fi
DOMINIO="${SLUG}.${DOMINIO_BRAND}"
echo "    dominio: $DOMINIO   piano: $PIANO   regione: $REGIONE"

for C in hcloud curl ssh openssl dig; do command -v "$C" >/dev/null || fatale "manca il comando '$C'"; done

# ------------------------------------------------------------- 2. chiave SSH
passo "2/15  chiave SSH dedicata all'istanza"
CHIAVE="$HOME/.ssh/advisorhub-$SLUG"
if [ ! -f "$CHIAVE" ]; then
  esegui ssh-keygen -t ed25519 -N "" -C "advisorhub-$SLUG" -f "$CHIAVE"
  esegui hcloud ssh-key create --name "advisorhub-$SLUG" --public-key-from-file "$CHIAVE.pub"
else
  echo "    esiste gia': $CHIAVE"
fi

# --------------------------------------------------- 3. server con cloud-init
passo "3/15  server Hetzner"
if hcloud server describe "advisorhub-$SLUG" >/dev/null 2>&1; then
  echo "    esiste gia'"
else
  esegui hcloud server create \
    --name "advisorhub-$SLUG" --type "$PIANO" --image ubuntu-24.04 \
    --location "$REGIONE" --ssh-key "advisorhub-$SLUG" \
    --user-data-from-file deploy/cloud-init.yaml \
    --label "prodotto=advisorhub" --label "cliente=$SLUG"
fi
IP="$(hcloud server ip "advisorhub-$SLUG" 2>/dev/null || echo '<ip>')"
echo "    indirizzo: $IP"

# ------------------------------------------------------------- 4. firewall
passo "4/15  firewall"
# 22 solo dal nostro indirizzo di gestione, 80/443 aperte (Let's Encrypt).
esegui hcloud firewall apply-to-resource advisorhub-cliente \
  --type server --server "advisorhub-$SLUG" || echo "    (gia' applicato)"

# ------------------------------------------------------------------ 5. DNS
passo "5/15  record DNS su Hostinger"
esegui bash deploy/dns-hostinger.sh crea "$SLUG" "$IP"

# ------------------------------------------------------- 6. attesa del DNS
passo "6/15  propagazione DNS"
if [ "$DRY" = 0 ]; then
  for _ in $(seq 1 30); do
    [ "$(dig +short "$DOMINIO" | tail -1)" = "$IP" ] && break
    sleep 10
  done
  [ "$(dig +short "$DOMINIO" | tail -1)" = "$IP" ] \
    || fatale "$DOMINIO non risolve a $IP dopo 5 minuti — il TLS non verrebbe emesso"
fi
echo "    $DOMINIO -> $IP"

# ------------------------------------------------- 7. Storage Box del cliente
passo "7/15  spazio di backup dedicato"
# Un sub-account per cliente: una chiave rubata non vede i backup degli altri.
# La chiave su questa macchina sara' APPEND-ONLY (potatura solo dal control plane).
esegui bash deploy/storagebox-sottoaccount.sh crea "$SLUG"

# --------------------------------------------------------------- 8. segreti
passo "8/15  segreti dell'istanza"
ENV_REMOTO="/opt/advisorhub/deploy/.env.prod"
if [ "$DRY" = 0 ]; then
  SSH=(ssh -i "$CHIAVE" -o StrictHostKeyChecking=accept-new "root@$IP")
  if "${SSH[@]}" "test -f $ENV_REMOTO"; then
    echo "    esiste gia' — NON lo rigenero (i segreti cambierebbero sotto i piedi)"
  else
    "${SSH[@]}" "mkdir -p /opt/advisorhub/deploy"
    "${SSH[@]}" "cat > $ENV_REMOTO && chmod 600 $ENV_REMOTO" <<EOF
SLUG=$SLUG
DOMINIO=$DOMINIO
ACME_EMAIL=${ACME_EMAIL:-tecnico@$DOMINIO_BRAND}
IMMAGINE=$IMMAGINE
GIT_SHA=${IMMAGINE##*:}
POSTGRES_USER=advisorhub
POSTGRES_PASSWORD=$(openssl rand -hex 24)
POSTGRES_DB=advisorhub
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=${SMTP_USER:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
SMTP_FROM=${SMTP_FROM:-no-reply@$DOMINIO_BRAND}
CADDY_TLS=
EOF
    echo "    generato (chmod 600), segreti casuali"
  fi
fi

# ---------------------------------------------- 9. registrazione sul control plane
passo "9/15  progetto GlitchTip, monitor Kuma, nodo Beszel"
esegui bash deploy/registra-monitor.sh "$SLUG" "$DOMINIO"

# ---------------------------------------------------------- 10. avvio stack
passo "10/15  avvio dello stack"
if [ "$DRY" = 0 ]; then
  "${SSH[@]}" "cd /opt/advisorhub && \
    docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod pull && \
    docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d"
fi

# ------------------------------------------------------------ 11. titolare
passo "11/15  titolare e mail di primo accesso"
# REGISTRAZIONE_APERTA vale solo per QUESTO container una-tantum: il server
# pubblico resta chiuso. Nessuna password viene consegnata a mano.
if [ "$DRY" = 0 ]; then
  "${SSH[@]}" "cd /opt/advisorhub && \
    docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod \
    run --rm -e REGISTRAZIONE_APERTA=true web \
    node apps/web/crea-titolare.js '$STUDIO' '$EMAIL'"
fi

# ---------------------------------------------------------------- 12. cron
passo "12/15  backup, prova di ripristino, sentinella"
if [ "$DRY" = 0 ]; then
  "${SSH[@]}" "cat > /etc/cron.d/advisorhub <<'CRON'
15 2 * * * root cd /opt/advisorhub && ./deploy/backup.sh >> /var/log/advisorhub-backup.log 2>&1
0 4 1 * * root cd /opt/advisorhub && ./deploy/restore-test.sh >> /var/log/advisorhub-restore.log 2>&1
*/10 * * * * root cd /opt/advisorhub && ./deploy/sentinella.sh >> /var/log/advisorhub-sentinella.log 2>&1
CRON
chmod 644 /etc/cron.d/advisorhub"
fi

# ------------------------------------ 13. primo backup e prima prova di ripristino
passo "13/15  primo backup + prima prova di ripristino"
# Subito, non "quando capita": un backup mai provato non e' un backup.
if [ "$DRY" = 0 ]; then
  "${SSH[@]}" "cd /opt/advisorhub && ./deploy/backup.sh" || fatale "primo backup fallito"
  "${SSH[@]}" "cd /opt/advisorhub && ./deploy/restore-test.sh" || fatale "prova di ripristino fallita: NON dichiarare l'istanza pronta"
fi

# ------------------------------------------------------------ 14. smoke-test
passo "14/15  verifica"
if [ "$DRY" = 0 ]; then
  for _ in $(seq 1 18); do
    curl -fsS "https://$DOMINIO/api/health" 2>/dev/null | grep -q '"ok"' && break
    sleep 10
  done
  curl -fsS "https://$DOMINIO/api/health" | grep -q '"ok"' || fatale "/api/health non risponde ok"
  bash deploy/security-headers-check.sh "https://$DOMINIO" || fatale "intestazioni di sicurezza mancanti"
  echo "    salute ok, intestazioni ok"
fi

# -------------------------------------------------------------- 15. registro
passo "15/15  registro della flotta"
if [ "$DRY" = 0 ]; then
  printf '%s\t%s\t%s\t%s\n' "$SLUG" "root@$IP" "/opt/advisorhub" "$DOMINIO" >> "$FLEET"
fi

cat <<FINE

── Istanza '$SLUG' pronta ──────────────────────────────────────────────
   indirizzo      https://$DOMINIO
   referente      $EMAIL   (ha ricevuto la mail per impostare la password)
   immagine       $IMMAGINE
   backup         notturno 02:15, ripristino provato il giorno 1 del mese
   sorveglianza   sentinella ogni 10 minuti + Kuma + GlitchTip

   Restano da fare a mano:
     - consegnare al referente l'indirizzo e le istruzioni di primo accesso
     - verificare CHE LA MAIL SIA ARRIVATA (anche nello spam): senza, il
       titolare non puo' entrare e non puo' recuperare
FINE
