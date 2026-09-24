# GUASTI — catalogo dei problemi incontrati e dei rimedi

Registro vivo. Ogni voce nasce da un guasto **realmente accaduto**, non da un'ipotesi.
Chi incontra un problema nuovo aggiunge una voce in fondo, con lo stesso schema.

Convenzione condivisa con i progetti `gdprhub` e `flowcrm`: stesso nome di file, stessa
numerazione `G-nn` per prodotto. Le voci marcate _(da gdprhub)_ / _(da flowcrm)_ arrivano
dalle sessioni parallele: le teniamo perché quei prodotti hanno percorso prima di noi la
parte di deploy, e i loro guasti sono i nostri di domani.

Due regole attraversano metà di questo elenco:

> **1. Il nome di un file non è una prova di dove stai scrivendo.**
> Prima di ogni comando che scrive su un database, stampa il bersaglio.
>
> **2. Un successo dichiarato non è un successo verificato.**
> Dopo ogni passo, misura l'effetto: conta le tabelle, scarica il file, leggi l'header.

> **Nota sui nomi (24/09/2026).** Fino a questa data il nome tecnico del prodotto era
> `advisorhub`: pacchetti, progetti Docker (`advisorhub`, `advisorhub-dev`), utente e database
> Postgres, percorsi sui server. Oggi è `finbeacon` ovunque, come il marchio. **Le voci scritte prima
> citano i nomi com'erano allora**, e restano così di proposito: sono il resoconto di ciò che è
> successo. Nei comandi da copiare, sostituisci `advisorhub` con `finbeacon`.

---

## G-01 — Due progetti si sovrascrivono i container a vicenda

**Sintomo.** Il database di sviluppo si svuota da solo. Postgres risponde
`FATAL: role "advisorhub" does not exist` su un container che un minuto prima funzionava.
Nessun errore, nessun avviso.

**Perché inganna.** Docker Compose deriva il nome del progetto dalla **cartella** che
contiene il file. Tutti e tre i prodotti tengono i compose in `deploy/`, quindi per Docker
sono tutti il progetto `deploy` e condividono lo spazio dei nomi dei container. Un
`docker compose up` altrui non fallisce: **ricrea** il servizio omonimo con la propria
configurazione, e il volume riparte da zero.

**Diagnosi.**

```bash
docker inspect <container> --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}'
```

Se stampa il percorso di un altro progetto, quel container non è più tuo.

**Rimedio.** Nome di progetto esplicito, prima riga del compose:

```yaml
name: advisorhub-dev # convenzione condivisa: <prodotto>-<ambiente>

services:
  db:
    image: postgres:17-alpine
```

**Trappola collegata** _(da flowcrm)_. Con più file `-f`, vince il `name:` dell'**ultimo**.
Un compose di base che dichiara già un `name:` proprio (quello upstream di Supabase dichiara
`name: supabase`) annulla la correzione in silenzio se l'ordine dei `-f` è invertito.
L'ordine dei `-f` scritto nel runbook non è estetico.

**Conseguenza da non sottovalutare** _(da gdprhub)_. Uno script di backup che ricava il nome
del volume da `COMPOSE_PROJECT_NAME` non fallisce con un nome dedotto male: **salva una
cartella vuota**. Il backup "riesce" ogni notte e non contiene nulla.

---

## G-02 — `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Sintomo.** `docker compose up` si ferma sul primo servizio che pubblica una porta già presa.

**Perché inganna.** Su una macchina condivisa fra più prodotti, le porte standard
(5432 Postgres, 1025/8025 posta, 6379 Redis) sono le prime a collidere. Qui la 5432 era di un
terzo progetto e la 1025 di un Mailpit rimasto orfano.

**Diagnosi.**

```bash
docker ps --format '{{.Names}}\t{{.Ports}}'
netstat -ano | grep ":5432"
```

**Rimedio.** Pubblicare su una porta non standard, lasciando invariata quella interna:

```yaml
ports:
  - "5433:5432"
```

Meglio: in sviluppo non pubblicare le porte che non servono dall'host. In produzione
**solo il reverse proxy** pubblica porte.

---

## G-03 — `node --env-file`: vince l'ULTIMO file

**Sintomo.** Uno script che dovrebbe lavorare in locale si collega al database di **produzione**.

**Perché inganna.** L'ordine sembra dire "prima il più specifico". È il contrario:

```
tsx --env-file-if-exists=.env.local --env-file-if-exists=.env   # vince .env        SBAGLIATO
tsx --env-file-if-exists=.env --env-file-if-exists=.env.local   # vince .env.local  GIUSTO
```

Qui è costato un worker collegato al Postgres di produzione. Ha solo letto e fallito su una
tabella inesistente, ma con un comando di migrazione sarebbe finita diversamente.

**Rimedio.** `.env` per primo, `.env.local` per ultimo: la precedenza di Next.

---

## G-04 — `dotenv`: vince il PRIMO file (l'opposto di G-03)

**Sintomo.** Come G-03, ma in uno script che usa `dotenv` invece dei flag di Node.

**Perché inganna.** `dotenv` **non sovrascrive** una chiave già presente in `process.env`:
la precedenza è rovesciata rispetto a `node --env-file`. Due caricatori nello stesso repo
con regole opposte.

```ts
config({ path: ".env.local" }); // PRIMA il più specifico
config({ path: ".env" }); // -> .env.local vince
```

**Aggravante trovata qui.** `import "dotenv/config"` carica **solo `.env`**. Gli script di
seed lo usavano: su questa macchina `.env` punta al database di produzione, quindi
`pnpm db:seed-demo` vi avrebbe scritto i dati dimostrativi.

**Rimedio.** Caricamento esplicito di entrambi i file, nell'ordine giusto per il caricatore
in uso. Vedi `apps/web/drizzle.config.ts`.

---

## G-05 — `drizzle-kit migrate` dichiara successo senza applicare nulla

**Sintomo.** Il comando stampa `migrations applied successfully!` ed esce con 0. Il database
resta **completamente vuoto**: nessuna tabella, nemmeno lo schema `drizzle`.

**Perché inganna.** È il caso peggiore: un successo dichiarato. Il codice va in produzione
contro uno schema che non esiste, e il guasto si manifesta alla prima query di un utente.

**Diagnosi.** Non fidarsi del messaggio: contare le tabelle subito dopo.

```bash
docker exec <db> psql -U <utente> -d <db> -tA -c \
  "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public';"
```

**Rimedio adottato.** Non si usa la CLI per migrare. `apps/web/src/lib/migra.ts` usa il
migratore di **`drizzle-orm`**, che è una dipendenza di runtime, **stampa host e database
prima di scrivere**, e conta le tabelle dopo:

```
[migra] bersaglio:  localhost:5433/advisorhub
[migra] migrazioni: .../apps/web/drizzle
[migra] fatto: 14 tabelle nello schema public.
```

`drizzle-kit` resta disponibile come `db:migrate:kit`, e per `generate`/`check`, che
funzionano correttamente.

---

## G-06 — `next start` non funziona con `output: "standalone"`

**Sintomo.** Il server parte, stampa `Ready`, e ogni richiesta risponde 500.

**Perché inganna.** L'avviso di Next compare **dopo** la riga `Ready`, quindi scorre via:
`"next start" does not work with "output: standalone" configuration`.

**Rimedio.** Lo script `start` esegue il server standalone:

```bash
node .next/standalone/apps/web/server.js
```

Conseguenza: i test end-to-end vanno eseguiti contro **quello**, non contro `next start`.
È anche più corretto — è l'artefatto che va davvero in produzione.

**Verificato su Next 16.2.11 e 16.3.5.** `public/` viene copiato dentro
`.next/standalone/apps/web/`. `.next/static` invece **va copiato a mano** (lo fa il
Dockerfile). Il comportamento non è cambiato con l'aggiornamento: i sei font del report
erano al loro posto nella build standalone e `report-pdf.spec.ts` è rimasto verde.

**Sulla 16.3.5 la convenzione `middleware` è ancora solo deprecata**, non rimossa: la build
stampa l'avviso e suggerisce il codemod `middleware-to-proxy`, ma compila e l'elenco delle
rotte mostra `ƒ Proxy (Middleware)`. La CSP con nonce per richiesta continua a funzionare
(`salute.spec.ts` verifica nonce, `strict-dynamic` e nonce diverso a ogni richiesta). Il
rename andrà fatto, ma è una scelta, non un'urgenza.

---

## G-07 — La validazione dell'ambiente blocca il collaudo in locale

**Sintomo.** Il server di produzione non parte:
`BETTER_AUTH_URL deve usare https … il cookie di sessione non avrebbe il flag Secure`.

**Perché inganna.** La regola è giusta — su un dominio pubblico in http il cookie di sessione
perde il flag `Secure` — ma il server standalone imposta `NODE_ENV=production` anche quando
si collauda la build su `localhost`.

**Rimedio.** La guardia esenta `localhost`, `127.0.0.1` e `[::1]`, dove il cookie non
attraversa alcuna rete. Vedi `apps/web/src/lib/env.ts`.

---

## G-08 — `MISSING_OR_NULL_ORIGIN` con curl

**Sintomo.** `POST /api/auth/organization/create` risponde 403
`{"code":"MISSING_OR_NULL_ORIGIN"}`, mentre dal browser funziona.

**Perché inganna.** Sembra un problema di permessi o di sessione. È la protezione CSRF di
Better Auth: con `trustedOrigins` configurato, le richieste che modificano stato devono avere
l'header `Origin`. Un browser lo manda sempre, curl no.

**Rimedio.** Negli script di collaudo: `curl -H 'Origin: https://<dominio>' …`
Non è un difetto dell'applicazione: **non** allargare `trustedOrigins` per farlo sparire.

---

## G-09 — Il PDF del report si rompe solo in produzione

**Sintomo.** `GET /api/report/<id>` fallisce nell'immagine, funziona in sviluppo.

**Perché inganna.** Il percorso dei font era composto a runtime
(`path.join(process.cwd(), "src/lib/report/fonts")`), quindi **sfuggiva al file tracing di
Next**, e `src/` non viene copiato in `.next/standalone`. Nessun avviso a build time. È il
deliverable di valore del prodotto: si sarebbe rotto dal primo cliente.

**Rimedio.** I font vivono in `apps/web/public/fonts/report/` (che viene copiato), e
`apps/web/src/lib/report/percorso-font.ts` prova una lista di percorsi candidati, usando il
primo che esiste davvero invece di indovinare la directory di lavoro.

**Verifica obbligatoria di ogni immagine — un download reale:**

```bash
curl -b cookie.txt -o report.pdf "https://<dominio>/api/report/<id>"
head -c 8 report.pdf     # deve iniziare con %PDF
```

Un build verde non dice nulla su questo percorso.

---

## G-10 — `server-only` funziona in Next e si rompe in esbuild

> **Questa voce era scritta male e l'ho corretta il 18 settembre 2026.** Diceva
> «non è installato, quindi non usarlo»: chi l'avesse seguita avrebbe tolto
> import perfettamente funzionanti. La ragione vera è un'altra, ed è più utile.

