# @advisorhub/engine

Motore di calcolo KPI: TypeScript puro, zero dipendenze, unica fonte di verità per formule, soglie e testi. Usato da UI, API, report e (in futuro) AI.

## Origine

Porting fedele della logica dei prototipi HTML in `archivio/`:

- `Dashboard-Roi-Strategie-Imprese3b.html` — 7 indicatori storici (ROS, Turnover+IC, ROI, ROI-I, ROE, GI, DSCR), score di sintesi, generatore testuale.
- `Dashboard-Roi-Strategie-Imprese3c2.html` (v3c2, 21/07/2026) — aggiunge il **DSCR Prospettico 6M** ex art. 3 CCII / linee guida CNDCEC: `Disponibile 6M = Liquidità Iniziale + Entrate 6M − Uscite 6M`, `DSCR 6M = Disponibile 6M / Debito da Servire 6M`, soglie 1 / 1.1 / 1.3. Non concorre allo score (media dei soli 7 storici), ha lettura autonoma di continuità.

I due CSV in `archivio/` sono la verità di riferimento dei **golden test** (`test/golden.test.ts`): stessi input → identici output, giudizi, punti di forza, azione prioritaria e frasi dell'analisi estesa dei PDF consegnati.

## Scelte e difetti del prototipo corretti (documentati)

1. **Parser numeri**: l'originale interpretava `550.000` come `550` e `1.234.567` come non valido. Ora i punti sono riconosciuti come migliaia quando coerenti (`parseNumeroIt`).
2. **EBITDA ≤ 0 nell'analisi estesa**: l'originale calcolava un GI negativo e lo commentava come "indebitamento molto sostenibile". Ora prevale la segnalazione "EBITDA non positivo".
3. **Mojibake**: i testi dell'originale contenevano doppie codifiche UTF-8 ("pò", "cosà¬", "âˆž"); tutti bonificati.
4. **ROI-I**: stessa formula del ROI, mantenuto come _lettura industriale_ separata (`giudicaRoiIndustriale`) con soglie proprie, com'era nel prototipo, ma senza duplicare il calcolo.
5. **Nota metodo ereditata**: il Turnover usa il Fatturato mentre il ROS usa il Valore della Produzione; quindi ROI ≈ ROS × Turnover è un'approssimazione. Mantenuto per continuità col prototipo e coi report già consegnati.

## API

```ts
import { analizza } from "@advisorhub/engine";

const a = analizza(datiBilancio /* 10 grandezze */, previsionale6M /* opzionale */);
a.indicatori; // valori numerici (null = non calcolabile)
a.giudizi; // label, tone, score, testo, azione per ognuno dei 7 + dscrPro
a.score; // 0-100, media dei 7 storici
a.sintesi; // fascia complessiva
a.puntiForza; // top 3
a.areeAttenzione; // top 3
a.analisiEstesa; // fino a 8 frasi
```

Convenzioni: divisore a 0 → `null` (n.d.), salvo GI e DSCR/DSCR6M che usano `99` come "infinito" e `0` dove il prototipo lo prevedeva. Formattazione it-IT in `formatEuro` / `formatNumero`.

## Test

`pnpm test` — 119 test: golden sui CSV reali, soglie al confine per ogni indicatore, casi limite (zeri, negativi, ∞), parser. Coverage 100% su formule e giudizi.
