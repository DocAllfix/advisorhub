# advisorhub

SaaS per commercialisti: monitoraggio della salute economico-finanziaria del portafoglio clienti dello studio. Trasforma i dati di bilancio in indicatori, giudizi e azioni, con report da consegnare a cliente e banca.

Nome di lavoro; il brand commerciale non è ancora deciso.

## Cosa fa

- **Portafoglio clienti** dello studio, con ricerca, ordinamento e archiviazione reversibile
- **Esercizi di bilancio** per cliente: 10 grandezze storiche più 4 previsionali a 6 mesi, inseribili a mano o da CSV
- **Analisi**: 7 indicatori (ROS, Turnover, ROI, ROI-I, ROE, GI, DSCR) con giudizio, soglia e azione consigliata; punteggio di sintesi 0-100; **DSCR prospettico 6M** ex art. 3 CCII secondo le linee guida CNDCEC
- **Simulatore what-if** che ricalcola in tempo reale senza toccare i dati salvati
- **Andamento tra esercizi** e **report PDF** su tre pagine, con il classico tasto Stampa / Salva come PDF
- Multi-studio: ogni studio vede solo i propri clienti, con inviti ai collaboratori

## Architettura

| Livello            | Scelta                                                        |
| ------------------ | ------------------------------------------------------------- |
| Monorepo           | pnpm workspaces: `apps/web`, `packages/engine`                |
| Frontend e backend | Next.js (App Router, TypeScript, server actions)              |
| UI                 | Tailwind v4 + shadcn/ui, IBM Plex, token OKLCH                |
| Database           | PostgreSQL (Supabase, region EU) con Drizzle ORM              |
| Autenticazione     | Better Auth con plugin organization (studio = organization)   |
| Motore di calcolo  | `packages/engine`: TypeScript puro, zero dipendenze, 143 test |

Il motore è l'unica fonte di verità di formule, soglie e testi: lo usano la dashboard, il report, l'import/export e il simulatore. È verificato con **golden test** sui due export CSV reali del prototipo, così l'output resta identico ai report già consegnati.

## Avvio in locale

```bash
pnpm install
cp apps/web/.env.example apps/web/.env   # poi compila i valori
pnpm --filter web db:migrate             # applica le migration
pnpm --filter web db:seed                # (opzionale) studio demo con 2 clienti
pnpm dev                                 # http://localhost:3000
```

### Variabili d'ambiente (`apps/web/.env`)

| Variabile                | Obbligatoria | A cosa serve                                                           |
| ------------------------ | ------------ | ---------------------------------------------------------------------- |
| `DATABASE_URL`           | sì           | Postgres a runtime. Su Supabase: **transaction pooler**, porta 6543    |
| `DIRECT_URL`             | sì           | Postgres per le migration. Su Supabase: **session pooler**, porta 5432 |
| `BETTER_AUTH_SECRET`     | sì           | Segreto delle sessioni (`openssl rand -hex 32`)                        |
| `BETTER_AUTH_URL`        | sì           | URL pubblico dell'app                                                  |
| `NEXT_PUBLIC_SENTRY_DSN` | no           | Attiva la telemetria degli errori (senza, resta inattiva)              |

Nota su Supabase: se la password contiene caratteri speciali vanno codificati nell'URI (`%` diventa `%25`, `@` diventa `%40`). L'host diretto `db.<ref>.supabase.co` è raggiungibile solo via IPv6: da reti IPv4 usa il session pooler anche per `DIRECT_URL`.

## Comandi

| Comando                         | Cosa fa                                     |
| ------------------------------- | ------------------------------------------- |
| `pnpm dev`                      | Avvia l'app in sviluppo                     |
| `pnpm build`                    | Build di produzione (include il typecheck)  |
| `pnpm lint`                     | ESLint sull'app e typecheck del motore      |
| `pnpm test`                     | Test del motore di calcolo                  |
| `pnpm format` / `format:fix`    | Verifica / applica la formattazione         |
| `pnpm --filter web db:generate` | Genera una migration dallo schema           |
| `pnpm --filter web db:migrate`  | Applica le migration                        |
| `pnpm --filter web db:seed`     | Studio demo con i due clienti dell'archivio |

## Sicurezza

- Ogni query e ogni azione parte da `requireStudio()`, che risolve lo studio **dalla sessione** e mai da input del client; l'identificativo di un altro studio produce 404
- Cookie di sessione HttpOnly e SameSite, nessun token in localStorage
- Rate limiting sugli endpoint di autenticazione e sugli inviti
- Security headers e CSP impostati in `next.config.ts`
- Le mutazioni sono tracciate in `audit_log` per studio

## Attivare la telemetria

Il collettore è **GlitchTip** self-hosted sul control plane: parla il protocollo
Sentry, quindi si usa lo stesso SDK e cambia solo il DSN.

1. Crea il progetto sul control plane — uno **per cliente**, non per prodotto: il
   collettore è condiviso fra prodotti e aggrega tracce di titolari del
   trattamento diversi, quindi `environment` non basta a isolare gli accessi
2. Passa il DSN come **build arg** dell'immagine: Next incorpora le
   `NEXT_PUBLIC_*` a build time, non le legge a runtime
3. Per le source map servono anche `SENTRY_ORG`, `SENTRY_PROJECT`,
   `SENTRY_AUTH_TOKEN` e `SENTRY_URL`: senza, gli stack trace arrivano
   minificati, cioè inutili proprio quando servono