**Sintomo.** `import "server-only"` **funziona** in quattro file dell'applicazione e la build è
verde, ma il pacchetto **non è nel lockfile** e `require.resolve("server-only")` fallisce. Messo
in un modulo che finisce in un bundle esbuild, non risolve più.

**Perché inganna.** Sembra una dipendenza mancante, e la tentazione è togliere l'import o
installare il pacchetto. In realtà **Next lo risolve internamente** con un proprio alias: dentro
il suo bundler esiste, fuori no.

Quindi la stessa riga si comporta in due modi opposti a seconda di chi compila:

```
apps/web/src/lib/clienti/queries.ts     compilato da Next      -> funziona
apps/web/src/lib/email/mailer.ts        impacchettato da esbuild -> non risolve
```

**Diagnosi.**

```bash
grep -c "server-only" pnpm-lock.yaml                                   # 0: non è una dipendenza
node -e "require.resolve('server-only', {paths:['apps/web']})"         # fallisce
grep -rln '"server-only"' apps/web/src                                # eppure lo importano in 4
```

**Rimedio.** Tenerlo nei moduli compilati da Next — dove fa il suo mestiere, cioè far fallire la
build se un modulo server finisce in un componente client. **Non** metterlo nei moduli destinati
ai bundle esbuild (`migra.ts`, `worker.ts`, `crea-titolare.ts` e ciò che importano): lì va
tolto, e la protezione non serve perché quei file non finiscono mai nel browser.

Se lo si vuole anche lì, va installato come dipendenza vera.

**La lezione più generale**, e vale oltre questo pacchetto: **lo stesso import può risolvere o
no a seconda di chi compila.** Con due compilatori nello stesso repository — Next per
l'applicazione, esbuild per i bundle dei container — l'insieme dei moduli disponibili non è lo
stesso, e la build verde di uno non dice nulla sull'altro.

---

## G-11 — `tsx: command not found`

**Rimedio.** `pnpm exec tsx …`, oppure uno script in `package.json`.

---

## G-12 — Il processo Node muore quando il database si riavvia

**Sintomo** (prevenuto, non subìto). Un errore su una connessione **inattiva** del pool viene
emesso sull'oggetto `Pool`. Senza un ascoltatore, Node lo tratta come evento `error` non
gestito e **termina il processo**: un riavvio del database porterebbe giù l'intera applicazione.

**Rimedio.** `pool.on("error", …)` in `apps/web/src/lib/db.ts`.

**Verificato.** Con `docker stop` del database, `/api/health` passa a **503 `{"db":"down"}`**;
riavviato il database torna **200**, senza riavviare il server.

---

## G-13 — Nell'immagine standalone NON c'è `drizzle-orm` _(da gdprhub)_

**Sintomo.** Il container che applica le migrazioni muore con `ERR_MODULE_NOT_FOUND`. Con
`set -e` nello script di avvio, Docker lo riavvia: **crash-loop muto**. L'applicazione non
serve mai una richiesta. Build verde, compose validato, Dockerfile corretto.

**Perché inganna.** Sembra ovvio che il pacchetto ci sia, "visto che l'applicazione lo
importa". Falso: **Next lo impacchetta dentro `.next/server`, non lo copia in `node_modules`**.

**Verificato anche qui:**

```bash
ls apps/web/.next/standalone/node_modules/                  # vuoto
ls -d apps/web/.next/standalone/node_modules/drizzle-orm    # ASSENTE
ls -d apps/web/.next/standalone/node_modules/pg             # ASSENTE
```

**Rimedio adottato qui — diverso dal loro, e più semplice.** Migratore e worker non sono
script che importano pacchetti a runtime: sono **bundle autosufficienti** prodotti da esbuild.

```bash
pnpm --filter web build:migratore   # -> migra.js   (365 KB)
pnpm --filter web build:worker      # -> worker.js  (794 KB)
```

**Verificato**: entrambi eseguiti con `node` da una cartella **priva di `node_modules`**.
Il migratore ha applicato le 14 tabelle; il worker ha letto la coda e gestito correttamente
il relay irraggiungibile.

Nota utile _(da gdprhub)_: la risoluzione ESM **non guarda `NODE_PATH`** — un modulo si cerca
a partire dalla cartella del file che lo importa. Spostare la variabile d'ambiente non
risolve; impacchettare sì.

---

## G-14 — `.next/standalone` può contenere i tuoi file personali _(da gdprhub)_

**Sintomo.** L'immagine consegnata al cliente contiene `src/`, gli script di collaudo (con
dentro le sequenze di accesso), `playwright.config.ts`, e perfino le evidenze caricate in
sviluppo.

**Perché inganna.** `outputFileTracingExcludes` **non funziona** per questo: la copia della
cartella dell'applicazione non passa dalla tracciatura. Una regola lì dentro è configurazione
decorativa.

**Diagnosi.** Guardare _dentro l'immagine costruita_, non nella cartella locale:

```bash
docker run --rm --entrypoint sh <immagine> -c 'ls -la /app/apps/web'
```

**Rimedio.** `RUN rm -rf` esplicita nello stadio finale del Dockerfile. In più un
`.dockerignore` corretto: i pattern confrontano il **percorso intero**, quindi una regola
`archivio` non esclude `apps/web/.archivio`. E il `.gitignore` non c'entra: il contesto di
build è il filesystem.

**Stato qui.** Verificato su questo repo: `.next/standalone/apps/web/` contiene solo
`node_modules`, `package.json`, `public`, `server.js`. **Da ricontrollare dentro l'immagine**
quando il Dockerfile sarà scritto: la cartella locale non è l'immagine.

---

## G-15 — `CADDY_TLS=internal` non ha mai funzionato _(da gdprhub)_

**Sintomo.** Il reverse proxy va in crash-loop: `unrecognized directive: internal`.

**Perché inganna.** Nel Caddyfile `{$CADDY_TLS}` viene sostituito alla lettera, e `internal`
da solo non è una direttiva. La variabile deve contenere la direttiva **intera**:

```
CADDY_TLS="tls internal"
```

È il ripiego documentato per collaudare senza DNS pubblico — cioè esattamente la situazione
in cui si prova un ripristino.

---

## G-16 — Git Bash su Windows riscrive i percorsi assoluti _(da gdprhub)_

**Sintomo.** `docker run --entrypoint /usr/bin/chromium …` fallisce con un errore che sembra
dire che il file non esiste nell'immagine.

**Perché inganna.** Git Bash converte `/usr/bin/chromium` in
`C:/Program Files/Git/usr/bin/chromium` **prima** che Docker lo veda.

**Rimedio.** `MSYS_NO_PATHCONV=1 docker run …`

---

## G-17 — Test con limiti di tempo stretti arrossiscono sotto carico _(da gdprhub)_

**Sintomo.** Un test che misura il tempo di un'importazione a freddo supera il limite e passa
al secondo giro.

**Perché inganna.** Sembra un difetto intermittente del codice. È contesa di risorse: con più
sessioni che compilano sulla stessa macchina, i tempi raddoppiano.

**Rimedio.** Limiti generosi, o test di tempo fuori dalla suite che fa da cancello.

---

## G-18 — `EBUSY: resource busy or locked, rmdir .next/standalone/apps/web`

**Sintomo.** `pnpm build` fallisce su Windows con `EBUSY` mentre cancella la cartella
standalone. Il codice non c'entra: la build precedente era verde.

**Perche' inganna.** Sembra un errore di permessi o un antivirus. E' un **server standalone
ancora in esecuzione**: la sua directory di lavoro e' proprio `.next/standalone/apps/web`, e
Windows non permette di rimuovere una cartella aperta da un processo (a differenza di Linux,
dove la stessa build passerebbe).

**Rimedio.** Chiudere il server prima di ricostruire.

```bash
taskkill //F //IM node.exe //T     # Git Bash: le barre doppie sono necessarie
```

> **Attenzione, su questa macchina no.** `//IM node.exe` colpisce **ogni** processo Node
> presente, compresi quelli di gdprhub e FlowCRM. Attribuire il processo prima di
> terminarlo, e usare `//PID`: **G-31**.

Ricordarsi che ogni collaudo della build di produzione lascia un processo acceso: va spento
prima della build successiva, non dopo averla vista fallire.

---

## G-19 — Attribuire una risorsa Docker al progetto giusto

**Sintomo.** Un'immagine o un volume che nessuno rivendica, con un nome che somiglia a piu'
di un progetto sulla stessa macchina.

**Perche' inganna.** Il nome lo sceglie chi costruisce e **non ha alcun legame con l'origine**.
La data restringe il campo ma non decide: una build di sei settimane fa sfugge a chiunque
ragioni su "le mie sono tutte di oggi".

Successo davvero, due volte nello stesso giorno:

- `compliance-prova:locale` attribuita a _compliance-os_ per somiglianza di nome. Era di
  **gdprhub**: stesso timestamp di `deploy-app:latest` **al nanosecondo** — stessa immagine,
  due tag.
- `compliance-istanza:prova` dichiarata orfana da **tre** sessioni ("non e' mia") e a un passo
  dalla cancellazione. Era di gdprhub, una loro build dimenticata del 3 agosto.

**Diagnosi — guardare DENTRO, non il nome.**

```bash
docker image inspect <img> --format '{{.Config.Env}}'   # la configurazione tradisce il progetto
docker image inspect <img> --format '{{.Config.Cmd}} {{.Config.Entrypoint}}'
docker history <img> --no-trunc                          # le COPY nominano i file sorgente
docker inspect <container> --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}'
docker volume inspect <vol> --format '{{index .Labels "com.docker.compose.project"}}'
```

Le righe che hanno chiuso i due casi: `STORAGE_PATH=/dati/archivio` e `PDF_CHROMIUM_PATH`
nella prima (nessun altro progetto genera PDF con un browser), e `COPY deploy/migra.mjs` nella
seconda — quel file esiste in un repository solo su questa macchina.

**Regola.** Cancellare **per nome dichiarato dal proprietario**, mai per esclusione. Un
"non e' mia" di tre sessioni non prova che sia orfana: prova che tre persone non l'hanno
riconosciuta.

---

## G-20 — Le variabili d'ambiente di un'immagine sono leggibili da chiunque l'abbia

**Sintomo** (prevenuto). Un segreto passato come `ARG` o scritto in `ENV` resta nell'immagine
e si legge **senza avviarla**.

**Perche' inganna.** Si pensa alla cifratura del registry o ai permessi del repository. Ma
`docker image inspect` e `docker history` leggono la configurazione e le istruzioni di build da
qualunque copia dell'immagine, anche da un registry privato: basta poterla scaricare.

E' cosi' che questa immagine e' stata attribuita al suo proprietario in G-19: la sua
configurazione era leggibile in chiaro. Li' era innocuo (`STORAGE_DRIVER=disk`), ma il
meccanismo e' lo stesso per una password.

**Regola per il Dockerfile e per GHCR:**

- In `ENV` e negli `ARG` **mai** `BETTER_AUTH_SECRET`, `DATABASE_URL`, credenziali SMTP,
  token restic o chiavi API. Arrivano **a runtime**, dal `.env.prod` dell'istanza.
