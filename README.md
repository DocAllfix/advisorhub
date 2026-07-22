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
| Motore di calcolo  | `packages/engine`: TypeScript puro, zero dipendenze, 128 test |

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

## Attivare Sentry

1. Crea un progetto su Sentry e copia il DSN
2. Aggiungi `NEXT_PUBLIC_SENTRY_DSN` alle variabili d'ambiente (locale e hosting)
3. Riavvia: la telemetria parte da sola, non serve altro codice

Per il caricamento delle source map in fase di build servono anche `SENTRY_ORG`, `SENTRY_PROJECT` e `SENTRY_AUTH_TOKEN`.

Attenzione alla CSP: `connect-src` in `next.config.ts` è chiuso su `'self'`, quindi va aggiunto l'host di ingest di Sentry (`https://*.ingest.sentry.io`) perché gli eventi possano partire.

## Deploy

L'app è un monolite Next.js: funziona su qualsiasi hosting che supporti Node.

1. Collega il repository all'hosting (per esempio Vercel) e scegli una **region EU**, coerente col database
2. Su Vercel: **Root Directory** `apps/web`. È un monorepo pnpm e il pacchetto `engine` sta fuori da quella cartella, quindi l'installazione deve partire dalla radice
3. Imposta le variabili d'ambiente della tabella sopra, e dopo il primo deploy correggi `BETTER_AUTH_URL` col dominio reale (Better Auth lo legge all'avvio: se resta sbagliato la sessione non si aggancia)
4. Applica le migration verso il database di produzione: `pnpm --filter web db:migrate`
5. Verifica il primo accesso: registrazione studio, creazione cliente, esercizio, analisi, report

### Versione dimostrativa

Uno studio può essere marcato come dimostrativo: resta consultabile (analisi,
simulatore, download del report) ma ogni scrittura è rifiutata dal server con
un messaggio esplicito, così i due clienti di esempio non sono alterabili.

```bash
node scripts/imposta-demo.mjs demo@advisorhub.it        # attiva
node scripts/imposta-demo.mjs demo@advisorhub.it --off  # disattiva
```

La creazione di nuovi studi dalla pagina pubblica è chiusa in produzione: gli
accessi si consegnano a mano. Resta aperta in sviluppo (i collaudi ne creano),
e l'ingresso su invito non è mai bloccato.

| Variabile | Effetto |
| --- | --- |
| `NEXT_PUBLIC_REGISTRAZIONE_APERTA=true` | Riapre la registrazione pubblica anche in produzione |

### Identità git

Vercel rifiuta di costruire un commit il cui autore non corrisponde a un account
GitHub. Il repository è configurato con l'indirizzo `noreply` dell'account, che
funziona anche con l'email privata:

```bash
git config user.email "196784133+DocAllfix@users.noreply.github.com"
```

Se cambi macchina, ripeti il comando: una `user.email` diversa blocca il deploy
con «commit email could not be matched to a GitHub account».

La CI su GitHub (`.github/workflows/ci.yml`) esegue formattazione, lint, typecheck, test e build a ogni push e pull request.

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
