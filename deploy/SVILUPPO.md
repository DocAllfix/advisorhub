# SVILUPPO — ambiente locale, passo per passo

Procedura da seguire alla lettera per avere l'applicazione funzionante in locale, con
database e posta propri, **senza toccare il database di produzione**.

Ogni passo ha una **verifica**: non si prosegue finché non dà il risultato atteso. Se un
passo fallisce, il rimedio è quasi sempre in [GUASTI.md](GUASTI.md), indicato con `G-nn`.

Prerequisiti: Docker Desktop attivo, Node 22+, `pnpm` 11.

---

## 1. Dipendenze

```bash
pnpm install --frozen-lockfile
```

---

## 2. Database e posta

```bash
docker compose -f deploy/docker-compose.dev.yml up -d
docker compose -f deploy/docker-compose.dev.yml ps
```

**Verifica:** entrambi i servizi `healthy`.

| Servizio  | Dove                                                       | A cosa serve                                |
| --------- | ---------------------------------------------------------- | ------------------------------------------- |
| `db`      | `localhost:5433`                                           | PostgreSQL 17 di sviluppo                   |
| `mailpit` | SMTP `localhost:1025`, interfaccia <http://localhost:8025> | Cattura **ogni** email: nulla parte davvero |

Il compose dichiara `name: advisorhub-dev`. Non toglierlo: senza, Docker deriva il nome
dalla cartella (`deploy`) e i container collidono con gli altri prodotti sulla stessa
macchina — **G-01**.

La porta è `5433`, non `5432`, perché la standard è spesso occupata — **G-02**.

---

## 3. File d'ambiente

Crea `apps/web/.env.local` (è gitignorato, e ha precedenza su `.env`):

```bash
DATABASE_URL=postgresql://advisorhub:sviluppo@localhost:5433/advisorhub
DIRECT_URL=postgresql://advisorhub:sviluppo@localhost:5433/advisorhub
BETTER_AUTH_SECRET=<openssl rand -hex 32>
BETTER_AUTH_URL=http://localhost:3000
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=no-reply@advisorhub.local
NEXT_PUBLIC_REGISTRAZIONE_APERTA=true
```

> **Attenzione.** `apps/web/.env` punta al database **di produzione**. I due caricatori di
> variabili in uso hanno precedenze opposte (`node --env-file`: vince l'ultimo; `dotenv`:
> vince il primo) — **G-03** e **G-04**. Gli script del repo sono già impostati
> correttamente: non cambiarne l'ordine senza aver letto quelle due voci.

---

## 4. Migrazioni

```bash
pnpm --filter web db:migrate
```

**Verifica:** l'output stampa il bersaglio e il conteggio finale.

```
[migra] bersaglio:  localhost:5433/advisorhub
[migra] migrazioni: …/apps/web/drizzle
[migra] fatto: 14 tabelle nello schema public.
```

Se il bersaglio non è `localhost:5433`, fermati: stai per migrare un altro database.

> Non usare `drizzle-kit migrate`: dichiara successo **senza applicare nulla** — **G-05**.
> Resta disponibile come `db:migrate:kit`. `db:generate` e `drizzle-kit check` vanno bene.

---

## 5. Dati dimostrativi

```bash
pnpm --filter web db:seed-demo          # richiede l'app in esecuzione (passo 6)
```

**Verifica:** i punteggi devono essere **91** (Mario Rossi Spa) e **49** (Luca Bianchi Spa).
Sono gli stessi dei golden test: se differiscono, il motore è cambiato e i report già
consegnati al committente non sono più coerenti.

Accesso creato: `demo@advisorhub.it` / `DemoAdvisor2026!`

---

## 6. Avvio

**Sviluppo** (ricaricamento a caldo):

```bash
pnpm dev
```

**Build di produzione** — è quella su cui vanno fatte le verifiche serie:

```bash
pnpm --filter web build
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/
pnpm --filter web start
```

> `next start` **non** funziona con `output: "standalone"`: parte, dice `Ready`, e risponde
> 500 a tutto — **G-06**. Lo script `start` esegue già il server standalone.
> `.next/static` va copiato a mano; `public/` no, Next lo copia da sé.

**Worker della posta**, in un secondo terminale:

```bash
pnpm --filter web posta
```

Senza worker le email restano in coda e non partono: è il comportamento corretto, non un guasto.

---

## 7. Verifiche di sanità

Da eseguire **tutte** prima di dichiarare l'ambiente pronto.

### 7.1 Salute profonda

```bash
curl -s http://localhost:3000/api/health
# {"status":"ok","db":"up","version":"…"}

docker stop advisorhub-dev-db-1
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/health   # 503
docker start advisorhub-dev-db-1
curl -s http://localhost:3000/api/health                                    # di nuovo ok
```

Il server **non deve riavviarsi** durante questa prova: se muore, manca il gestore d'errore
sul pool — **G-12**.

### 7.2 Recupero password, end-to-end

