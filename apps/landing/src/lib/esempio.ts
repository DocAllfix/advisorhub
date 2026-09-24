import {
  analizza,
  fasciaSalute,
  SOGLIE_GIUDIZIO,
  type Analisi,
  type DatiBilancio,
  type DatiPrevisionali6M,
} from "@finbeacon/engine";

/**
 * IL CLIENTE DI ESEMPIO della landing. Tutto ciò che la pagina mostra come
 * «prodotto» nasce da qui, passando dal motore vero.
 *
 * I dati sono INVENTATI, dichiaratamente. Mai i due bilanci dell'archivio: sono
 * clienti reali del committente, e su una pagina pubblica non ci vanno nemmeno
 * resi anonimi. Studio, cliente e cifre non corrispondono a nessuno.
 *
 * Nessun numero mostrato in pagina è scritto a mano: punteggio, giudizi, soglie
 * e serie escono da `analizza()` e da `SOGLIE_GIUDIZIO` al momento del build.
 * Se il motore cambia una soglia, la landing cambia con lui (CLAUDE.md regola 1).
 */

export const STUDIO_ESEMPIO = "Studio Ferraro & Associati";
export const CLIENTE_ESEMPIO = "Meccanica Ardesia S.r.l.";
export const ESERCIZIO_ESEMPIO = 2025;

export const BILANCIO_ESEMPIO: DatiBilancio = {
  valProd: 4_200_000,
  fatturato: 4_100_000,
  ro: 210_000,
  capInvest: 3_600_000,
  patrNetto: 900_000,
  utileNetto: 60_000,
  ebitda: 480_000,
  pfn: 1_900_000,
  servizioDebito: 420_000,
  flussoCassa: 470_000,
};

/**
 * Sei rilevazioni mensili della tesoreria a 6 mesi: entrate, uscite e debito
 * restano gli stessi, la liquidità iniziale si assottiglia di mese in mese.
 * È il caso tipico che il DSCR prospettico esiste per intercettare: il conto
 * economico dell'anno non è ancora cambiato, la cassa sì.
 */
const MESI = ["apr", "mag", "giu", "lug", "ago", "set"] as const;
const LIQUIDITA = [148_000, 131_000, 104_000, 89_000, 71_000, 47_000] as const;

function previsionale(liquiditaIniziale: number): DatiPrevisionali6M {
  return { liquiditaIniziale, entrate6m: 2_050_000, uscite6m: 1_900_000, debito6m: 210_000 };
}

export interface Rilevazione {
  mese: (typeof MESI)[number];
  dscr6m: number;
}

/** La serie del DSCR prospettico, un punto per rilevazione, calcolata dal motore. */
export const SERIE_DSCR6M: readonly Rilevazione[] = MESI.map((mese, i) => {
  const { indicatori } = analizza(BILANCIO_ESEMPIO, previsionale(LIQUIDITA[i]!));
  if (indicatori.dscrProspettico === null) {
    throw new Error(`DSCR prospettico non calcolabile per ${mese}: dati di esempio incoerenti`);
  }
  return { mese, dscr6m: indicatori.dscrProspettico };
});

/** La tesoreria dell'ultima rilevazione: il punto di partenza dell'anteprima. */
export const PREVISIONALE_ESEMPIO: DatiPrevisionali6M = previsionale(
  LIQUIDITA[LIQUIDITA.length - 1]!,
);

/** L'analisi completa sull'ultima rilevazione: è quella che il Deck mostra. */
export const ANALISI_ESEMPIO: Analisi = analizza(BILANCIO_ESEMPIO, PREVISIONALE_ESEMPIO);

export const FASCIA_ESEMPIO = fasciaSalute(ANALISI_ESEMPIO.score);

/** La soglia CNDCEC del DSCR prospettico (art. 3 CCII), letta dal motore. */
export const SOGLIA_DSCR6M = SOGLIE_GIUDIZIO.dscr6m.soglia;