- Le sole `ARG` ammesse a build time sono le `NEXT_PUBLIC_*`, che Next incorpora comunque nel
  bundle servito al browser: sono pubbliche per definizione, non per distrazione.
- Se un segreto serve davvero durante la build, si usa `RUN --mount=type=secret`, che non
  lascia traccia negli strati.

**Verifica prima di pubblicare un'immagine:**

```bash
docker image inspect <img> --format '{{range .Config.Env}}{{println .}}{{end}}'
docker history <img> --no-trunc | grep -iE 'secret|password|token|key'
```

---

## G-21 — Il prune di Docker non libera SUBITO il disco di Windows

**Sintomo.** `docker builder prune -af` dichiara di aver liberato gigabyte, `docker system df`
conferma il calo, e `df` sull'host mostra **lo stesso spazio libero di prima**.

**Perche' inganna — e qui ci siamo sbagliati in due, in direzioni opposte.** Docker Desktop su
WSL2 tiene tutto in un disco virtuale **sparso**:

    %LOCALAPPDATA%\Docker\wsl\disk\docker_data.vhdx

Il prune libera **dentro** il file. Il file restituisce lo spazio all'host **solo quando WSL si
ferma**: il recupero e' differito, non immediato. Chi misura subito dopo il prune vede zero e
conclude che non sia servito a niente — ed e' la conclusione sbagliata, perche' il passo
successivo naturale e' cancellare cose che servono.

**La sequenza, misurata su questa macchina il 18 settembre 2026:**

| Momento                                 | Disco libero          | vhdx         |
| --------------------------------------- | --------------------- | ------------ |
| prima del prune                         | 12 GB                 | 25,92 GB     |
| subito dopo il prune, WSL in esecuzione | **12 GB** (invariato) | 25,92 GB     |
| dopo l'arresto di WSL                   | **26 GB**             | **19,15 GB** |

Il `.vhdx` si e' ridotto di **6,77 GB**, che corrisponde alla cache di build svuotata (6,84 GB).
Il resto della differenza viene da altre pulizie in corso sulla macchina, non da Docker: quando
piu' persone liberano spazio insieme, non si attribuisca tutto a un solo comando.

**Diagnosi.**

```bash
df -h /c                                  # l'host: l'unica misura che conta per lo spazio
docker system df                          # il contenuto: non dice quanto occupa su disco
ls -l "$LOCALAPPDATA/Docker/wsl/disk/docker_data.vhdx"
```

**Rimedio — l'ordine e' tutto:**

1. `docker builder prune -af` e rimozione di immagini/volumi concordati;
2. chiudere Docker Desktop, poi `wsl --shutdown`;
3. **rimisurare con `df`**: e' qui che compare lo spazio;
4. solo se resta molta aria (vhdx >> contenuto reale), compattare.

**Compattazione**, se serve ancora. Richiede Docker fermo e privilegi di amministratore.
Con Hyper-V disponibile:

```powershell
wsl --shutdown
Optimize-VHD -Path "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Mode Full
```

Senza il modulo Hyper-V — il caso di questa macchina, verificato con
`Get-Module -ListAvailable -Name Hyper-V` — si usa `diskpart` come amministratore:

```
wsl --shutdown

diskpart
  select vdisk file="C:\Users\<utente>\AppData\Local\Docker\wsl\disk\docker_data.vhdx"
  attach vdisk readonly
  compact vdisk
  detach vdisk
  exit
```

**Da non fare.** Concludere che il prune sia inutile e passare a cancellare volumi: e' il passo
successivo naturale di chi misura una volta sola, ed e' quello che fa danni.

**La lezione, che vale oltre Docker.** `docker system df` misura il contenuto, non
l'occupazione: se l'obiettivo e' far respirare il disco, la misura e' `df` sull'host. **E va
presa due volte** — prima e dopo l'arresto — perche' su un sistema con recupero differito una
misura sola dice meta' della verita'. E' il corollario di "un successo dichiarato non e' un
successo verificato", con una piega in piu': **anche una verifica fatta bene puo' essere fatta
troppo presto.**

**Verificato** il 18 settembre 2026 da due sessioni in due momenti diversi, che avevano
entrambe ragione: 12 GB invariati subito dopo il prune, 26 GB dopo l'arresto di WSL.

## G-22 — `/tmp` non e' privato: due progetti scrivono lo stesso file di log

**Sintomo.** Una suite di test mostra fallimenti che non appartengono al progetto, o due
riepiloghi diversi nello stesso file (`6 failed, 8 passed` **e** `25 failed, 2 passed`).

**Perche' inganna.** In Git Bash su Windows `/tmp` e' una cartella **comune a tutti i processi**,
non privata della sessione. `pnpm test > /tmp/e2e.log` da due progetti scrive lo stesso file, e
l'ultimo che scrive vince.

Il danno non e' il log perso: e' la conclusione. Chi legge fallimenti altrui indaga su un guasto
che non ha; chi legge un verde altrui archivia come inesistente una regressione vera. Successo
davvero fra questa sessione e quella di FlowCRM: in `/tmp/e2e.log` sono finite **88 righe** del
loro progetto e il riepilogo finale era il loro.

**Diagnosi — prima di interpretare un esito che sorprende:**

```bash
ls -l <file-di-log>                        # l'orario e' quello della TUA esecuzione?
grep -c 'nome-di-un-tuo-spec' <file>       # se e' 0, non e' tuo
grep -c 'un-nome-che-esiste-solo-altrove'  # se e' > 0, e' contaminato
```

**Rimedio.** Scrivere nella cartella riservata alla sessione, mai in `/tmp`. Se un log finisce
comunque li', dargli un nome che contenga il progetto.

**Categoria.** Appartiene alla famiglia **«ambienti condivisi scambiati per isolati»**, insieme a
G-01 (progetti Compose omonimi), G-02 (porte dell'host gia' occupate) e G-19 (immagini attribuite
per somiglianza di nome). Nessuno di questi da' errore quando collide: sovrascrive, mescola o
attribuisce male, **in silenzio**.

---

## G-23 — `Error upgrading connection with STARTTLS` verso il sink di posta locale

**Sintomo.** Le mail restano in coda. `ultimo_errore` in `mail_outbox` ripete
`Error upgrading connection with STARTTLS`, i tentativi salgono fino al tetto, e i test
end-to-end sulla posta scadono senza spiegazione visibile.

**Perche' inganna.** Il mailer imponeva TLS quando `NODE_ENV === "production"`. Ma i test girano
**contro la build di produzione**, quindi `NODE_ENV` e' `production` anche parlando con Mailpit,
che STARTTLS non lo offre.

Il discrimine giusto non e' l'ambiente, e' **l'interlocutore**: TLS obbligatorio verso un relay
remoto, inutile verso un sink in ascolto sulla macchina stessa.

**Rimedio** (`apps/web/src/lib/email/mailer.ts`):

```ts
const hostLocale = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
requireTLS: !hostLocale && porta !== 465,
```

**Come accorgersene subito.** La coda dice sempre la verita': se una mail non arriva, la prima
cosa da guardare non e' il sink ma `ultimo_errore`.

```sql
select destinatario, tentativi, ultimo_errore from mail_outbox where inviata_at is null;
```

---

## G-24 — I test contro la build di produzione inciampano nelle difese di produzione

**Sintomo.** Una suite end-to-end fallisce su comportamenti **corretti**:

- ogni chiamata autenticata risponde **401** anche dopo un accesso riuscito;
- dopo qualche test compare **429** su `/sign-in/email`.

**Perche' inganna.** Sembrano guasti dell'applicazione. Sono le difese che funzionano:

1. **Cookie `Secure`.** In produzione il cookie di sessione ha prefisso `__Secure-` e attributo
   `Secure`. Un client HTTP su `http://127.0.0.1` non lo conserva — nemmeno il client API di
   Playwright — quindi la sessione non viaggia e tutto risponde 401.
2. **Limitatore di frequenza.** `/sign-in/email` accetta 5 tentativi al minuto. Una suite che
   crea decine di studi li esaurisce, e da li' in poi e' tutto rosso.

**Rimedio — restringere la difesa all'origine dove serve, non disattivarla.** Entrambe usano la
stessa condizione di `env.ts`:

```ts
const cookieSicuri = produzione && !eLocale(baseURL);   // Secure solo su origine pubblica
rateLimit: { enabled: !eLocale(baseURL), ... }           // limitatore fuori da localhost
```

Non e' una rinuncia: `verificaAmbiente()` **rifiuta l'avvio** se un dominio pubblico non usa
https, quindi su un'istanza cliente cookie sicuri e limitatore ci sono sempre. Su `127.0.0.1` non
c'e' rete da proteggere ne' nessuno da limitare.

**In piu', nei test**: creare lo studio e poi attivarlo con `organization/set-active` invece di
rifare l'accesso. Un secondo `sign-in` per ogni studio consuma il limitatore per nulla.

---

## G-25 — `disableSignUp` rendeva impossibile invitare collaboratori

**Sintomo.** Su un'istanza in produzione il titolare crea l'invito (**200**), la mail parte, il
collaboratore clicca il link — e riceve **400 `EMAIL_PASSWORD_SIGN_UP_DISABLED`**. Non puo'
creare il proprio accesso. Su ogni istanza consegnata, invitare qualcuno era impossibile.

**Perche' inganna.** `disableSignUp: true` di Better Auth sembra spegnere «la registrazione
pubblica». In realta' spegne **l'endpoint `/sign-up/email` per tutti** — e accettare un invito
passa esattamente di li'. Il nome promette meno di quanto l'interruttore spenga.

Peggio: **la suite end-to-end non se ne accorgeva**, perche' il server di prova aveva la
registrazione aperta. Il test sugli inviti era verde su un flusso rotto in produzione.

**Verificato** il 18 settembre 2026, server standalone con `REGISTRAZIONE_APERTA` assente:

```
sign-up estraneo          400   (atteso)
sign-in titolare          200   (atteso)
invite-member             200   (invito creato, mail inviata)
sign-up dell'INVITATO     400   EMAIL_PASSWORD_SIGN_UP_DISABLED   <-- il difetto
```

**Rimedio.** Non si spegne l'endpoint: si controlla **chi lo usa**. La regola che serve e' piu'
stretta e piu' precisa — _nessuno si registra da solo, ma chi ha un invito valido si'_. Vive in
`databaseHooks.user.create.before` (`apps/web/src/lib/auth.ts`):

```ts
before: async (nuovo) => {
  if (registrazioneAperta) return;
  const inviti = await db
    .select({ id: schema.invitation.id })
    .from(schema.invitation)
    .where(
      and(
        eq(schema.invitation.email, nuovo.email.toLowerCase()),
        eq(schema.invitation.status, "pending"),
        gt(schema.invitation.expiresAt, new Date()), // un invito scaduto non vale
      ),
    )
    .limit(1);
  if (inviti.length === 0) return false;
};
```

**Dopo la correzione**, stessa prova: estraneo **400** e nessuna riga creata nel database,
invitato **200**, titolare **200**.

