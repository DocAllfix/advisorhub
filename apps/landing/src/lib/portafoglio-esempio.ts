import {
  analizza,
  SOGLIE_GIUDIZIO,
  type Analisi,
  type DatiBilancio,
  type DatiPrevisionali6M,
} from "@finbeacon/engine";

import {
  BILANCIO_ESEMPIO,
  CLIENTE_ESEMPIO,
  ESERCIZIO_ESEMPIO,
  PREVISIONALE_ESEMPIO,
} from "./esempio";

/**
 * Il portafoglio di uno studio di esempio: cinque clienti INVENTATI, uno per
 * fascia di salute, per mostrare il cruscotto come lo vede il commercialista.
 * Nomi e cifre non corrispondono a imprese reali; mai i bilanci dell'archivio.
 *
 * Tutto passa dal motore. Il test `portafoglio-esempio.test.ts` verifica che ogni
 * cliente cada davvero nella fascia per cui è stato pensato: se il motore cambia,
 * lo si scopre lì e non in pagina.
 */
export interface ClienteEsempio {
  nome: string;
  esercizio: number;
  analisi: Analisi;
  /** Sotto la soglia del DSCR sull'esercizio */
  dscrSotto: boolean;
  /** Sotto la soglia del DSCR prospettico a 6 mesi */
  dscr6mSotto: boolean;
}

function cliente(
  nome: string,
  dati: DatiBilancio,
  previsionale: DatiPrevisionali6M,
): ClienteEsempio {
  const analisi = analizza(dati, previsionale);
  const { dscr, dscrProspettico } = analisi.indicatori;
  return {
    nome,
    esercizio: ESERCIZIO_ESEMPIO,
    analisi,
    dscrSotto: dscr !== null && dscr < SOGLIE_GIUDIZIO.dscr.soglia,
    dscr6mSotto: dscrProspettico !== null && dscrProspettico < SOGLIE_GIUDIZIO.dscr6m.soglia,
  };
}

const CLIENTI: ClienteEsempio[] = [
  cliente(
    "Arredi Monteverde S.p.A.",
    {
      valProd: 6_000_000,
      fatturato: 5_900_000,
      ro: 900_000,
      capInvest: 4_000_000,
      patrNetto: 2_500_000,
      utileNetto: 600_000,
      ebitda: 1_200_000,
      pfn: 900_000,
      servizioDebito: 300_000,
      flussoCassa: 800_000,
    },
    { liquiditaIniziale: 500_000, entrate6m: 3_200_000, uscite6m: 2_900_000, debito6m: 150_000 },
  ),
  cliente(
    "Frantoio Colle Aperto S.r.l.",
    {
      valProd: 2_000_000,
      fatturato: 1_950_000,
      ro: 130_000,
      capInvest: 1_600_000,
      patrNetto: 900_000,
      utileNetto: 60_000,
      ebitda: 290_000,
      pfn: 760_000,
      servizioDebito: 160_000,
      flussoCassa: 245_000,
    },
    { liquiditaIniziale: 140_000, entrate6m: 1_050_000, uscite6m: 960_000, debito6m: 85_000 },
  ),
  cliente(CLIENTE_ESEMPIO, BILANCIO_ESEMPIO, PREVISIONALE_ESEMPIO),
  cliente(
    "Logistica Portonovo S.r.l.",
    {
      valProd: 3_400_000,
      fatturato: 3_300_000,
      ro: 95_000,
      capInvest: 3_700_000,
      patrNetto: 700_000,
      utileNetto: 8_000,
      ebitda: 290_000,
      pfn: 1_600_000,
      servizioDebito: 380_000,
      flussoCassa: 340_000,
    },
    { liquiditaIniziale: 40_000, entrate6m: 1_600_000, uscite6m: 1_520_000, debito6m: 190_000 },
  ),
  cliente(
    "Tessitura Val Lemme S.r.l.",
    {
      valProd: 1_800_000,
      fatturato: 1_750_000,
      ro: -60_000,
      capInvest: 2_300_000,
      patrNetto: 250_000,
      utileNetto: -140_000,
      ebitda: 40_000,
      pfn: 1_300_000,
      servizioDebito: 260_000,
      flussoCassa: 90_000,
    },
    { liquiditaIniziale: 15_000, entrate6m: 820_000, uscite6m: 840_000, debito6m: 130_000 },
  ),
];

/** Come nel cruscotto: prima chi ha più bisogno, cioè il punteggio più basso. */
export const PORTAFOGLIO_ESEMPIO: readonly ClienteEsempio[] = [...CLIENTI].sort(
  (a, b) => a.analisi.score - b.analisi.score,
);
