# Radiografia del progetto e proposta — SaaS per commercialisti

Data analisi: 21/07/2026. Fonti: archivio `Programma per commercialisti.zip` (1 HTML, 2 CSV, 2 PDF), skill impeccable + ui-ux-pro-max, ricerca web.

---

## 1. Natura del servizio e logica di business

Il prototipo è una **dashboard interattiva di analisi economico-finanziaria per singola azienda cliente**, pensata perché il commercialista:

1. inserisca 10 grandezze di bilancio (a cursori o import CSV),
2. ottenga in tempo reale 8 indicatori con formula, giudizio semaforico e consiglio operativo,
3. consegni al cliente un report PDF (stampa della dashboard) e archivi un CSV.

I due PDF ("Mario Rossi report KPI", "Luca Bianchi report KPI") sono esattamente questo: la dashboard in tema chiaro stampata, con due scenari opposti (azienda eccellente 91/100 vs "equilibrio fragile" 49/100). I CSV sono gli export corrispondenti (19 colonne: input + indicatori calcolati + data).

### Input (10 cursori con range e step)

Valore della Produzione, Fatturato, Reddito Operativo (può essere negativo), Capitale Investito, Patrimonio Netto, Utile Netto (negativo ammesso), EBITDA/MOL (negativo ammesso), PFN, Servizio del Debito Annuo, Flusso di Cassa Operativo.

### Motore di calcolo (estratto dal bundle minificato)

| Indicatore | Formula                                       | Soglie giudizio                                                                   |
| ---------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| ROS %      | RO / Valore Produzione × 100                  | <2 Critico, <5 Sufficiente, <10 Buono, ≥10 Ottimo                                 |
| Turnover   | Fatturato / Capitale Investito                | <0.5 Capitale intenso, <1 Buono, <2 Ottimo, ≥2 Eccellente                         |
| IC         | 1 / Turnover (€ capitale per 1€ fatturato)    | informativo                                                                       |
| ROI %      | RO / Capitale Investito × 100                 | <0 Perdita, <4 Critico, <8 Buono, ≥8 Ottimo                                       |
| ROI-I      | stessa formula del ROI, lettura "industriale" | <0 Perde valore, <5 Non genera ricchezza, ≥5 Sostiene sviluppo                    |
| ROE %      | Utile Netto / Patrimonio Netto × 100          | <0 Critico, <5 Basso, <15 Buono, ≥15 Ottimo                                       |
| GI (anni)  | PFN / EBITDA                                  | <2 Ottimo, <3.5 Buono, <5 Attenziona, ≥5 Critico; EBITDA≤0 → Critico              |
| DSCR       | Flusso Cassa Operativo / Servizio Debito      | <1 Critico, <1.2 Tensione (soglia bancaria, art. 3 CCII), <1.5 Buono, ≥1.5 Ottimo |