**Regressione coperta.** `e2e/registrazione-chiusa.spec.ts` gira contro un **secondo server**
con la registrazione chiusa, sullo stesso database: e' l'unico modo di provare il comportamento
di produzione. Un solo server di prova a porte aperte non avrebbe mai visto il difetto.

**La domanda da portarsi dietro**, arrivata dalla sessione FlowCRM che aveva appena preso lo
stesso colpo con `ENABLE_EMAIL_SIGNUP` (mappata su `GOTRUE_EXTERNAL_EMAIL_ENABLED`, che spegne
**il login** e non la registrazione):

> **Esiste un interruttore il cui nome promette meno di quanto spenga?**
> Non leggerne il nome: provare il flusso che dovrebbe restare aperto.

---

## G-26 — `psql -tA ... RETURNING id` restituisce anche l'esito del comando

**Sintomo.** Una variabile di shell che dovrebbe contenere un UUID ne contiene due righe:
l'identificatore **e** `INSERT 0 1`. Gli inserimenti successivi che la usano falliscono in
silenzio, e il guasto si manifesta molto piu' avanti — qui come un report che risponde 404.

**Perche' inganna.** `-t` (solo tuple) e `-A` (senza allineamento) tolgono intestazioni e
formattazione, ma **non** l'etichetta di esito del comando. Chi ha in mente `-tA` come
"solo il valore" non se lo aspetta.

```bash
CID=$(psql -tA -c "insert into clienti (...) values (...) returning id;")
echo "[$CID]"
# [7f3a...-...
#  INSERT 0 1]
```

**Rimedio.** Prendere solo la prima riga, e non fidarsi della forma del risultato:

```bash
CID=$(psql -tA -c "...returning id;" | tr -d '\r' | head -1)
```

Meglio ancora, negli script di prova: inserire senza `RETURNING` e rileggere l'id con una
`SELECT` separata. Un passo in piu' che toglie una classe di errori.

**Categoria.** Stessa famiglia di G-05 e G-22: **l'uscita di un comando non e' il valore che si
crede.** Qui il comando riesce davvero — e' la lettura del risultato a essere sbagliata.

---

## G-27 — `overwrite: true` sull'API DNS cancella l'intera zona

**Sintomo** (prevenuto, mai subito). Dopo aver aggiunto il record di UN cliente, **tutti gli
altri sottodomini smettono di risolvere**. Nessun errore: la chiamata risponde 200.

**Perche' inganna.** L'API DNS di Hostinger accetta un campo `overwrite`. Con `true` il corpo
della richiesta non _aggiunge_ un record: **sostituisce l'intera zona**. Il risultato e' che
l'attivazione di un cliente mette offline tutti gli altri dello stesso prodotto — con un solo
comando, e con una risposta di successo.

E' il passo piu' pericoloso dell'intero deploy, e riguarda i tre prodotti che condividono
l'approccio (segnalazione nata nella sessione gdprhub).

**Rimedio — tre difese, non una:**

```bash
# 1. mai overwrite: true
curl -X PUT ... -d '{"overwrite": false, "zone": [...]}'
```

```bash
# 2. istantanea della zona PRIMA di scrivere -> permette di RIPRISTINARE
curl -fsS "$API" > "$ISTANTANEE/zona-$(date -u +%FT%H%M%SZ).json"
```

```bash
# 3. conteggio dei record DOPO -> permette di ACCORGERSI
[ "$DOPO" -lt "$PRIMA" ] && { echo "la zona e' stata sovrascritta"; exit 1; }
```

Un'istantanea fa **ripristinare**, un conteggio fa **accorgere**: senza il secondo, il primo
serve solo quando qualcuno ha gia' chiamato per dire che il sito non c'e' piu'.

**In piu'**, `dns-hostinger.sh` interroga due slug gia' attivi con `dig` dopo ogni modifica: se
la zona fosse stata azzerata lo si scopre in dieci secondi, non dal cliente.

**Alla dismissione** il record DNS va rimosso **per primo**: un sottodominio che punta a un
indirizzo non piu' nostro e' rivendicabile da chiunque, e resta a nome del prodotto.

---

## G-28 — La CSP con nonce è incompatibile con le pagine statiche

**Sintomo.** Introdotto il nonce nella Content-Security-Policy, le pagine arrivano con
**HTTP 200** e restano **ferme a metà**: nessun errore di server, nessun 500, ma il contenuto
non compare e i test del browser falliscono con «elemento non trovato».

**Perché inganna.** Sembra un difetto dell'applicazione. È invece una conseguenza logica che
nessuno dice ad alta voce:

1. una pagina **pre-renderizzata a build time** ha l'HTML già scritto quando il nonce non
   esiste ancora, quindi i suoi script non possono averlo;
2. il browser, vedendo un nonce nella politica, **ignora `'unsafe-inline'`** — è la
   compatibilità prevista dalla specifica, non un capriccio;
3. quindi gli script della pagina statica vengono bloccati, e senza idratazione la pagina
   resta il guscio vuoto che il server ha mandato.

Nell'elenco delle rotte a fine build le pagine statiche sono marcate `○`:

```
○ /login          ← statica: il nonce non ci arriverà mai
ƒ /app/clienti    ← dinamica: il nonce si applica
```

**Diagnosi.** Contare gli script con e senza nonce nell'HTML servito:

```bash
curl -s http://127.0.0.1:3100/login > /tmp/pagina.html
grep -c '<script' /tmp/pagina.html
grep -o '<script[^>]*nonce=' /tmp/pagina.html | wc -l     # se è 0, ecco il problema
```

E nel test del browser, raccogliere le violazioni dalla console: sono l'unico posto dove il
guasto si dichiara.

```ts
page.on("console", (m) => {
  if (/Content Security Policy|Refused to (load|execute)/i.test(m.text()))
    violazioni.push(m.text());
});
expect(violazioni).toHaveLength(0);
```

**Rimedio — due mosse, servono entrambe.**

1. **Resa dinamica** (`export const dynamic = "force-dynamic"` nel layout radice): il nonce
   può esistere solo se l'HTML si genera a richiesta. Qui il prezzo è la resa statica di
   cinque pagine (accesso, registrazione, recupero, reimpostazione, radice) — su un'istanza
   dedicata a un singolo studio non si misura, e tutte le pagine sotto `/app` erano già
   dinamiche perché leggono gli header.

2. **Il nonce va passato anche alle librerie che scrivono script inline.** Rimaneva una
   violazione dopo la prima mossa: `next-themes` inserisce uno script inline che applica il
   tema **prima della prima pittura**, per evitare il lampo di colore. Next non lo firma —
   accetta un `nonce` come proprietà:

   ```tsx
   const nonce = (await headers()).get("x-nonce") ?? undefined; // layout radice
   <TemaProvider nonce={nonce}>{children}</TemaProvider>;
   ```

**Da tenere presente.** `'unsafe-inline'` resta nella politica come ripiego per i browser che
il nonce non lo capiscono — quelli che lo capiscono lo ignorano. Non è una contraddizione né
una svista: è il meccanismo di compatibilità della specifica.

**Regressione coperta.** Tre asserzioni in `e2e/salute.spec.ts`: la CSP contiene un nonce,
contiene `'strict-dynamic'`, e **il nonce cambia a ogni richiesta** — un nonce riutilizzato è
prevedibile, e un nonce prevedibile non protegge da niente.

---

# PROCEDURE

Le voci `P-nn` non sono guasti: sono regole di lavoro nate da un guasto, per non
ripeterlo. Concordate fra i tre prodotti che condividono questa macchina.

## P-01 — Disciplina del disco quando si costruiscono immagini

**Il 18 settembre 2026 il disco è arrivato a 1,5 GB su 238 (100%) e Docker ha
cominciato a fallire a caso.** L'abbiamo riempito in tre, e nessuno se ne è
accorto prima del blocco.

**La causa strutturale**, trovata dalla sessione FlowCRM, in `~/.docker/daemon.json`:

```json
"builder": { "gc": { "enabled": true, "defaultKeepStorage": "20GB" } }
```

Il garbage collector di BuildKit era **autorizzato a tenere 20 GB di cache**, ed
era arrivato a 14,5: la singola voce più grossa del disco. Non un incidente — ha
fatto esattamente ciò per cui era configurato, su una macchina senza quel
margine. **Portato a `"4GB"`.** Senza questa correzione, tutte le regole di
comportamento qui sotto rimandano il problema di due giorni.

**Le cause immediate**, una per prodotto, dichiarate da ciascuno:

- gdprhub: **otto ricostruzioni** di un'immagine da 1,86 GB in una giornata, una
  per correzione;
- qui: **due stack accesi insieme**, `advisorhub-*` di produzione e
  `advisorhub-dev-*` di sviluppo, che non serve mai;
- FlowCRM: lo stack Supabase da dodici container tenuto su fra una prova e l'altra.

**Le regole:**

1. **Una costruzione per LOTTO di correzioni**, non una per correzione. Si
   accumulano le modifiche, si costruisce una volta, si verifica tutto insieme.
2. **Pulizia a fine sessione di build**, sempre, non quando il disco urla:
   `docker compose … down` · `docker rmi <le proprie immagini>` ·
   `docker builder prune -af`. Trenta secondi.
3. **Uno stack alla volta per progetto**, e mai produzione e sviluppo insieme.
4. **`df -h` prima di avviare uno stack**: sotto i 15 GB liberi non si avvia, si
   libera prima.
5. **`wsl --shutdown` fa parte della pulizia**, non è un rimedio d'emergenza:
   senza, il disco virtuale non restituisce niente (**G-21**). Va concordato con
   chi ha container in volo.
6. **Tetto al disco virtuale**: Docker Desktop → Resources → _Disk image size_.
   Con un tetto, a fermarsi è **una build** invece dell'intera macchina. È
   l'unica misura che protegge anche quando si dimenticano le altre cinque.
7. **Mai `docker volume prune`** — si cancella per nome, con il proprietario che
   conferma (**G-01**, **G-19**).

**Un dato che rende la regola giustamente asimmetrica.** Le immagini pesano
321 MB qui, 1,86 GB per gdprhub (Chromium per i PDF). Il vincolo stringe chi
costruisce pesante, e a costruire meno spesso dev'essere lui — non chi costruisce
leggero a rinunciare a verificare.

**Il conto finale della giornata**: 1,5 GB → 29 GB liberi, dopo `builder prune`,
rimozione delle immagini superate di ciascuno, riavvio di Docker con il nuovo
tetto e compattazione del disco virtuale.

## G-29 — Dashboard e report disegnavano lo stesso indicatore su scale diverse

**Sintomo.** Nessuno: non fallisce niente, i numeri sono giusti. Ma lo stesso cliente appare
con barre di riempimento diverso nella dashboard e nel PDF consegnato.

**Perche' inganna.** Erano due serie di numeri scritte in due file, entrambe plausibili:

| Indicatore | Dashboard | Report    |
| ---------- | --------- | --------- |
| ROS        | fondo 15  | fondo 20  |
| Turnover   | fondo 3   | fondo 2,5 |
| ROI        | fondo 15  | fondo 20  |
| ROI indus. | fondo 12  | fondo 20  |
| ROE        | fondo 20  | fondo 30  |
| DSCR       | fondo 2,2 | fondo 2,5 |

