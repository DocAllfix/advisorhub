# CONSEGNA — quello che devi sapere prima di toccare il frontend

Scritto per la sessione che arriva a contesto pulito per lavorare su design e UI.

Non è un riassunto del lavoro fatto: è la lista **corta** di ciò che ti farebbe perdere
mezza giornata, o peggio, ti farebbe dichiarare fatto qualcosa che non funziona.
Leggila prima di aprire il primo file.

---

## 1. Cinque trappole, in ordine di quanto costano

### 1.1 `export const dynamic = "force-dynamic"` nel layout radice — NON TOGLIERLO

`apps/web/src/app/layout.tsx:35`. Sembra un errore di performance da correggere. Non lo è.

La Content-Security-Policy usa un **nonce diverso a ogni richiesta**, emesso da
`src/middleware.ts`. Una pagina pre-renderizzata a build time ha l'HTML già scritto quando
il nonce non esiste ancora, quindi i suoi script non lo hanno — e il browser, vedendo un
nonce nella politica, **ignora `'unsafe-inline'`** (è la compatibilità prevista dalla
specifica, non un capriccio). Risultato: **HTTP 200, pagina bianca, nessun errore**.

Se lo togli, o se aggiungi una pagina statica, succede esattamente questo. Dettagli in
`deploy/GUASTI.md` **G-28**.

### 1.2 Ogni libreria che inietta uno `<script>` inline ha bisogno del nonce

Motion, GSAP, NumberFlow, temi, analytics: se scrivono uno script inline, la CSP lo blocca.

Il nonce è disponibile così:

```tsx
const nonce = (await headers()).get("x-nonce") ?? undefined;
```

È già propagato a `next-themes` (`components/tema-provider.tsx`), che inietta uno script per
applicare il tema prima della prima pittura. Se aggiungi una libreria simile, passaglielo.

**Gli stili inline vanno bene**: `style-src` ammette `'unsafe-inline'` proprio perché le
animazioni scrivono sull'attributo `style` a runtime, dove il nonce non si applica.

**Se aggiungi una seconda libreria con nonce, leggi questo prima.**

Il browser **azzera l'attributo `nonce` nel DOM** dopo il parsing: è una difesa contro
l'esfiltrazione, non un difetto. Se React ri-rende quell'elemento sul client trova `nonce=""`
dove il server aveva un valore, e segnala una mancata corrispondenza di idratazione. Su un
progetto vicino erano **690 occorrenze**, tutte invisibili in produzione.

**La discriminante è dove nasce lo script, non quale attributo porta.**

| Lo script lo emette…                      | Cosa fare                                                                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| un componente **client** (`"use client"`) | Il codice gira due volte, server e browser: si possono far **combaciare** i valori, rendendo il nonce come stringa vuota sul client — che è esattamente ciò che il browser lascia nel DOM                              |
| un componente **server**                  | Nel browser quel codice non viene mai eseguito: il valore viaggia già serializzato e `typeof window` non ha un secondo giro in cui valutarsi. Lì `suppressHydrationWarning` **non è la scorciatoia, è l'unica strada** |

**Il criterio pratico**: prima di sopprimere, guarda se i due valori possono combaciare. Se
possono, falli combaciare — così la spia delle mancate corrispondenze resta accesa per quelle
vere. Se non possono, sopprimi **sul singolo elemento**, mai ereditando da `<html>`: una
soppressione larga spegne la spia per tutta la pagina.

**Da noi il caso è il primo**, verificato: `TemaProvider` è un componente client
(`"use client"`), e `next-themes@0.4.6` applica entrambi i rimedi —
`suppressHydrationWarning` sullo script e `nonce: typeof window === "undefined" ? valore : ""`.
`layout.tsx:57` è l'unico punto dove passiamo il nonce, quindi la superficie è una sola ed è
coperta. Nessuna azione.

_(Regola arrivata dalla sessione gdprhub, che sui 690 messaggi ci si era bruciata davvero.)_

### 1.3 I font del report NON si spostano