- Ogni giudizio ha uno **score 0-100**; la media dei 7 score produce la **Valutazione di sintesi** in 5 fasce: Ristrutturazione necessaria (<30), Equilibrio fragile (<55), Solida migliorabile (<75), Sana e bancabile (<90), Eccellenza gestionale (≥90).
- **Generatore testuale rule-based**: "Analisi estesa" (fino a 7 frasi combinando pattern ROS/Turnover, ROI/ROE e leva, GI, DSCR), "Punti di forza Top 3", "Aree di attenzione Top 3", "Azione prioritaria", "Cosa guardare adesso", tabella "lettura per settore e dimensione".
- Ancoraggio normativo esplicito: DSCR e soglia 1.2 citati "ai sensi art. 3 CCII" (Codice della Crisi d'Impresa) → il servizio si posiziona su **adeguati assetti e allerta precoce**, oltre che sull'advisory generico.
- Disclaimer: "Dashboard didattica, nessun giudizio legale/fiscale".

### Business logic implicita del servizio

Il commercialista vende consulenza direzionale/bancabilità ai propri clienti PMI: il tool trasforma numeri di bilancio in un giudizio comprensibile e in azioni, con un artefatto consegnabile (report). Il valore è: velocità, autorevolezza percepita, linguaggio pronto per cliente e banca.

## 2. Reverse engineering del prototipo HTML

**Cos'è tecnicamente**: un "React Artifact" esportato da Claude.ai: file singolo da 212 KB con React 18 + ReactDOM minificati inline, CSS Tailwind precompilato inline, font Inter + JetBrains Mono da Google Fonts, tema indigo (#6366F1) con blob radiali sfocati, dark mode di default. Nessun server, nessuna dipendenza esterna oltre ai font.

**Funzionalità mappate una per una**:

- Campo "Nome Cliente / Azienda" persistito in `localStorage` (`roi_cliente_nome`), usato per titolare export e report.
- 10 slider sincronizzati con input numerici, clamp min/max, formattazione it-IT (€, migliaia).
- **Import CSV** robusto per un prototipo: FileReader, auto-detect separatore (`,` vs `;`), parser con quoted fields e doppi apici, matching fuzzy delle intestazioni per inclusione ("valore produzione", "val prod", "mol", "rata annua"...), normalizzazione numeri italiani (1.234,56) e simboli €/%, clamp ai range, toast con conteggio valori importati.
- **Export CSV**: 19 colonne (input + KPI calcolati + data it-IT), filename `ROI_<Cliente>_<ISOdate>.csv` sanificato.
- Toggle **Dark/Light**; il light serve di fatto per la stampa.
- **Reset** ai default con contatore reset e micro-feedback.
- **Report PDF via stampa browser**: `@media print` (nasconde controlli `.no-print`, `print-break` sulle card, sfondo bianco).
- Micro-interazioni: numeri animati (ease-out cubico, 700ms), anelli di progresso SVG animati, toast auto-dismiss 3s, hover lift sulle card.
- Card indicatore: titolo, badge giudizio colorato, formula in pill mono, valore grande, descrizione didattica, riga "extra" contestuale, "Cosa puoi fare" con consiglio dipendente dalla fascia.
- Pannello sintesi: gauge circolare /100, titolo+descrizione fascia, 6 chip semaforici, "Cosa guardare adesso", azione prioritaria.

**Limiti strutturali (perché va ricostruito)**:

- Zero persistenza reale: un solo cliente alla volta, nessun DB, nessuno storico, nessuna serie temporale (una fotografia, non un monitoraggio).
- Nessuna autenticazione, nessun multi-utente/multi-studio, nessun permesso.
- Dati inseriti a mano: nessun import bilancio XBRL/PDF, nessun collegamento a fonti.
- Report = print del browser: impaginazione fragile (pagine semivuote nei PDF), niente branding studio, niente template.
- Calcoli intrecciati alla UI in un bundle non testabile; formule duplicate in export.
- Difetti visibili: ROI-I è un duplicato del ROI con sole soglie diverse; il sottotitolo dice "8 input" ma i cursori sono 10; mojibake diffuso (à¹, Ã¨, âˆž) da doppia codifica UTF-8; Turnover calcolato sul fatturato mentre ROS sul valore della produzione (dichiarato in "Nota metodo", da uniformare o motivare); benchmark di settore solo testuali, non dati.

## 3. Upgrade architetturale proposto

Principio (CLAUDE.md): semplicità senza over-engineering, ma basi solide per un SaaS multi-tenant.

**Raccomandazione: monolite full-stack Next.js + Postgres**, motore di calcolo come pacchetto puro e testato.

| Livello          | Scelta raccomandata                                                                           | Perché                                                                                          | Alternativa considerata                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 15+ (App Router, TypeScript, RSC)**                                                 | Un solo linguaggio, SSR per dashboard veloci, ecosistema maturo, deploy semplice                | Vite+React SPA + NestJS: più separazione ma doppio deploy e API layer da mantenere; non serve all'MVP |
| UI               | **Tailwind CSS v4 + shadcn/ui (tema custom del brand) + Lucide**                              | Componenti accessibili (Radix), pieno controllo estetico, niente look "da template"             | MUI/Ant: veloci ma esteticamente riconoscibili e lontani dal premium                                  |
| Grafici          | **Recharts** (trend, barre) con tabella-dati alternativa                                      | Copre line/area/bar del dominio, buona DX                                                       | visx/D3 per visual su misura in fase polish                                                           |
| Form/validazione | **react-hook-form + zod**                                                                     | Schema unico condiviso client/server                                                            | —                                                                                                     |
| Dati client      | **TanStack Query + TanStack Table**                                                           | Cache, tabelle dense del portafoglio                                                            | —                                                                                                     |
| DB               | **PostgreSQL (Neon o Supabase) + Drizzle ORM**                                                | Relazionale ovvio per studio→clienti→bilanci→periodi; RLS per multi-tenancy; region EU per GDPR | SQLite/Turso: non adatto a multi-tenant serio                                                         |
| Auth             | **Auth.js v5** (o Clerk se si vuole comprare velocità)                                        | Multi-tenant per studio, ruoli (titolare, collaboratore), magic link + MFA                      | Supabase Auth se si sceglie Supabase                                                                  |
| Motore KPI       | **Package `engine` (workspace interno) puro TS, testato con Vitest**                          | Single source of truth delle formule/soglie/testi, usato da UI, API, report, AI                 | —                                                                                                     |
| Report PDF       | **Route di stampa dedicata + Playwright/Chromium server-side** (o react-pdf)                  | Report impaginati, brandizzati per studio, riproducibili                                        | Print del browser: è il limite attuale                                                                |
| Import           | CSV subito; **XBRL taxonomy ITCC (bilanci CCIAA)** come killer feature; PDF via AI in roadmap | Elimina l'inserimento manuale, vero salto di valore                                             | —                                                                                                     |
| Billing          | Stripe (per studio, a scaglioni di clienti gestiti)                                           | Standard                                                                                        | —                                                                                                     |
| Hosting          | Vercel (region EU) + Neon EU; backup automatici; audit log                                    | GDPR: dati contabili in EU                                                                      | —                                                                                                     |
| Qualità          | Monorepo pnpm; CI GitHub Actions (typecheck, vitest, Playwright e2e); Sentry                  | —                                                                                               | —                                                                                                     |

**Modello dati minimo**: `studio` (tenant) → `utenti` (ruoli) → `clienti` (anagrafica, ATECO, dimensione) → `esercizi/periodi` (dati di bilancio storicizzati) → `analisi` (snapshot KPI + giudizi + note) → `report` (PDF generati, versionati) + `alert` (soglie violate).

## 4. UI/UX premium (deciso con impeccable + ui-ux-pro-max e confermato in intervista)

Creati al root: **PRODUCT.md** (registro `product`; utenti: commercialisti; JTBD: monitoraggio portafoglio; personalità: autorevole, preciso, calmo; riferimenti Mercury + Ramp; anti-ref: gestionali legacy, SaaS cliché viola/glass, crypto-dark; WCAG 2.1 AA) e **DESIGN.md** (seed):

- **Tema chiaro di default** (scena: studio di giorno, il report a schermo somiglia al report su carta). Il suggerimento "OLED dark" di ui-ux-pro-max è stato scartato come riflesso di categoria.
- **Colore Restrained**: neutri inchiostro-su-carta tinti (OKLCH, mai #fff/#000), accento ottanio/teal-ink (~oklch 0.50 0.09 210) lontano da indigo del prototipo, dal navy-oro "finance" e dal viola SaaS; tricolore semantico riservato ai giudizi KPI, sempre con etichetta testuale.
- **Tipografia**: IBM Plex Sans unica famiglia UI + IBM Plex Mono/tabular-nums per i numeri; scala fissa rem ratio 1.2.
- **Layout**: app shell con sidebar portafoglio, griglie prevedibili, densità controllata; card solo dove servono.
- **Motion**: 150-250ms ease-out, solo di stato; skeleton, non spinner; empty state che insegnano.
- **Divieti**: side-stripe, gradient text, glassmorphism default, hero-metric template, card grid identiche, modal-first, emoji come icone.
- Prima di ogni schermata nuova: `/impeccable shape` con brief confermato (gate della skill).

## 5. Espansione: da tool a SaaS di categoria

**Colmare il gap col mercato** (Fathom/Syft/Jirav internazionali; Leanus/modefinance/TeamSystem Check Up Impresa in Italia):

1. Portafoglio multi-cliente con vista "salute dello studio" (chi peggiora, chi va rivisto, scadenze).
2. Storico pluriennale e trend (oggi manca del tutto la dimensione tempo).
3. Import bilanci XBRL CCIAA + riclassificazione automatica; import PDF via AI.
4. Benchmark settoriali per ATECO e dimensione (le soglie fisse attuali diventano soglie contestuali).
5. Scenari what-if salvabili e confrontabili (l'anima "a cursori" del prototipo diventa il simulatore).
6. Report builder white-label per studio (logo, colori, sezioni, commento) + archivio versionato.
7. Alert automatici su soglie CCII e covenant; scadenzario adempimenti.
8. Portale cliente read-only (espansione post-MVP già prevista in PRODUCT.md).

**AI-native (differenziante vero, con Claude API)**:

- Commento di bilancio generato nel tono dello studio, partendo dall'output del motore rule-based (che resta la fonte dei numeri: l'AI scrive, non calcola).
- Chat sull'azienda: "perché il DSCR è sceso rispetto al 2024?", con risposte ancorate ai dati.
- Estrazione automatica dati da bilanci PDF.
- Early warning: segnali di deterioramento sul portafoglio, riassunti in un brief settimanale per il titolare.
- Dossier bancabilità semi-automatico (dati + narrativa + allegati) da presentare in banca.

**Leva normativa come posizionamento**: CCII (adeguati assetti ex art. 2086 c.c., DSCR prospettico a 6 mesi, checklist CNDCEC) è l'argomento che rende il prodotto "necessario" e non "carino": il commercialista deve dimostrare monitoraggio continuo, e la piattaforma glielo documenta.

**Roadmap suggerita**: MVP (auth multi-studio, anagrafica clienti, motore KPI testato, inserimento manuale+CSV, dashboard cliente, report PDF brandizzato) → v1.1 (storico, trend, alert, XBRL) → v1.5 (AI: commento, chat, import PDF) → v2 (benchmark, portale cliente, dossier banca).

### Fonti

- https://www.fathomhq.com/blog/the-6-best-financial-analysis-software-tools
- https://acculinkcpa.com/blog/best-accounting-advisory-tools-jirav-fathom-reach-reporting-liveplan-more
- https://accountingfirmsoftware.com/syft-analytics/
- https://www.jirav.com/blog/jirav-vs-fathom-deep-fpa-vs-financial-reporting
- https://www.leanus.it/leanus-per-i-commercialisti/
- https://www.teamsystem.com/fintech/check-up-impresa/funzionalita/analisi-di-bilancio/
- https://www.contify.it/blog/i-migliori-software-di-analisi-di-bilancio-in-italia-2026
- https://www.incentivimpresa.it/calcolo-dscr-automatico/

---

## Addendum 21/07/2026 — Prototipo v3c2 (richiesta del committente)

Nuovo file `archivio/Dashboard-Roi-Strategie-Imprese3c2.html` con il **DSCR previsionale a 6 mesi** richiesto dall'ordine dei commercialisti. Differenze rispetto al v3b:

- **4 nuovi input di tesoreria** (14 cursori totali): Liquidità Iniziale (default 150k), Entrate Previste 6M (1,2M), Uscite Previste 6M escl. servizio debito (950k), Debito da Servire 6M (180k).
- **Nuovo pannello "DSCR Prospettico 6M - CNDCEC"**: `Disponibile 6M = Liquidità + Entrate − Uscite`; `DSCR 6M = Disponibile / Debito 6M`. Soglie: <1 Critico "crisi probabile ex art. 3 CCII" (score 10), 1–1.1 Attenzione (45), 1.1–1.3 Adeguato (75), ≥1.3 Ottimo (100). Warning UI sotto 1.1: "presidia tesoreria e segnala all'organo di controllo se persistente".
- **Score invariato**: resta la media dei 7 indicatori storici; il DSCR 6M ha lettura autonoma.
- **Analisi estesa** fino a 8 frasi (blocco prospettico), punti di forza/aree di attenzione con voci DSCR6M, **export CSV a 26 colonne** (+Liquidita Iniziale, Entrate 6M, Uscite 6M, Debito 6M, Disponibile 6M, DSCR Prospettico 6M).
- **Richieste esplicite del committente**: mantenere una grafica accattivante (→ design system Fase 1) e generare un report PDF dei contenuti a video (→ Fase 9, che dovrà includere il pannello 6M).

**Recepito nel motore** (`packages/engine`, Fase 2): `DatiPrevisionali6M`, `dscrProspettico`/`disponibile6m`, `giudicaDscrProspettico` con soglie CNDCEC, blocco nell'analisi estesa, punti forza/aree aggiornati. Impatti sulle fasi successive: Fase 4 (colonne previsionali su `esercizi`), Fase 7 (import/export CSV 26 colonne), Fase 8 (pannello DSCR 6M nella dashboard), Fase 9 (pannello nel report).
