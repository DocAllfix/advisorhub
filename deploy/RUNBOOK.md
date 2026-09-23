# RUNBOOK — attivare, aggiornare e dismettere un'istanza cliente

Procedura operativa. Da seguire **alla lettera**: ogni passo ha una verifica, e non
si prosegue finché non dà il risultato atteso.

Se un passo fallisce, il rimedio è quasi sempre in [GUASTI.md](GUASTI.md), citato
come `G-nn`. Se incontri un guasto nuovo, **aggiungilo lì**: questo registro vale
quanto chi lo tiene aggiornato.

Modello: **un server Hetzner per cliente**, sottodominio sul nostro dominio-brand,
TLS automatico. Il cliente non configura nulla.

---

## 0. Prerequisiti (una tantum, prima del primo cliente)

- [ ] **Dominio-brand registrato** e pannello DNS Hostinger accessibile.
      Il dominio-brand di questo prodotto e' **`finbeacon.it`** (l'account ha anche
      `finbeacon.eu`, non usato). Dove sotto compare `<dominio-brand>`, si legge
      `finbeacon.it`; gli script lo hanno gia' come valore predefinito.
- [ ] Record **CAA** sul dominio: `0 issue "letsencrypt.org"`.
- [ ] **Progetti Hetzner separati**: uno per il prodotto, uno chiamato `backup` con
      la Storage Box. Token distinti — `hcloud` gestisce anche le Storage Box, e un
      token unico potrebbe cancellare server **e** backup insieme, scavalcando la
      chiave append-only messa apposta per impedirlo.
- [ ] **Storage Box** attiva, con un **sub-account per cliente**.
- [ ] **Control plane** (VPS nostra): GlitchTip + Uptime Kuma + Beszel, con notifiche.
- [ ] **Casella di posta sul dominio-brand** (vedi §0.1). Arriva col dominio
      Hostinger: non serve un fornitore transazionale in più.
- [ ] Token nel gestore di password, mai nel repository:
      `HCLOUD_TOKEN`, `HCLOUD_TOKEN_BACKUP`, `HOSTINGER_API_TOKEN`, `GLITCHTIP_TOKEN`,
      `KUMA_TOKEN`, credenziali SMTP.
- [ ] Firewall Hetzner `advisorhub-cliente`: 22 solo dal nostro IP, 80/443 aperte.

### 0.1 Posta — il passo che nel riferimento non è scritto da nessuna parte

Nel `RUNBOOK.md` di WhistleVault la parola «smtp» compare **zero volte**, eppure
l'onboarding si aspetta cinque variabili esportate a mano. Chi installa senza
saperlo lascia `SMTP_HOST` vuoto, le mail non partono, **e non c'è alcun errore**:
il recupero password smette di funzionare in silenzio. Qui è scritto.

**La posta arriva col dominio.** Registrando il dominio-brand su Hostinger si ha
già SMTP, e SPF/DKIM/DMARC si configurano nello stesso pannello che gestisce la
zona DNS. Hostinger è lituana, quindi la giurisdizione UE c'è senza aggiungere un
fornitore, un account e una fattura.

Una tantum, quando si registra il dominio:

- [ ] pannello Hostinger → **Email** → casella `ops@<dominio-brand>`
- [ ] alias `no-reply@`, `postmaster@`, `abuse@`, `dmarc@`
- [ ] **verificare** che SPF, DKIM e DMARC siano attivi sulla zona. Il pannello li
      mette da sé, ma vanno guardati: senza DKIM i messaggi finiscono nello spam, e
      il gate del recupero password fallisce per una ragione che non sembra tecnica
- [ ] credenziali della casella in `~/.config/flotta/hostinger.env`, **accanto al
      token DNS** e non in un file a parte

Ogni istanza riceve poi, nel suo `.env.prod`:

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=ops@<dominio-brand>
SMTP_PASSWORD=<dal gestore di password>
SMTP_FROM=no-reply@<dominio-brand>
```

**Un limite da conoscere, non da subire.** Se la casella è una sola, tutte le
istanze usano le stesse credenziali: una VPS compromessa manderebbe posta a nome
del dominio, bruciando la reputazione del mittente per l'intera flotta. Se il piano
Hostinger consente più caselle, **una per istanza**. Se non lo consente, si accetta
sapendolo — e la sentinella sorveglia la coda di posta per invii anomali. Nel
riferimento questa scelta non è stata presa: è stata subita.

**Alternativa**: lo studio che vuole i messaggi dal proprio dominio fornisce il suo
SMTP. Attenzione, Microsoft 365 e Google Workspace disattivano l'autenticazione di
base per impostazione predefinita: serve una password per applicazione, cioè una
telefonata col loro informatico e non un campo da compilare.

---

## 1. Attivare un cliente

### 1.1 Un comando

```bash
export IMMAGINE=ghcr.io/<org>/advisorhub:<git-sha>
./deploy/provision-cliente.sh acme \
  --studio "Studio Rossi & Associati" \
  --email referente@studiorossi.it