**Sei su sette.** Un commercialista che mostra la dashboard e poi consegna il PDF vede due
rappresentazioni discordi dello stesso dato. Nessun numero era sbagliato: era sbagliato che
fossero due.

**Diagnosi.** Cercare le normalizzazioni fisse e confrontarle con i fondi scala dichiarati:

```bash
grep -oE "indicatori\.[a-zA-Z]+ / [0-9.]+" apps/web/src/lib/analisi/indicatori-meta.ts
grep -oE "max: [0-9.]+" apps/web/src/lib/report/soglie.ts
```

**Rimedio.** Un solo `SCALE`, usato da entrambe le superfici.

**Della stessa famiglia**, trovato insieme: le **soglie di giudizio** (10% per il ROS, 1,2 per il
DSCR...) erano riscritte nel report accanto a quelle del motore, e le **fasce di salute**
(30/55/75/90) esistevano in quattro copie. Ora vivono nel motore
(`SOGLIE_GIUDIZIO`, `FASCE_SALUTE`) e le altre superfici le importano.

**Regressione coperta.** `packages/engine/test/soglie.test.ts` verifica che ogni soglia
dichiarata corrisponda al comportamento reale della funzione di giudizio — attraversandola, il
punteggio deve cambiare. Una costante che dichiara un comportamento senza essere legata ad esso
e' peggio di nessuna costante: sembra autorevole e puo' mentire.
`fasce.test.ts` verifica che fascia e testo di sintesi cambino nello stesso punto.

---

## G-30 — La posta configurata a mano, e da nessuna parte scritto che va fatto

**Sintomo.** Un'istanza appena consegnata funziona in tutto, ma **nessuna email parte**. Nessun
errore, nessun container malato, la salute e' verde. Il recupero password non arriva, e lo
scopre il titolare il giorno in cui ne ha bisogno.

**Perche' inganna.** Lo script di onboarding accetta le variabili SMTP come **opzionali**:

```bash
SMTP_HOST=${SMTP_HOST:-}          # vuoto se nessuno lo esporta
SMTP_PORT=${SMTP_PORT:-587}
SMTP_FROM=${SMTP_FROM:-no-reply@${BASE_DOMAIN}}
```

Chi installa deve **sapere** di doverle esportare prima. Nel riferimento
(`WhistleBlower/deploy/RUNBOOK.md`) la parola «smtp» compare **zero volte** — verificato — e il
`.env.prod.example` si contraddice col resto: suggerisce `smtp.cliente.it` mentre il mittente
predefinito e' il dominio-brand.

La configurazione mancante non produce un guasto: produce **silenzio**. La coda si riempie e
nessuno la guarda.

**Diagnosi.**

```bash
grep -c -i smtp deploy/RUNBOOK.md                       # se e' 0, non e' documentato
grep -E '^SMTP_HOST=' deploy/.env.prod                  # se e' vuoto, nulla parte
# e la coda dice sempre la verita':
psql -tA -c "select count(*) from mail_outbox where inviata_at is null;"
```

**Rimedio.**

1. La posta **arriva col dominio**: registrando il dominio-brand su Hostinger si ha gia' SMTP, e
   SPF/DKIM/DMARC si configurano nel pannello che gestisce la zona DNS. Nessun fornitore
   transazionale in piu' — e la giurisdizione UE c'e' gia', Hostinger e' lituana.
2. I valori stanno in `deploy/.env.prod.example` **con l'avvertenza in chiaro**, e la procedura
   in `RUNBOOK.md` §0.1. Non nella testa di chi installa.
3. La sentinella sorveglia la coda: messaggi fermi da oltre 30 minuti o con i tentativi esauriti
   sono **critici**, perche' significano che nessuno puo' recuperare la password.
4. **Gate di go-live**: logout, «Password dimenticata?», il messaggio deve arrivare in una
   casella vera — **spam compreso** — e il reimposta va completato. Senza questo PASS l'istanza
   non si dichiara attiva.

**Il limite che resta, e va conosciuto.** Con una sola casella tutte le istanze condividono le
credenziali: una VPS compromessa manda posta a nome del dominio e brucia la reputazione del
mittente per l'intera flotta. Se il piano consente piu' caselle, **una per istanza**. Se non lo
consente, si accetta sapendolo. Nel riferimento questa scelta non e' stata presa: e' stata subita.

**Una nota di metodo.** La raccomandazione iniziale era un fornitore transazionale esterno,
scelto ragionando per categorie — «serve un relay in UE» — invece di guardare cosa fa davvero il
progetto che stiamo copiando. Dedurre invece di verificare: lo stesso errore che in questo
registro compare in G-10, G-19 e G-21.

---

## G-31 — `netstat` dice CHE la porta è occupata, non DA CHI

**Sintomo.** Playwright si rifiuta di partire:

```
Error: http://127.0.0.1:3100/api/health is already used, make sure that nothing is
running on the port/url or set reuseExistingServer:true in config.webServer.
```

Si termina il processo che occupa la 3100, si rilancia, e dopo poco il messaggio torna.

**Perché inganna.** La porta 3100 è «la porta dei nostri end-to-end», quindi chi la trova
occupata conclude che sia un **proprio** server rimasto acceso da una sessione precedente —
una conclusione ragionevole, perché succede davvero (**G-18**). E `netstat -ano` conferma
l'occupazione mostrando un PID, il che sembra una prova. Non lo è: dice che c'è un processo,
non di chi sia. Su questa macchina girano tre prodotti, e qui la 3100 era di **gdprhub**.

Il risultato è che si spegne il server di sviluppo di un'altra sessione, senza errore e senza
accorgersene: da fuori è indistinguibile dal caso legittimo. È **G-02** visto dal lato di chi
fa il danno invece di subirlo.

**Diagnosi.** Interrogare la sonda di salute: ogni prodotto ha una forma sua, e la forma è la
firma.

```bash
curl -s http://127.0.0.1:3100/api/health
```

```json
{"status":"ok","db":"up","version":"…"}                      ← advisorhub
{"stato":"ok","database":"ok","studi":"ok","catalogo":{…}}   ← gdprhub
```

Il PID da solo non attribuisce niente. Se si vuole partire dal PID:

```bash
netstat -ano | grep ":3100 .*LISTENING"
wmic process where "ProcessId=<pid>" get CommandLine       # la riga di comando, non il nome
```

**Due metodi, in quest'ordine** _(il primo da flowcrm)_. Si completano, e messi nell'ordine
sbagliato lasciano un buco.

1. **Per PERCORSO del progetto nella riga di comando.** È il più forte, perché funziona
   anche su un processo bloccato o moribondo, che a una sonda non risponderebbe:

   ```powershell
   Get-CimInstance Win32_Process |
     Where-Object { $_.CommandLine -like '*\sistemacommercialisti\*' }
   ```

   **Il limite, che va conosciuto**: su Windows `CommandLine` torna **vuota** per i processi
   di un altro utente o elevati rispetto alla sessione che interroga, senza errore e senza
   avviso. Quindi il filtro può non vedere qualcosa che invece c'è. Ma sbaglia **verso il
   non toccare**: un processo che non si riesce ad attribuire semplicemente non compare, e
   quindi non si chiude. È il verso giusto in cui fallire.

2. **Per SONDA di salute**, su ciò che resta. Copre il caso opposto: processo vivo la cui
   riga di comando non è leggibile.

**La regola che ne segue, ed è la più utile.** Se dopo il filtro per percorso la porta
risulta ancora occupata, **non è un processo proprio che il filtro ha mancato: è quasi
certamente di qualcun altro.** È il momento di chiedere, non di allargare il filtro.

**Rimedio.** Due regole, nell'ordine:

1. **Mai terminare un processo che non si è dimostrato proprio.** La prova è il percorso o
   la risposta della sonda, non il numero della porta né il fatto che sia `node.exe` (lo
   sono tutti).
2. **Spostarsi invece di sgomberare.** La configurazione Playwright legge `E2E_PORT` e ne
   deriva la seconda porta (`E2E_PORT + 1`), quindi basta:

   ```bash
   E2E_PORT=3400 pnpm --filter web test:e2e
   ```

   Non c'è ragione di contendersi una porta su una macchina condivisa: cedere costa una
   variabile d'ambiente, insistere costa il lavoro di qualcun altro.

**Della stessa famiglia.** `taskkill //F //IM node.exe //T`, suggerito in **G-18**, uccide
**tutti** i processi Node della macchina: su una macchina a prodotto singolo è un rimedio, su
questa è un incidente. Va usato `//PID` con il PID attribuito, mai `//IM`.

---

## G-32 — Anche il metro va verificato, non solo la cosa misurata

**Sintomo.** Uno strumento di misura risponde **zero**, e la conclusione ovvia è che la cosa
misurata non ci sia. Casi reali:

- `document.getAnimations()` restituisce zero animazioni su un componente che **stava animando
  benissimo**. Il motivo: non vede dentro uno **shadow root**, e NumberFlow vive tutto lì.
  Serviva `shadowRoot.getAnimations()`.
- `docker system df` dice che lo spazio è stato liberato mentre `df` sull'host non si muove
  (**G-21**): misura il contenuto, non l'occupazione.
- `netstat` dice **che** una porta è occupata, non **da chi** (**G-31**): due processi terminati
  appartenevano a un altro progetto.
- `bash -n` accetta uno script con apostrofi dentro `${var:?…}`, che a runtime escono monchi.

**Perché inganna.** Un valore numerico sembra un fatto. Ma ogni strumento ha un **campo visivo**,
e fuori da quello risponde zero esattamente come risponderebbe se la cosa non esistesse.
**Assenza di misura e misura di assenza danno lo stesso numero.**

