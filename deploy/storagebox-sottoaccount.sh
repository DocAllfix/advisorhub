#!/usr/bin/env bash
# Spazio di backup dedicato a un cliente, su Hetzner Storage Box.
#
#   ./deploy/storagebox-sottoaccount.sh crea   acme
#   ./deploy/storagebox-sottoaccount.sh chiave acme      # stampa la chiave append-only
#
# DUE DIFESE SOVRAPPOSTE, e servono entrambe:
#
#   1. Un SUB-ACCOUNT per cliente, con chroot sulla sua cartella. Una chiave
#      rubata da un server non vede i backup degli altri clienti. E' il limite
#      del remote unico di WhistleVault.
#
#   2. Sul server del cliente la chiave SSH e' APPEND-ONLY: puo' scrivere, non
#      cancellare. La chiave piena vive solo sul control plane, che e' l'unico a
#      potare (`restic forget --prune`) e verificare. Chi entra nel server non
#      puo' distruggere i backup — e' la differenza fra un backup e un backup
#      che sopravvive a un ransomware sull'istanza.
#
# La prima difesa blocca il movimento laterale fra clienti, la seconda la
# distruzione. Una sola non basta.
set -euo pipefail

AZIONE="${1:?Uso: storagebox-sottoaccount.sh crea|chiave <slug>}"
SLUG="${2:?slug mancante}"

# NB: niente apostrofi dentro ${var:?...}. Bash li consuma e il messaggio esce
# monco — in certe forme rompe lo script segnalando l'errore decine di righe piu'
# avanti, dove non c'entra niente.
: "${HCLOUD_TOKEN_BACKUP:?Imposta HCLOUD_TOKEN_BACKUP: il token del progetto Hetzner di backup, SEPARATO da quello dei server}"
: "${STORAGEBOX_ID:?Imposta STORAGEBOX_ID (id numerico della Storage Box)}"

API="https://api.hetzner.com/v1/storage_boxes/${STORAGEBOX_ID}"
AUTH=(-H "Authorization: Bearer $HCLOUD_TOKEN_BACKUP" -H "Content-Type: application/json")
CHIAVI="${CHIAVI:-$HOME/.finbeacon/chiavi}"
mkdir -p "$CHIAVI" && chmod 700 "$CHIAVI"

# Perche' un token SEPARATO: `hcloud` gestisce ormai anche le Storage Box.
# Un token unico per server e backup potrebbe cancellare la macchina E i suoi
# backup con lo stesso comando, scavalcando proprio la chiave append-only.

case "$AZIONE" in
  crea)
    PRIV="$CHIAVI/backup-$SLUG"
    if [ ! -f "$PRIV" ]; then
      ssh-keygen -t ed25519 -N "" -C "finbeacon-backup-$SLUG" -f "$PRIV" >/dev/null
      chmod 600 "$PRIV"
      echo "[storagebox] chiave generata: $PRIV"
    else
      echo "[storagebox] chiave gia' presente: $PRIV"
    fi

    # Sub-account con chroot sulla cartella del cliente. `readonly: false` perche'
    # deve poter scrivere; il divieto di cancellare lo impone la restrizione
    # sulla chiave, non il sub-account.
    echo "[storagebox] creazione del sub-account backup/$SLUG"
    curl -fsS -X POST "${AUTH[@]}" "$API/subaccounts" -d "$(printf '{
      "home_directory": "backup/%s",
      "access_settings": {
        "reachable_externally": false,
        "readonly": false,
        "samba_enabled": false,
        "ssh_enabled": true,
        "webdav_enabled": false
      },
      "description": "finbeacon %s",
      "labels": { "prodotto": "finbeacon", "cliente": "%s" }
    }' "$SLUG" "$SLUG" "$SLUG")" | head -c 400
    echo ""

    cat <<NOTA

[storagebox] Da completare a mano sulla Storage Box (non esposto dall'API):

  In ~/.ssh/authorized_keys del sub-account, la chiave va installata con la
  restrizione che le impedisce di cancellare. Con restic si ottiene limitando il
  comando eseguibile al solo server SFTP in sola aggiunta, oppure — piu' solido —
  usando l'opzione di sola-aggiunta di restic lato repository:

      restic init --repo sftp:<subaccount>@<host>:/backup/$SLUG
      # poi, sul SERVER CLIENTE, usare sempre:
      #   restic backup ...        (consentito)
      # e MAI:
      #   restic forget --prune    (solo dal control plane, con la chiave piena)

  La potatura e la verifica vanno in cron SUL CONTROL PLANE:

      0 5 * * 0  restic -r sftp:...:/backup/$SLUG forget \\
                   --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
      0 6 1 * *  restic -r sftp:...:/backup/$SLUG check --read-data-subset=5%

NOTA
    ;;

  chiave)
    PRIV="$CHIAVI/backup-$SLUG"
    [ -f "$PRIV" ] || { echo "ERRORE: nessuna chiave per '$SLUG' in $CHIAVI" >&2; exit 1; }
    echo "--- chiave privata da installare sul server cliente (chmod 600) ---"
    cat "$PRIV"
    ;;

  *) echo "azione sconosciuta: $AZIONE" >&2; exit 1 ;;
esac