```

Prima di eseguirlo sul serio, guardare il piano:

```bash
./deploy/provision-cliente.sh acme --studio "..." --email "..." --dry-run
```

Quindici passi, **stop al primo che non torna**. Rieseguirlo ripara ciò che manca
senza rigenerare i segreti.

|     | Passo                                        | Nota                                                             |
| --- | -------------------------------------------- | ---------------------------------------------------------------- |
| 1   | validazione slug e inventario                | lo slug finisce nel dominio: solo `a-z0-9-`                      |
| 2   | chiave SSH dedicata                          | una per istanza: revocarne una non tocca le altre                |
| 3   | server con cloud-init                        | nasce già blindato, nessuna finestra esposta                     |
| 4   | firewall Hetzner                             | difesa primaria; UFW è in profondità                             |
| 5   | record DNS                                   | `overwrite: false` + istantanea + conteggio (**G-27**, vedi 1.3) |
| 6   | attesa propagazione                          | senza DNS il TLS non viene emesso                                |
| 7   | sub-account Storage Box                      | chiave **append-only** sul server cliente                        |
| 8   | segreti                                      | `openssl rand`, `chmod 600`, mai rigenerati se esistono          |
| 9   | registrazione sul control plane              | progetto GlitchTip **per cliente**, non per prodotto             |
| 10  | avvio dello stack                            | `pull` di un'immagine già costruita, niente build a bordo        |
| 11  | titolare + mail di primo accesso             | **nessuna password consegnata a mano**                           |
| 12  | cron                                         | backup, prova di ripristino, sentinella                          |
| 13  | primo backup **e prima prova di ripristino** | subito, non «quando capita»                                      |
| 14  | verifica                                     | salute + intestazioni di sicurezza                               |
| 15  | registro della flotta                        | `deploy/fleet.txt`                                               |

### 1.2 Il cancello che non si salta

> **La mail di primo accesso deve essere arrivata davvero.**

Il titolare nasce con una password casuale che **nessuno conosce**: se la mail non
arriva, non può entrare e non può nemmeno recuperare. Verificare nella casella del
referente, **spam compreso**, prima di dichiarare l'istanza attiva.

Se non è arrivata, la coda dice il perché — non il relay:

```bash
ssh root@<ip> "cd /opt/advisorhub && docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod exec -T db psql -tA -U advisorhub -d advisorhub \
  -c \"select destinatario, tentativi, ultimo_errore from mail_outbox where inviata_at is null;\""