```bash
O='Origin: http://localhost:3000'

# 1. richiesta
curl -s -X POST http://localhost:3000/api/auth/request-password-reset \
  -H 'Content-Type: application/json' -H "$O" \
  -d '{"email":"demo@advisorhub.it","redirectTo":"/reimposta-password"}'

# 2. il messaggio è in coda
docker exec advisorhub-dev-db-1 psql -U advisorhub -d advisorhub \
  -c "select oggetto, tentativi, inviata_at from mail_outbox order by created_at desc limit 1;"

# 3. il worker lo spedisce  →  leggilo su http://localhost:8025
# 4. segui il link della mail: reindirizza a /reimposta-password?token=…
```

**Verifica finale:** la vecchia password deve dare **401**, la nuova **200**.

### 7.3 La prova che giustifica la coda

```bash
docker stop advisorhub-dev-mailpit-1
# richiedi un recupero password  →  deve rispondere 200 lo stesso
# la riga resta in coda, `tentativi` sale a ogni giro del worker
docker start advisorhub-dev-mailpit-1
# il worker riparte da solo e la spedisce
```

Se la richiesta dell'utente fallisce quando il relay è giù, la coda non sta funzionando.

### 7.4 Report PDF

```bash
curl -s -c /tmp/c.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H 'Content-Type: application/json' -H "$O" \
  -d '{"email":"demo@advisorhub.it","password":"DemoAdvisor2026!"}'

CLID=$(docker exec advisorhub-dev-db-1 psql -U advisorhub -d advisorhub -tA \
  -c "select id from clienti where ragione_sociale like 'Mario Rossi%' limit 1;" | tr -d '\r')

curl -s -b /tmp/c.txt -o /tmp/report.pdf "http://localhost:3000/api/report/$CLID"
head -c 8 /tmp/report.pdf     # deve iniziare con %PDF
```

Va provato **sulla build standalone**, non solo in `pnpm dev`: è l'unico modo di accorgersi
del percorso dei font — **G-09**.

### 7.5 Isolamento fra studi

Con un secondo studio, chiedere il report di un cliente del primo: deve rispondere
**404 `Cliente non trovato.`**, mai 200, mai 403.

È la regola 3 del `CLAUDE.md` del progetto, e va verificata su **ogni nuova superficie**.

### 7.6 Suite completa

```bash
pnpm lint && pnpm test && bash deploy/check-no-secrets.sh
```

`pnpm test` deve chiudere con **143 test verdi**, golden inclusi.
`check-no-secrets.sh` deve stampare `RISULTATO: pulito` (esce 1 se trova qualcosa).

> `pnpm format` fallisce su Windows per i fine riga (CRLF): non e' un problema di
> stile. Su Linux, dove gira la CI, passa. Per controllare davvero, guarda il
> contenuto normalizzato a LF.

### 7.7 Test end-to-end

Girano contro la **build di produzione** e coprono i cinque punti che prima erano
verificati solo a mano: salute, recupero password, isolamento fra studi, report PDF,
interfaccia sotto CSP.

```bash
docker compose -f deploy/docker-compose.dev.yml up -d   # database + Mailpit
pnpm --filter web e2e:prepara                            # build + static + worker
pnpm --filter web test:e2e
```

Attesi: **14 test verdi**, circa un minuto.

`e2e:prepara` fa tre cose che vanno insieme: `next build`, la copia di `.next/static`
dentro lo standalone (**G-06**), e il bundle del worker della posta — che il
`globalSetup` avvia per drenare la coda durante i test.

Se i test sulla posta scadono, la coda dice il perche':

```bash
docker exec advisorhub-dev-db-1 psql -U advisorhub -d advisorhub   -c "select destinatario, tentativi, ultimo_errore from mail_outbox where inviata_at is null;"
```

> **Non scrivere i log dei test in `/tmp`**: in Git Bash su Windows e' una cartella
> comune e altri progetti sulla stessa macchina ci scrivono sopra — **G-22**. Usa la
> cartella riservata alla sessione.

---

## 8. Pulizia

```bash
# dati di prova
docker exec advisorhub-dev-db-1 psql -U advisorhub -d advisorhub \
  -c "delete from \"user\" where email like '%@advisorhub.local';"

# ambiente
docker compose -f deploy/docker-compose.dev.yml down          # tiene i dati
docker compose -f deploy/docker-compose.dev.yml down -v       # cancella anche il volume
```

Non usare `--remove-orphans` su questa macchina: porterebbe via i container degli altri
prodotti — **G-01**.

---

## Note per chi automatizza

- `curl` non manda l'header `Origin`, che Better Auth pretende sulle richieste che
  modificano stato: aggiungilo sempre — **G-08**.
- Su Windows con Git Bash, i percorsi assoluti nei comandi Docker vengono riscritti:
  `MSYS_NO_PATHCONV=1` — **G-16**.
- Migratore e worker esistono anche come **bundle autosufficienti** (`pnpm --filter web
build:migratore`, `build:worker`): girano con `node` da una cartella priva di
  `node_modules`. Serve per i container, dove `drizzle-orm` **non** è presente — **G-13**.
