# CLAUDE.md - Direttive Operative di Sistema

## 1. Pensa prima di agire

**Non dare per scontato. Non nascondere la confusione. Esponi i compromessi.**

- Dichiara esplicitamente le tue assunzioni. Se una funzionalità, un file o un flusso non ti è chiaro, fermati e chiedi.
- Presenta sempre le alternative architettoniche prima di scrivere codice.

## 2. Semplicità prima di tutto

**Il minimo indispensabile per risolvere il problema. Niente astrazioni premature.**

- Scrivi codice pulito, lineare e moderno. Evita l'over-engineering se non porta un reale valore dimostrabile.

## 3. Modifiche chirurgiche

**Tocca solo ciò che devi. Pulisci solo il tuo disordine.**

- Quando scriveremo codice, modificherai esclusivamente i file necessari. Nessun refactoring a cascata non richiesto.

## 4. Esecuzione guidata da obiettivi

**Definisci criteri di successo verificabili. Itera fino alla verifica.**

- Ogni tuo output deve avere un obiettivo chiaro. Per la fase di analisi, l'obiettivo è una scomposizione totale e analitica degli asset di partenza.

---

## CONTESTO DEL PROGETTO

SaaS per commercialisti (nome di lavoro: **advisorhub**) che monitora la salute economico-finanziaria del portafoglio clienti dello studio. Nasce dal prototipo HTML in `archivio/` e ne conserva integralmente formule, soglie e testi, portandoli su uno stack moderno e su un'estetica premium, lontana dai layout raw.

**MVP completato** (fasi 0-10). Stato e riferimenti:

- `README.md` — avvio, variabili d'ambiente, comandi, deploy, sicurezza
- `PRODUCT.md` — utenti, scopo, personalità, anti-riferimenti, principi (letto dalle skill di design)
- `DESIGN.md` — tema, colore, tipografia, componenti, motion, divieti
- `ANALISI.md` — radiografia del prototipo e addendum sul DSCR previsionale 6M

### Stack

Monorepo pnpm: `apps/web` (Next.js App Router, TypeScript, Tailwind v4, shadcn/ui) e `packages/engine` (motore di calcolo TypeScript puro). Database PostgreSQL su Supabase EU con Drizzle; autenticazione Better Auth con plugin organization (studio = organization).

### Regole specifiche di questo progetto

1. **Il motore è l'unica fonte di verità** di formule, soglie, giudizi e testi. Dashboard, report, import/export e simulatore leggono da lì: nessun calcolo duplicato nella UI.
2. **I golden test non si toccano.** `packages/engine/test/golden.test.ts` verifica l'output sui due CSV reali dell'archivio (score 91 "Eccellenza gestionale" e 49 "Equilibrio fragile"): se cambiano, il prodotto non è più coerente con i report già consegnati al committente.
3. **Tenant scoping sempre da `requireStudio()`**, mai da input del client. Ogni nuova query o azione di dominio parte da lì; per ogni superficie nuova va verificato che un altro studio riceva 404.
4. **Prima di costruire interfacce** si passa da `/impeccable shape` con brief confermato dall'utente, poi critique/audit e screenshot ai breakpoint. `ui-ux-pro-max` si usa a supporto, filtrato dalle leggi di impeccable.
5. **Ogni fase si chiude con una verifica eseguita**, non dichiarata: e2e Playwright su build di produzione, query dirette sul database, Lighthouse dove c'è UI. I dati di test vanno ripuliti a fine verifica.

### Fuori scope MVP, già identificato

Import XBRL dei bilanci CCIAA, funzioni AI (commento di bilancio, chat sui dati, estrazione da PDF), benchmark per ATECO, alert automatici sulle soglie CCII, portale cliente in sola lettura, billing, archivio server-side dei report.