È la stessa famiglia di G-05 (un comando che dichiara successo senza effetto) e G-19 (un nome che
sembra dire chi ha costruito un'immagine), ma applicata un passo più a monte: non alla cosa
osservata, all'osservatore.

**Diagnosi.** Prima di scrivere «non c'è», dimostrare che lo strumento **vedrebbe** la cosa se
ci fosse:

```js
// se il metro funziona, su un caso NOTO deve dare un numero diverso da zero
document.getAnimations().length; // 0 — ma vede dentro gli shadow root?
el.shadowRoot.getAnimations().length; // 4 — eccole
```

Vale per qualunque misura: un controllo che non fallisce mai va fatto fallire una volta, apposta.
È il motivo per cui in questo progetto `check-no-secrets.sh` è stato provato con un segreto
finto, e `restore-test.sh` con un database svuotato: un cancello che non ha mai detto di no non
si sa se sappia dirlo.

**Quanto costa un metro cieco.** Non è una questione di eleganza. Su un progetto vicino, un
cancello visivo cliccava ogni elemento di diciassette pagine ed era **verde da settimane** —
su pagine che non si erano mai idratate. Quando ha cominciato a misurare davvero, sotto l'HTML
morto sono emersi due difetti reali rimasti invisibili per **mesi**:

- `history.replaceState` dentro un aggiornatore di `setState` — React che aggiorna il Router
  durante il render di un altro componente: **30 occorrenze**;
- il nonce azzerato dal browser contro il valore reso dal server: **690 occorrenze**.

Entrambi corretti e riverificati a zero. Il punto non è che il cancello non trovasse difetti:
è che **i difetti non potevano nemmeno manifestarsi**, perché il codice che li produce non
girava. Un cancello su una pagina morta non è soltanto cieco, è **silenzioso per costruzione**.

**Rimedio.** Nessuna correzione di codice: è una regola di metodo.

> **Se una misura sorprende, il primo sospettato è il metro.**

---

## G-33 — Il cancello nato cieco: stringhe di sviluppo contro build di produzione

**Sintomo.** Un cancello che raccoglie messaggi dalla console del browser per intercettare le
**mancate corrispondenze di idratazione** di React. Il filtro era `/hydrat/i`, ricavato leggendo le
stringhe **nel runtime installato** e non a memoria:

```
"Hydration failed because the server rendered ..."
"A tree hydrated but some attributes of the server rendered HTML didn't ..."
```

Sembrava metodo. Non lo era: quelle stringhe stanno in `react-dom/cjs/react-dom-client.**development**.js`,
e **i nostri end-to-end girano contro la build di produzione** (`playwright.config.ts`, per i motivi
di G-06 e G-09). In produzione lo stesso identico difetto esce cosi':

```
Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]=
```

**Nessuna occorrenza della parola «hydration».** Il cancello sarebbe stato cieco esattamente
nell'ambiente per cui era stato scritto.

**Perche' inganna.** La verifica era stata fatta — le stringhe erano vere, lette dal pacchetto
installato, non inventate. Il salto e' stato **dedurre che valessero anche in produzione**. È la
stessa famiglia di G-32, un passo piu' a monte: non ho sbagliato a leggere il metro, ho letto il
metro giusto **nell'ambiente sbagliato**.

Peggio: il difetto non era nemmeno silenzioso del tutto. L'errore #418 arriva come `pageerror`, non
come messaggio di console, quindi finiva nel secchio generico «errori JS». Il test **falliva
comunque**, ma con un'etichetta che non diceva dove guardare — e un fallimento che non si sa
leggere e' un fallimento che si archivia come rumore.

**Diagnosi.** Non si indovina: si provoca il difetto e si guarda cosa esce davvero. Senza toccare
il sorgente e senza ricostruire l'immagine, si altera l'HTML reso dal server prima che il browser
lo parsifichi, cosi' la mancata corrispondenza la produce **React stesso**:

```ts
await page.route("**/login", async (route) => {
  if (route.request().resourceType() !== "document") return route.continue();
  const risposta = await route.fetch();
  const html = (await risposta.text()).replace(">Accedi<", ">Accedj<");
  await route.fulfill({ response: risposta, body: html });
});
```

**Rimedio.** In `apps/web/e2e/aiuto.ts`, `osservaConsole()` riconosce **due** forme, e il ramo
`pageerror` applica lo stesso riconoscimento del ramo `console`:

```ts
function èIdratazione(t: string): boolean {
  return /hydrat/i.test(t) || /Minified React error #\d+/.test(t);
}
```

Deliberatamente **non** una lista di codici (#418, #423, #425…): cambierebbe a ogni versione di
React e il cancello tornerebbe a mentire in silenzio, che e' il guasto da cui siamo partiti.
Qualunque errore React minificato su una pagina che deve funzionare e' comunque un difetto, e il
link che React stampa porta al messaggio esteso.

> **Un cancello va provato nell'ambiente in cui girera', non in quello in cui e' comodo provarlo.**
> Corollario operativo: prima di fidarsi, **fallo fallire apposta**. Questo si e' rivelato cieco
> al primo tentativo di farlo fallire, non al primo difetto vero — che sarebbe arrivato mesi dopo.

**Le due impostazioni possibili, e il prezzo di ciascuna.** Confrontando la soluzione con quella
della sessione gdprhub, che sullo stesso problema aveva scelto la strada opposta:

| Impostazione                                       | Come                                                      | Prezzo                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Elencare cosa cercare** (la nostra, all'inizio)  | filtri sulle forme di difetto note                        | **cieca su cio' che non e' stato previsto** — e' precisamente questo guasto                                        |
| **Raccogliere tutto meno una allowlist** (la loro) | ogni errore e avviso fallisce, tranne poche voci motivate | **rumore**: da loro 25 segnalazioni su 52 in un giro non erano difetti. Un cancello che grida si smette di leggere |

Il secondo rischio e' reale quanto il primo, ma **non e' simmetrico nei costi**: un cancello cieco
tace per mesi, uno rumoroso lo scopri il giorno stesso.

Da noi e' stato **misurato prima di scegliere**, non deciso a priori: su tutte le superfici
autenticate, a 1440 e a 375 px, la build di produzione produce **zero** messaggi di errore o
avviso oltre a quelli gia' classificati. Il rumore che loro pagano nasce dal girare in
**sviluppo**, dove React e Next parlano molto di piu'. Quindi qui la seconda impostazione si
adotta **a costo nullo**, e `osservaConsole()` ora raccoglie ogni errore o avviso con
`RUMORE_AMMESSO` vuota.

> **Fra un cancello cieco e uno rumoroso, scegli in base a una misura, non a un'intuizione.**
> E se la misura dice zero, la scelta non e' un compromesso.

---

## G-34 — pnpm 11 ignora `pnpm.auditConfig` in `package.json`, con un avviso

**Sintomo.** Un'eccezione di audit scritta sotto `pnpm.auditConfig` in `package.json` **non filtra
nulla**. Il cancello continua a segnalare avvisi che credevi esclusi.

**Perche' inganna.** pnpm non fallisce e non ignora in silenzio: stampa un **avviso**, che in una
CI verbosa scorre via. La configurazione _sembra_ attiva perche' e' li', scritta, nel posto in cui
stava prima.

**Rimedio.** Su pnpm 11 va in **`pnpm-workspace.yaml`**, non in `package.json`.

_(Scoperta dalla sessione frontend di questo progetto.)_

---

## G-35 — I pacchetti incorporati in `next/dist/compiled` sfuggono a una scansione di `node_modules`

**Sintomo.** Uno script che verifica quali pacchetti vulnerabili finiscono davvero
nell'artefatto spedito cercava solo sotto `node_modules` e dichiarava `nanoid` **non spedito**.

**Perche' inganna.** `nanoid` c'e' eccome, ma sta in **`next/dist/compiled/nanoid`**: Next
incorpora diverse dipendenze dentro di se'. Il cancello taceva proprio sull'unico pacchetto
vulnerabile realmente presente nell'immagine — il caso peggiore, perche' un cancello verde su
un artefatto vulnerabile e' peggio di nessun cancello.

**Diagnosi.** Scoperto **solo** provando a farlo fallire, togliendo l'eccezione (corollario di
G-33). Cercare sempre anche dentro i percorsi incorporati:

```bash
find .next/standalone -type d -name nanoid
```

_(Scoperta dalla sessione frontend di questo progetto.)_

---

## G-36 — `git diff` dice il vero sul ramo attivo, e tace su quello che sta per essere unito

**Sintomo.** Due sessioni lavorano **nella stessa cartella** su rami diversi. Prima di riscrivere
`apps/web/e2e/interfaccia.spec.ts` ho controllato come si deve:

```bash
git status --short          # M  apps/web/e2e/interfaccia.spec.ts
git diff apps/web/e2e/interfaccia.spec.ts   # vuoto: solo fine riga CRLF
```

Conclusione: «nessuno lo sta modificando, posso riscriverlo». **Falso.** Un cancello
sull'idratazione era gia' committato sul ramo `frontend-composizione`, mentre il ramo attivo era
partito **prima** di quel commit. La mia riscrittura non toccava lavoro non committato — lo
avrebbe cancellato **al momento dell'unione**.

**Perche' inganna.** Il comando ha risposto correttamente alla domanda che gli ho fatto: «questo
file ha modifiche non committate **qui**?». La domanda giusta era un'altra: «esiste lavoro su
questo file **da qualche parte** nel repository?». Un `git diff` pulito si legge come «campo
libero», e su una macchina con tre sessioni non lo e'.

E' il rovescio esatto di CONSEGNA §2.1 — _una rete che non e' nel repository non e' una rete_.
Qui il lavoro **era** nel repository: solo non sul ramo da cui stavo guardando.

**Diagnosi.** Prima di riscrivere un file su una macchina condivisa:

```bash
git log --all --oneline -5 -- <percorso>     # chi lo ha toccato, su QUALUNQUE ramo
git branch -a --contains <commit>            # dove vive quel lavoro
```

E, quando il costo e' basso, chiedere alla sessione che potrebbe averlo in mano: costa un
messaggio e vale un'unione andata male.

**Rimedio.** I due cancelli sono stati **riuniti**, non scelti: coprono difetti diversi e
nessuno dei due basta da solo.

| Cancello                                 | Vede                                                 | Cieco su                                                                         |
| ---------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `osservaConsole()` (console + eccezioni) | l'idratazione **sbagliata**, anche minificata (G-33) | una pagina che non si idrata affatto: non emette nessun messaggio da raccogliere |
| sonda su `__reactFiber`                  | l'idratazione **assente**: React non e' mai partito  | una pagina viva che rende il contenuto sbagliato                                 |

> **Un `git diff` pulito non significa «nessuno ci sta lavorando». Significa «non qui, non ora».**

---

## G-37 — Un passo di rilascio mai eseguito non e' un rilascio

**Sintomo.** Alla **prima esecuzione vera** del lavoro `immagine` in CI, la costruzione fallisce:
il runtime copia **tre** bundle autonomi, la fase di build ne costruiva **due**. Mancava
`build:titolare`.

**Perche' inganna.** Il difetto era li' da sempre e nessun controllo lo vedeva, per una ragione
strutturale: `immagine` dipende dai cancelli di qualita' e sicurezza, e **finche' l'audit e' rosso
quel lavoro non viene mai eseguito**. Un passo di rilascio protetto da un cancello che non passa
non e' «pronto»: e' **non verificato**, e sembra pronto perche' e' scritto.

E' l'esatto parallelo di G-32 applicato alla catena di rilascio: li' il metro non poteva misurare,
qui il passo non poteva essere eseguito. In entrambi i casi il verde non significava niente.

**Diagnosi.** Per ogni passo che l'artefatto attraversera', chiedersi **quando e' stato eseguito
per l'ultima volta davvero** — non quando e' stato scritto. Se la risposta e' «mai», va forzato
almeno una volta, anche a mano, anche fuori dalle condizioni che lo proteggono.

Qui bastava confrontare le due liste:

```bash
grep -n "build:" apps/web/package.json      # cosa la build COSTRUISCE
grep -n "COPY .*\.js" deploy/Dockerfile     # cosa il runtime COPIA
```

**Rimedio.** Corretto usando `build:bundle`, che costruisce tutti e tre i bundle da un'unica
definizione: due liste che devono restare uguali sono due liste che prima o poi divergeranno.

> **«Mai eseguito» e «funzionante» si assomigliano moltissimo, finche' non si guarda.**
> Fratello maggiore del corollario di G-33: _un cancello mai attraversato non e' un cancello_.

_(Scoperto dalla sessione frontend di questo progetto, alla prima esecuzione reale del rilascio.)_

---

## G-38 — `next/font/google` scarica i font DURANTE la build: una build senza rete fallisce

**Sintomo.** La costruzione dell'immagine fallisce, o rallenta con avvisi di rete, su una macchina
che non raggiunge `fonts.googleapis.com`.

**Perche' inganna.** A runtime i font sono serviti da noi — vengono scaricati in fase di build e
inglobati nell'artefatto — quindi **la CSP regge e in produzione non si vede niente**. Il
requisito di rete e' invisibile proprio perche' riguarda un momento diverso da quello in cui il
problema si manifesterebbe. Oggi funziona solo perche' la CI ha rete verso Google.

Qui usiamo `next/font/google` in `apps/web/src/app/layout.tsx:3` (IBM Plex Sans e Mono).

**Da non confondere con G-09.** Sono **due sistemi di font distinti**:

|             | Quali              | Quando servono                   | Dove stanno                     |
| ----------- | ------------------ | -------------------------------- | ------------------------------- |
| Interfaccia | IBM Plex Sans/Mono | scaricati **in build** da Google | inglobati nell'artefatto        |
| Report PDF  | sei `.ttf`         | letti **a runtime**              | `apps/web/public/fonts/report/` |

Il secondo e' gia' costato un guasto (G-09). Il primo non si e' ancora manifestato **solo** perche'
non abbiamo mai costruito in un ambiente chiuso.

**Diagnosi.** Prima di spostare la costruzione su un runner interno o una macchina di rilascio
senza uscita verso Internet:

```bash
grep -rn "next/font" apps/web/src
```

**Rimedio.** Se la costruzione dovra' avvenire in rete chiusa, i font vanno scaricati una volta e
serviti da `public/` con `next/font/local`. Finche' si costruisce in CI con rete, non e' urgente —
ma va saputo **prima**, non durante un rilascio.

_(Segnalato dalla sessione gdprhub, che ci si e' imbattuta quando un aggiornamento ha invalidato
la cache dei font e Google ha limitato dodici richieste in raffica: build precedente 0 avvisi di
rete, quella dopo 12, la riprova 0.)_

---

## G-39 — I dati di prova decidono quale codice gira: attraversare una pagina non e' esercitarla

**Sintomo.** La suite end-to-end visitava la pagina di analisi a ogni corsa, su due larghezze,
verificando contenuto, CSP e idratazione. Verde. Eppure **non ha mai scaricato recharts**, cioe'
348 KB, il pezzo piu' costoso di quella pagina.

**Perche' inganna.** Il grafico si disegna **solo con almeno due esercizi** — in
`trend-esercizi.tsx`, cerca la stringa «Servono almeno due esercizi»: con un esercizio solo
compare quella e la libreria non viene mai chiesta. _(Riferimento per contenuto e non per numero
di riga: quel file e' in evoluzione e un numero invecchia in un pomeriggio.)_ Il cliente di prova della suite ne aveva **uno**.

Quindi il test attraversava la pagina piu' pesante **senza mai toccare il caso pesante** — e non
per un difetto del test, ma per una proprieta' dei dati. La stessa trappola colpiva chi guardava
la rete a mano in locale: con un cliente appena creato, il grafico non si disegna e tutto sembra
leggero.

E' la famiglia di G-32 con una causa diversa: li' era cieco lo **strumento**, qui sono muti i
**dati**. Un cancello puo' essere perfetto e restare silenzioso perche' il ramo costoso non viene
mai raggiunto.

**Diagnosi.** Per ogni pagina, chiedersi **quale condizione dei dati accende la parte cara** —
una soglia, un elenco non vuoto, un permesso, uno stato — e verificare che i dati di prova la
superino:

```bash
grep -rn "Servono almeno\|non ci sono\|length > 1\|length >= 2" apps/web/src --include=*.tsx
```

Se un ramo costoso e' protetto da una soglia, **i dati di prova vanno costruiti apposta per
superarla**, altrimenti la copertura e' apparente.

**Rimedio.** `aggiungiEsercizio()` in `apps/web/e2e/dati.ts`, cosi' il cliente di prova della
pagina di analisi ha due esercizi e il grafico si disegna davvero.

> **Dove vive il rimedio, al momento in cui questa voce e' scritta.** `aggiungiEsercizio()`,
> `apps/web/e2e/peso-avvio.spec.ts` e l'`IntersectionObserver` in `trend-esercizi.tsx` stanno
> **sul ramo della PR #6 (`grafici-a-richiesta`), non ancora su `main`**. Su un altro ramo questi
> riferimenti non risolvono, e l'assenza non significa che il rimedio sia stato rimosso — G-36.
> Se non li trovi: `git log --all --oneline -- apps/web/e2e/peso-avvio.spec.ts`.

> **«Il test passa di li'» non significa «il test lo prova».** Fra le due cose stanno i dati.

**Il rovescio, che e' la parte che cambia comportamento.** Questo guasto non nasce da sbadataggine:
nasce **dall'aver fatto la cosa prudente**. Il cliente di prova e' minimo — un esercizio, valori
tondi, nessuna serie storica — e lo e' per una ragione buona: un dato comune ricco cambia i
conteggi sotto i piedi di ogni altro test, su un database condiviso con `workers: 1` e
`fullyParallel: false`.

Ma e' esattamente quella minimalita' a non raggiungere mai i rami costosi. **La cautela che protegge
la suite e' la stessa forza che tiene interi pezzi di prodotto fuori dal cono della rete.** Non va
abbandonata: va messo nel conto il prezzo.

**La via d'uscita, e la regola da seguire:**

> **I dati ricchi se li crea il test che ne ha bisogno, mai la fixture comune.**

Costa una funzione in piu' e non cambia niente a nessuno. Qui `aggiungiEsercizio()` e' chiamata da
un **solo** test, che si crea studio e cliente propri: `creaClienteConEsercizio()` e' rimasta
intatta. Se il secondo esercizio fosse finito li' dentro, i conteggi di ogni altro test sarebbero
cambiati insieme.

**E il cancello nuovo si guarda le spalle da solo.** `peso-avvio.spec.ts` fallisce con un messaggio
esplicito anche quando **nessun chunk contiene recharts** — build vecchia, o libreria rimossa.
Senza quel controllo diventerebbe verde misurando il vuoto: G-32 applicata al test stesso.

_(Scoperto dalla sessione frontend mentre verificava il rinvio di recharts: senza il secondo
esercizio, il nuovo cancello sarebbe stato verde per il motivo sbagliato.)_

---

## G-40 — Prettier letto fuori dal repository e' un altro prettier

**Sintomo.** Per capire se un file committato passa il formattatore, lo si estrae con `git show` in
una cartella temporanea e ci si lancia prettier. Tre file risultano **non formattati**. Nel
repository gli stessi identici byte sono **perfetti**.

**Perche' inganna.** Prettier cerca la configurazione **risalendo dalla cartella del file che sta
controllando**, non da dove lo lanci. Un file estratto fuori dall'albero non trova
`.prettierrc.json` e ricade sui valori predefiniti: `printWidth` **80 invece di 100**. Venti
colonne in meno bastano a far fallire tabelle e firme scritte per stare in cento.

La misura sembra piu' rigorosa di quella normale — «guardo il contenuto committato, non il working
tree, cosi' i fine riga non mi ingannano» — e proprio per questo convince: **si e' tolto di mezzo un
difetto noto e se ne e' introdotto uno ignoto**.

**Diagnosi — la controprova che isola la causa.** Stesso blob, stessa cartella, cambia **solo** la
configurazione:

```bash
T="$(mktemp -d)"; git show "HEAD:deploy/budget-js.mjs" > "$T/budget-js.mjs"
pnpm exec prettier --check "$T/budget-js.mjs"                          # rosso  (printWidth 80)
pnpm exec prettier --config .prettierrc.json --check "$T/budget-js.mjs" # verde  (printWidth 100)
```

Se si vuole controllare un blob committato, o si passa `--config` esplicito, o lo si estrae
**dentro** l'albero:

```bash
mkdir -p .tmp-verifica/<cartella>
git show "HEAD:<file>" | dos2unix > .tmp-verifica/<file>
pnpm exec prettier --check .tmp-verifica && rm -rf .tmp-verifica
```

**Due dettagli da non tramandare sbagliati**, perche' una voce giusta sul meccanismo sbagliato non
serve a nessuno:

- la configurazione di questo progetto sta in **`.prettierrc.json`**, non dentro `package.json`
  (`package.json` contiene solo la dipendenza). Chiederlo allo strumento invece di cercarlo a mano:

  ```bash
  pnpm exec prettier --find-config-path apps/web/e2e/dati.ts   # -> .prettierrc.json
  ```

  Questo dettaglio stava per finire nella voce **sbagliato**, ed e' istruttivo come ci e' arrivato
  vicino: era stato cercato con una catena di ripieghi in un comando solo — `.prettierrc`, poi
  `.prettierrc.json`, poi la chiave in `package.json` — e il risultato era stato letto **senza
  sapere quale ramo l'avesse prodotto**. Aveva risposto il secondo, era stato raccontato il terzo.
  Contenuto giusto, origine sbagliata. **Un output vero letto da un comando ambiguo inganna quanto
  un output falso**, ed e' piu' difficile da sospettare perche' il dato che si vede e' corretto;

- i CRLF **non c'entravano**: `git show` verso una pipe o verso un file ha dato qui lo stesso
  identico conteggio di byte (6478), quindi nessuna conversione era avvenuta. La causa era una
  sola, ed e' la configurazione.

> **Uno strumento che legge la propria configurazione dal percorso cambia identita' col percorso.**
> Vale per prettier, eslint, tsc: spostare un file per esaminarlo puo' cambiare cio' che lo esamina.

---

## G-41 — Un cancello non bloccante che fallisce sempre spegne il segnale di tutti gli altri

**Sintomo.** Ogni corsa della CI su `main` risulta **rossa**, da sempre, per ogni fusione. Tutte.

Non e' un difetto: e' un lavoro **deliberatamente non bloccante** — gli avvisi sulle dipendenze —
tenuto fuori da `needs` ma **senza** `continue-on-error`, proprio perche' si volesse vederlo.

**Perche' inganna.** L'intenzione era la visibilita'; il risultato e' **rumore costante**. Quando
l'esito complessivo e' rosso comunque, «la CI e' rossa» smette di portare informazione — e da li'
a concludere «quel controllo non e' mai stato eseguito» il passo e' breve. E' successo davvero in
questo progetto: guardando una colonna di rossi veri si e' dedotto che il formattatore non fosse
mai passato su tre file, mentre a livello di **singolo lavoro** era `success` e li aveva
approvati.

E' G-33 applicata un livello sopra. Li' era un cancello rumoroso che si smette di leggere; qui e'
un cancello rumoroso che rende illeggibili **tutti gli altri**, perche' ne oscura l'unico
indicatore aggregato.

**Diagnosi.** Mai leggere l'esito complessivo di una corsa che contiene lavori informativi.
Guardare i singoli lavori:

```bash
gh run view <id> --json jobs --jq '.jobs[] | "\(.conclusion)	\(.name)"'
```

**Rimedio.** In astratto le strade sono due — rendere il lavoro non fallente, oppure risolvere le
segnalazioni — e vanno scelte, non lasciate in mezzo.

**In questo progetto la seconda esisteva, e per un giorno l'abbiamo creduta impossibile.**

La prima stesura di questa voce diceva il contrario: che le segnalazioni alte vivessero in eslint,
nella catena di build di Next, in `ajv` sotto il plugin webpack di Sentry e in `shadcn`, e che
quindi **nessuna fosse aggiornabile da qui**, lasciando come unica strada `continue-on-error`.
Il fatto era vero — le portavano davvero quei pacchetti. La conclusione no.

Non si era guardato il dato decisivo: `pnpm audit --json` riporta per ogni avviso le
`patched_versions`, e per **tutte e sei** le librerie esisteva una correzione a una patch di
distanza, **dentro l'intervallo gia' accettato dal pacchetto che le usava**. Una dipendenza
transitiva non si aggiorna dichiarandola, ma il lockfile la aggiorna benissimo:

```bash
pnpm update -r --depth Infinity brace-expansion fast-uri js-yaml browserslist undici ip-address
```

Solo `pnpm-lock.yaml` toccato, nessun `package.json`, nessuna versione principale cambiata.
Albero completo da **18 alti a 0**, `--prod` da 10 a 0 (resta l'eccezione dichiarata su
`nanoid`, che vive dentro `next/dist/compiled`). Verificato con lint, golden, build da cache
vuota, tetto JS e i 19 end-to-end: nessun effetto. Il lavoro `avvisi` e' tornato verde **senza
spegnerlo**.

> **L'albero delle dipendenze dice CHI porta un avviso, non SE si puo' correggere.** Prima di
> dichiararlo irrisolvibile si guardano `patched_versions` e l'intervallo del genitore.

E' G-42 alla seconda istanza, nello stesso giorno: un fatto verificato — «le portano eslint e Next»
— da cui si e' tratta un'inferenza piu' larga di quanto il fatto reggesse.

**Quindi l'ordine dei rimedi, quando questo lavoro torna rosso:** prima l'aggiornamento del
lockfile e la verifica completa, build compresa; `continue-on-error` solo se una correzione davvero
non esiste, dichiarandolo nel commento accanto con la data della misura, perche' e' una rinuncia e
non una pulizia.

_(Paragrafo corretto dalla sessione frontend il 21 settembre, dopo la chiusura della sessione che
aveva scritto la voce: la premessa sbagliata gliel'aveva passata proprio la sessione frontend.)_

> **Un allarme che suona sempre non e' un allarme: e' il rumore di fondo sopra cui non si sente
> piu' niente.**

---

## G-42 — Una ricerca negativa vale solo quanto lo spazio che copre

**Sintomo.** `shadcn` risulta una dipendenza di sviluppo **non usata da nessuno**: non compare negli
script di alcun `package.json`, non nei workflow, non nel Dockerfile, non fra gli `import` del
sorgente TypeScript. Quattro ricerche, tutte corrette. Conclusione: si puo' rimuovere, e con essa
lo stack che si porta dietro (express, hono, ajv, express-rate-limit, dotenvx).

Tolta la riga, **lint verde, typecheck verde, 186 pacchetti in meno**. Poi la build:

```
CssSyntaxError: Can't resolve 'shadcn/tailwind.css' in apps/web/src/app
```

`apps/web/src/app/globals.css:3` fa `@import "shadcn/tailwind.css"`, e il pacchetto spedisce
`dist/tailwind.css`. **Non e' una CLI occasionale: e' una dipendenza di build.**

**Perche' inganna.** Nessuna delle quattro ricerche era sbagliata; nessuna poteva trovare un
`@import` dentro un foglio di stile. Si cerca bene **dove ci si aspetta che la cosa sia**, e si
conclude l'assenza da una ricerca che non avrebbe potuto trovarla. E' la stessa forma di G-35, dove
una scansione di `node_modules` non guardava dentro `next/dist/compiled`.

Due segnali c'erano e sono stati mancati da due sessioni insieme: `components.json` dichiarava
`"style": "radix-nova"`, cioe' che la versione della CLI conta; e una seconda sessione ha
**confermato** l'analisi con una ricerca che filtrava `*.json`, `*.yml`, `*.md` e `Dockerfile` —
**nessun CSS**. Una conferma ottenuta con lo stesso punto cieco non e' una conferma: e' lo stesso
esperimento ripetuto.

**Diagnosi.** Il punto trasferibile non e' «cercare anche nei CSS». E':

> **Lo spazio della ricerca va dichiarato insieme al risultato.**
>
> «Non compare da nessuna parte» era **falso**.
> «Non compare in `package.json`, workflow, Dockerfile e import JS/TS» era **vero** — e avrebbe
> fatto vedere il buco a chiunque lo leggesse.

La formulazione onesta contiene la propria confutazione; quella comoda no.

**Rimedio.** Per una dipendenza che si sospetta inutile, la prova non e' la ricerca: e' **togliere e
costruire**. Lint e typecheck non guardano i fogli di stile, quindi restano verdi e confermano la
tesi sbagliata.

```bash
grep -rn "shadcn" apps/web/src --include=*.css --include=*.scss
pnpm --filter web build      # l'unica prova che vale
```

Il prezzo evitato era concreto: senza la build, quella modifica sarebbe passata da lint e typecheck
e avrebbe rotto la costruzione dell'immagine in CI.

---

## G-43 — Causa rimossa, sintomo identico: la cache di Turbopack sopravvive al ripristino

**Sintomo.** Dopo aver annullato una modifica che rompeva la build e aver reinstallato le
dipendenze, **la build continua a fallire con lo stesso identico errore**. Per qualche minuto
sembra che il ripristino non abbia funzionato, o che il danno sia piu' profondo.

**Perche' inganna.** L'errore e' identico parola per parola, quindi la mente lo legge come
«il problema c'e' ancora» invece che «sto guardando un residuo». La causa era gia' sparita: a
parlare era la cache di Turbopack in `apps/web/.next`, scritta durante la build rotta.

**Rimedio.**

```bash
rm -rf apps/web/.next && pnpm --filter web build
```

> **Un sintomo che sopravvive alla sua causa sta descrivendo il passato.** Dopo un ripristino, la
> prima cosa da invalidare e' la cache, non la diagnosi.

---

## G-44 — Il primo deployment di un progetto Vercel nuovo è di PRODUZIONE, anche da un ramo qualunque

**Sintomo.** Si crea un progetto Vercel collegato al repository, con ramo di produzione `main`, e
si spinge un ramo di lavoro (`landing`) per avere un'anteprima. Il deployment che parte è marcato
**`target: production`** e si prende l'**alias di produzione** del progetto, pur venendo da un ramo
che non è `main`.

Osservato il 24/09 su `finbeacon-landing`: il primo deployment (`landing`, commit `d578f2f`) era
`production`; il deployment del push successivo, dallo stesso ramo, era `preview`.

**Perché inganna.** Tutto dice «anteprima»: il ramo non è quello di produzione, la PR è aperta, il
commento di Vercel sulla PR parla di preview. Nessuno si aspetta che un ramo non rivisto finisca
sull'indirizzo di produzione del progetto.

**Cosa l'ha fermato.** Il cancello di lancio (`apps/landing/scripts/verifica-lancio.mjs`) blocca il
build quando `VERCEL_ENV=production` e mancano i dati obbligatori. È scattato **su quello che si
credeva un'anteprima**, ed è stato così che la cosa si è vista. Senza quel controllo il ramo sarebbe
andato in produzione senza che nessuno lo decidesse.

**Diagnosi.**

```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN"   "https://api.vercel.com/v6/deployments?projectId=<progetto>&teamId=<team>&limit=5"   | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const x of JSON.parse(d).deployments)console.log(x.state,x.target||"preview",x.meta.githubCommitRef)})'
```

**Rimedio.** Per un progetto nuovo: o il primo push viene da `main` quando è pronto per la
produzione, o si crea esplicitamente un'anteprima via API (`POST /v13/deployments` con `gitSource` e
senza `target`). E un build che vale per la produzione deve avere un **cancello che lo sa
distinguere**: è stato l'unico motivo per cui questo si è visto.

> **Chi decide cos'è «produzione» è la piattaforma, non il nome del ramo.** Verificare il `target`,
> non dedurlo.

---

## G-45 — I valori che una piattaforma assegna non sono quelli che si ricordano

**Sintomo.** Due valori scritti a memoria, entrambi plausibili, entrambi sbagliati, nella stessa
giornata e nello stesso progetto:

| Cosa                | Scritto a memoria                             | Assegnato davvero da Vercel                                                                       |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Record per l'apex   | `A 76.76.21.21`, `CNAME cname.vercel-dns.com` | **due** A (`216.150.1.1`, `216.150.16.1`) e un CNAME **del progetto** (`<id>.vercel-dns-016.com`) |
| Alias di produzione | `finbeacon-landing.vercel.app`                | `finbeacon-landing-docallfixs-projects.vercel.app`                                                |

**Perché inganna.** I valori a memoria sono quelli **della documentazione di qualche anno fa** e di
mille guide: non sono inventati, sono datati. Il primo avrebbe prodotto uno switch DNS che «funziona
a metà» (un solo indirizzo dei due, su un'infrastruttura che nel frattempo è cambiata); il secondo
un redirect che non scatta mai, con la pagina indicizzabile a due indirizzi. **Nessuno dei due dà
errore.**

**Diagnosi.** Leggere dalla piattaforma, dopo aver creato la risorsa:

```bash
# record richiesti per un dominio aggiunto al progetto
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v6/domains/<dominio>/config?teamId=<team>"
# alias realmente assegnati a un deployment
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v13/deployments/<id>?teamId=<team>"
```

**Rimedio.** `deploy/dns-landing.sh` accetta più indirizzi e i valori si passano dopo averli letti
da Vercel. Il redirect verso l'host canonico non elenca più gli alias per nome: **in produzione ogni
host diverso da `finbeacon.eu`** rimanda lì (`apps/landing/next.config.ts`), e copre anche gli alias
futuri.

> **Un valore che la piattaforma assegna si legge dalla piattaforma.** Scriverlo a memoria è
> dedurre invece di verificare, con l'aggravante che la memoria ha una data.

---

## Come si aggiunge una voce

1. Numero progressivo `G-nn`.
2. **Sintomo**: cosa si vede, con il messaggio letterale.
3. **Perché inganna**: la ragione per cui la diagnosi ovvia è sbagliata. È la parte che fa
   risparmiare tempo a chi verrà dopo: una voce senza questa sezione vale poco.
4. **Diagnosi**: un comando che si può incollare.
5. **Rimedio**: la correzione, e il file dove vive.