`apps/web/public/fonts/report/` — sei `.ttf` letti a runtime da
`src/lib/report/percorso-font.ts`. Stavano sotto `src/`, e nella build standalone quella
cartella non viene copiata: il download del PDF, che è il deliverable di valore del prodotto,
si rompeva **solo in produzione**. Se riorganizzi gli asset, lasciali dove sono o aggiorna il
risolutore. **G-09**.

### 1.4 I numeri delle soglie vengono dal motore, non li riscrivi

Le fasce di salute (30/55/75/90), le soglie di giudizio (ROS 10%, DSCR 1,20…) e i **fondi
scala delle barre** vivono in `packages/engine`:

```ts
import { FASCE_SALUTE, fasciaSalute, SOGLIE_GIUDIZIO } from "@advisorhub/engine";
import { SCALE } from "@/lib/report/soglie"; // fondi scala, condivisi con il report
```

Erano riscritti a mano in quattro file, e dashboard e report disegnavano lo stesso indicatore
su scale diverse — sei su sette. Se ridisegni una barra o un badge, prendi il numero da lì.
`CLAUDE.md` regola 1: **il motore è l'unica fonte di verità**. **G-29**.

### 1.5 `/styleguide` risponde 404 in produzione

`src/app/styleguide/page.tsx` fa `notFound()` se `NODE_ENV === "production"`. In sviluppo
funziona e ti serve. Non «correggerlo».

---

## 2. I cancelli che devi far passare

```bash
pnpm lint                              # 0 errori (2 warning sono preesistenti, vedi §4)
pnpm test                              # 156 test del motore, golden inclusi
pnpm --filter web test:e2e             # 18 end-to-end (era 17)
```

Gli end-to-end richiedono il database e Mailpit:

```bash
docker compose -f deploy/docker-compose.dev.yml up -d
pnpm --filter web db:migrate
pnpm --filter web e2e:prepara          # build + copia .next/static + bundle del worker
pnpm --filter web test:e2e
```

**Tre di questi test sono la tua rete, non un fastidio:**

- `e2e/interfaccia.spec.ts` raccoglie le **violazioni CSP dalla console del browser** e
  fallisce se ce n'è anche una. È l'unico posto dove il problema di §1.1 e §1.2 si dichiara:
  una CSP sbagliata non dà 500, dà una pagina ferma a metà.
- `e2e/report-pdf.spec.ts` **scarica il PDF per davvero** e controlla che inizi con `%PDF` e
  pesi più di 20 KB. Un file più piccolo significa font mancanti.
- `e2e/salute.spec.ts` verifica che la CSP contenga un nonce, che ci sia `strict-dynamic`, e
  che **il nonce cambi a ogni richiesta**.

I test girano contro il **server standalone di produzione**, non contro `next dev`:
`next start` non funziona con `output: "standalone"` (parte, dice Ready, risponde 500 a tutto
— **G-06**).

### 2.1 Prima di fidarti della rete, controlla che esista dove serve

La prima consegna diceva «hai 17 end-to-end come rete» **senza dire che vivevano solo
su questo disco**: nessuno li aveva mai committati, e `ci.yml` li invocava. Su un
checkout pulito la CI chiamava test inesistenti — e il workflow non era mai stato
eseguito davvero, quindi nascondeva anche un conflitto fra `version: 11` nel job e
`packageManager` in `package.json`, che faceva morire ogni installazione.

Sono stati risolti entrambi dalla sessione frontend. La regola che ne resta:

> **Una rete di sicurezza che non è nel repository non è una rete.** Prima di contarci,
> `git ls-files` sui percorsi che la compongono.

Vale anche per i test che scriverai tu.

---

## 3. Dove sta la verità sul design

- **`DESIGN.md`** — tema, colore, tipografia, componenti, motion, divieti.
- **`PRODUCT.md`** — utenti, scopo, personalità, anti-riferimenti.
- **`CLAUDE.md` regola 4** — _prima di costruire interfacce si passa da `/impeccable shape`
  con brief confermato dall'utente, poi critique/audit e screenshot ai breakpoint._
  Non è un suggerimento: è una regola del progetto.