```

### 1.3 Il passo più pericoloso di tutto il deploy

Il **record DNS**. L'API Hostinger accetta `overwrite`: con `true` **sostituisce
l'intera zona**, cancellando i record di ogni cliente già attivo. Un comando solo
mette offline tutta la flotta.

`dns-hostinger.sh` usa sempre `overwrite: false`, salva un'istantanea della zona
prima di scrivere e conta i record dopo. Un'istantanea fa **ripristinare**, un
conteggio fa **accorgere**: servono entrambi.

### 1.4 Verifica finale, a mano

```bash
curl -fsS https://acme.<dominio-brand>/api/health          # {"status":"ok","db":"up"}
./deploy/security-headers-check.sh https://acme.<dominio-brand>
```

---

## 2. Aggiornare la flotta

```bash
IMMAGINE=ghcr.io/<org>/advisorhub:<git-sha> ./deploy/update-fleet.sh
IMMAGINE=... ./deploy/update-fleet.sh --solo acme          # una sola istanza
```

Una istanza per volta, **stop al primo fallimento**: mai propagare una versione
rotta a tutta la flotta. Cinque cancelli per istanza:

1. **backup preventivo** — se l'aggiornamento va male, il punto di ritorno è di
   pochi minuti fa e non di stanotte;
2. tiraggio dell'immagine;
3. migrazioni e riavvio (le migrazioni girano **prima** del web);
4. salute profonda — verifica anche il database;
5. intestazioni di sicurezza + **la versione servita è davvero quella nuova**.

L'ultimo controllo non è pedanteria: un `pull` fallito in silenzio passerebbe
altrimenti per aggiornamento riuscito.

---

## 3. Ogni giorno

```bash
ssh root@<ip> "cd /opt/advisorhub && docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod ps"
curl -fsS https://acme.<dominio-brand>/api/health
```

Ma la gestione quotidiana **non si fa in SSH**: la fa la sentinella, ogni dieci
minuti, e parla solo quando c'è qualcosa da dire. Se il control plane tace ed è
tutto verde, non c'è niente da guardare.

---

## 4. Disastro: ripristinare un'istanza

**RPO 24 h · RTO ≤ 2 h.**

1. Nuovo server: `./deploy/provision-cliente.sh acme --studio "..." --email "..."`
   (lo slug è lo stesso: il DNS punterà al nuovo indirizzo).
2. Recuperare l'ultimo snapshot con la chiave **piena** (dal control plane, non
   dal server cliente — quella lì è append-only):
   ```bash
   restic restore latest --tag acme --target ./ripristino/
   ```
3. Rimettere `.env.prod` dal backup: contiene `BETTER_AUTH_SECRET`. **Senza, tutte
   le sessioni cadono e nessuno rientra** — è l'equivalente del pepper di WhistleVault.
4. Fermare il web, caricare il dump, riavviare:
   ```bash
   docker compose ... stop web posta
   docker compose ... exec -T db pg_restore -U advisorhub -d advisorhub --clean < db.dump
   docker compose ... up -d
   ```
5. Verificare con §1.4, poi **un accesso reale** e **un download del report**.

---

## 5. Dismettere un cliente

```bash
./deploy/dismetti-cliente.sh acme --export ./consegne/          # prova, non cancella
./deploy/dismetti-cliente.sh acme --export ./consegne/ --conferma-distruzione
```

L'ordine non è negoziabile ed è il motivo per cui è uno script:

1. **DNS per primo** — un record che punta a un indirizzo non più nostro è un
   sottodominio che chiunque può rivendicare, a nome del prodotto;
2. export finale **prima** di spegnere;
3. rimozione dal monitoraggio (o arriva una raffica di allarmi);
4. spegnimento — **mai `--remove-orphans`** su una macchina condivisa (**G-01**);
5. distruzione del server;
6. i **backup** si cancellano alla scadenza della retention concordata: non prima
   (potrebbero servire), non dopo (fine del trattamento).

---

## 6. Prima di rilasciare una versione

```bash
pnpm lint && pnpm test                      # 143 test del motore
pnpm --filter web test:e2e                  # 16 end-to-end sulla build standalone
bash deploy/check-no-secrets.sh             # deve stampare "pulito"
```

E sull'immagine costruita, **guardando dentro** e non nella cartella locale
(**G-14**, **G-20**):

```bash
docker run --rm --entrypoint sh <immagine> -c 'ls -A /app/apps/web'
docker image inspect <immagine> --format '{{range .Config.Env}}{{println .}}{{end}}'
```

Nel primo non devono comparire `src`, `e2e`, file di configurazione o `packages`.
Nel secondo **nessun segreto**: le variabili di un'immagine si leggono senza
avviarla, anche da un registry privato.

---

## 7. Quando qualcosa non torna

Nell'ordine, prima di formulare ipotesi:

| Sintomo                                   | Prima cosa da guardare                                         |
| ----------------------------------------- | -------------------------------------------------------------- |
| Una mail non arriva                       | `ultimo_errore` in `mail_outbox`, **non** il relay (**G-23**)  |
| Le migrazioni «riescono» ma il DB è vuoto | conta le tabelle, non fidarti dell'uscita (**G-05**)           |
| Il PDF si rompe solo in produzione        | percorso dei font nella build standalone (**G-09**)            |
| Un container muore e riparte              | `RestartCount`, non lo stato: «running» nasconde un crash-loop |
| Un test fallisce solo nella suite         | limitatore di frequenza o cookie `Secure` su http (**G-24**)   |
| Un esito sorprende                        | l'orario del file di log e che sia tuo (**G-22**)              |
| La pulizia Docker non libera spazio       | misura **dopo** `wsl --shutdown` (**G-21**)                    |

Le due regole che coprono metà di questo registro:

> **Il nome di un file non è una prova di dove stai scrivendo.**
> **Un successo dichiarato non è un successo verificato — e una verifica fatta
> bene può essere fatta troppo presto.**