La CSP non va più toccata a mano: `next.config.ts` ricava l'origine del
collettore dal DSN e la aggiunge a `connect-src`. Prima era chiusa su `'self'`, e
con il DSN impostato il browser **bloccava gli eventi in silenzio** — si credeva
di avere la telemetria senza averla.

## Deploy

**Un server Hetzner dedicato per cliente**, sottodominio sul dominio-brand, TLS
automatico. Il cliente non configura nulla.

```bash
export IMMAGINE=ghcr.io/<org>/advisorhub:<git-sha>
./deploy/provision-cliente.sh acme --studio "Studio Rossi" --email referente@studiorossi.it
```

Quindici passi — server, firewall, DNS, segreti, stack, titolare, backup,
sorveglianza — con stop al primo che non torna. La procedura completa, i cancelli
e i rimedi stanno in **[deploy/RUNBOOK.md](deploy/RUNBOOK.md)**; i guasti
realmente incontrati, con diagnosi e rimedio, in
**[deploy/GUASTI.md](deploy/GUASTI.md)**.

L'immagine (~320 MB) la costruisce la CI e finisce su GHCR: le istanze fanno
`pull`, non build. Così tutti i clienti girano **lo stesso identico binario** e un
aggiornamento dura secondi invece di minuti.

Sul server girano cinque servizi: `caddy` (unico a pubblicare porte), `web`, `db`
(mai esposto), `posta` (drena la coda dei messaggi) e `autoheal`. Le migrazioni
girano in un container a sé **prima** del web, così non esiste il caso «codice
nuovo, schema vecchio».

### Versione dimostrativa

Uno studio può essere marcato come dimostrativo: resta consultabile (analisi,
simulatore, download del report) ma ogni scrittura è rifiutata dal server con
un messaggio esplicito, così i due clienti di esempio non sono alterabili.

```bash
node scripts/imposta-demo.mjs demo@advisorhub.it        # attiva
node scripts/imposta-demo.mjs demo@advisorhub.it --off  # disattiva
```

La creazione di nuovi studi dalla pagina pubblica è chiusa in produzione: il
titolare lo crea il provisioning, e riceve per email il link con cui imposta la
propria password — nessuna credenziale viene mai consegnata a mano.

> La posta parte dalla casella del dominio-brand, che arriva insieme al dominio
> stesso (`smtp.hostinger.com`): nessun fornitore transazionale in più. Se
> `SMTP_HOST` resta vuoto i messaggi restano in coda **senza errore**, e il
> recupero password smette di funzionare in silenzio — vedi
> [deploy/RUNBOOK.md](deploy/RUNBOOK.md) §0.1.

Il cancello è **lato server** e non spegne l'endpoint di registrazione: la regola
è _nessuno si registra da solo, ma chi ha un invito valido sì_, verificata
sull'invito (in attesa e non scaduto) in `databaseHooks.user.create.before`.
Con `disableSignUp` di Better Auth invitare un collaboratore era **impossibile**:
l'invito partiva, la mail arrivava, e il link non poteva funzionare.

| Variabile                               | Dove        | Effetto                                                                                                    |
| --------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `REGISTRAZIONE_APERTA=true`             | server      | Apre la registrazione libera. Il provisioning la usa solo per il container una-tantum che crea il titolare |
| `NEXT_PUBLIC_REGISTRAZIONE_APERTA=true` | interfaccia | Mostra il modulo di iscrizione. Da sola non apre nulla                                                     |

### Identità git

Il repository è configurato con l'indirizzo `noreply` dell'account GitHub, che
funziona anche con l'email privata:

```bash
git config user.email "196784133+DocAllfix@users.noreply.github.com"
```

Se cambi macchina, ripeti il comando.

## Verifiche

La CI (`.github/workflows/ci.yml`) ha quattro cancelli a ogni push e pull request:

| Job         | Cosa verifica                                                                             |
| ----------- | ----------------------------------------------------------------------------------------- |
| `qualita`   | formattazione, lint, typecheck, test del motore, build di produzione                      |
| `schema`    | le migrazioni si applicano su un database vuoto, e non c'è deriva fra schema e migrazioni |
| `e2e`       | 16 test end-to-end contro la **build standalone**, con Postgres e Mailpit                 |
| `sicurezza` | `pnpm audit` e il cancello anti-segreti                                                   |

In locale:

```bash
pnpm lint && pnpm test              # 143 test del motore, golden inclusi
pnpm --filter web test:e2e          # 16 end-to-end (serve docker-compose.dev.yml)
bash deploy/check-no-secrets.sh     # deve stampare "pulito"
```

I test end-to-end girano contro il **server standalone**, non contro `next dev`: è
l'unico modo di intercettare i difetti che vivono solo nell'artefatto che va in
produzione — per esempio il percorso dei font del report, che in sviluppo
funzionava e nell'immagine no.

## Struttura

```
apps/web/src
  app/            rotte: (auth), app/ (shell e viste), stampa/ (report)
  components/     app-shell e libreria UI
  lib/            auth, db, schema, clienti/, esercizi/, analisi/
packages/engine   formule, soglie, giudizi, testi, CSV (TypeScript puro)
archivio/         prototipi HTML e CSV/PDF di riferimento
```

`PRODUCT.md` e `DESIGN.md` contengono le direttive di prodotto e di design seguite dalle interfacce; `ANALISI.md` la radiografia del prototipo di partenza.