L'app è in **italiano**, e lo sono anche i nomi di variabili e funzioni. Mantienilo.

---

## 4. Cose che sembrano difetti e non lo sono

- **2 warning di lint preesistenti**: `portafoglio.tsx` (TanStack Table non memoizzabile) e
  `tour/pagine/analisi.ts` (`_demo` non usato). Non li ho toccati, non sono tuoi.
- **`import "server-only"`** in quattro file: non è nel lockfile e `require.resolve` fallisce,
  ma **Next lo risolve con un alias interno**. Funziona. Non toglierlo e non installarlo.
  Non metterlo però nei moduli impacchettati da esbuild (`migra.ts`, `worker.ts`,
  `crea-titolare.ts`): lì non risolve. **G-10**.
- **`pnpm format` fallisce su Windows** per i fine riga (CRLF). Non è stile: su Linux, dove
  gira la CI, passa.
- **La tabella `report` nello schema non è usata da nessuno.** Debito noto, non un tuo errore.

---

## 4bis. Cose già fatte bene, che sembrano da correggere

Segnalate dalla sessione frontend dopo averle lette nel codice. Le elenco perché chi
arriva dopo rischia di «sistemarle»:

- **Il popover di driver.js è già tematizzato sui token.** Non va ri-stilizzato.
- **Lo stato «filtro a zero risultati» del portafoglio esiste** ed è fatto bene.
- **La cornice del pannello DSCR 6M è deliberata**: il commento nel codice spiega che
  risponde all'art. 3 CCII. Non è un'incoerenza visiva.

E una che riguarda i contenuti, non il layout:

- **`"Attenziona"`** in `packages/engine/src/giudizi.ts:297` è un imperativo dove ogni
  altra etichetta è nominale. **Non è un refuso**: compare nel prototipo HTML del
  committente (`archivio/Dashboard-Roi-Strategie-Imprese3b.html`), è documentato in
  `ANALISI.md:31` ed è fissato da `giudizi.test.ts:102`. Cambiarlo altererebbe una
  stringa già comparsa nei report consegnati: **è una decisione del committente, non
  tua**.

---

## 5. Disciplina del disco — leggila, non è burocrazia

Il 18 settembre il disco è arrivato a **1,5 GB su 238** e Docker ha cominciato a fallire a
caso, con tre sessioni che costruivano immagini sulla stessa macchina. Le regole sono in
`deploy/GUASTI.md` → **P-01**. Le due che ti riguardano:

- **`df -h` prima di avviare uno stack.** Sotto i 15 GB liberi, libera prima.
- **Pulizia a fine sessione di build**: `docker compose … down` e `docker builder prune -af`.
  Trenta secondi.

E sappi che `docker system df` misura il **contenuto**, non l'occupazione: su Windows lo
spazio torna a Windows solo dopo `wsl --shutdown` (**G-21**). Se pulisci e il disco non si
muove, non è che non ha funzionato.

Su questa macchina lavorano altre sessioni. Metti sempre un `name:` esplicito nei compose
(il nostro è `advisorhub-dev`): senza, Compose deriva il nome dalla cartella e **ricrea i
container di un altro progetto azzerandone il volume, senza errori** (**G-01**).

---

## 6. Se trovi un guasto nuovo

`deploy/GUASTI.md` è un registro vivo, a 32 voci, condiviso in spirito con altri due prodotti
sulla stessa macchina. Ogni voce ha: sintomo, **perché inganna**, diagnosi incollabile, rimedio.

La sezione «perché inganna» è quella che fa risparmiare tempo a chi viene dopo — una voce
senza quella vale poco.

Due regole che attraversano metà del registro, e che valgono anche per il frontend:

> **Un successo dichiarato non è un successo verificato.** Un build verde non dice nulla su
> come la pagina si comporta nel browser.
>
> **Dedurre invece di verificare** è l'errore più frequente: quattro voci su trenta nascono
> da lì. Se una cosa ti sorprende, guardala.
