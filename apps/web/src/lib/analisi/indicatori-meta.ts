import { formatEuro, formatNumero, type Analisi, type DatiBilancio } from "@finbeacon/engine";

import { SCALE } from "@/lib/report/soglie";

/**
 * Il fondo scala delle barre viene da `SCALE`, che è lo stesso usato dal report.
 *
 * Prima erano due serie di numeri diversi: la dashboard normalizzava il ROS su
 * 15 e il report su 20, il turnover su 3 e su 2,5, il ROE su 20 e su 30. Sei
 * indicatori su sette disegnavano lo stesso valore con barre diverse — così un
 * commercialista che mostrava la dashboard e poi consegnava il PDF vedeva due
 * rappresentazioni discordi dello stesso cliente. Nessun numero era sbagliato:
 * era sbagliato che fossero due.
 */

/**
 * Metadati di presentazione degli indicatori: titoli, formule e descrizioni
 * didattiche del prototipo. I giudizi e le azioni restano di competenza del
 * motore: qui c'è solo come si mostrano.
 */
export type ChiaveIndicatore = "ros" | "turnover" | "roi" | "roiI" | "roe" | "gi" | "dscr";

export interface MetaIndicatore {
  chiave: ChiaveIndicatore;
  titolo: string;
  sottotitolo: string;
  formula: string;
  descrizione: string;
  /** Valore formattato per la vista. */
  valore: (a: Analisi, d: DatiBilancio) => string;
  /** Riga contestuale sotto il valore (numeri di riferimento). */
  extra: (a: Analisi, d: DatiBilancio) => string;
  /**
   * Posizione 0-100 dell'indicatore sulla sua scala, per l'anello di stato.
   * Mappature ereditate dal prototipo (bounded), così l'anello varia in modo
   * leggibile invece di saturare a 100 per ogni "Ottimo".
   */
  percentuale: (a: Analisi, d: DatiBilancio) => number;
}

const pct = (v: number | null) => (v === null ? "n.d." : `${formatNumero(v, 2)}%`);
const limita = (n: number) => Math.max(0, Math.min(100, n));

export const INDICATORI: MetaIndicatore[] = [
  {
    chiave: "ros",
    titolo: "ROS",
    sottotitolo: "Return on Sales",
    formula: "RO / Valore Produzione ×100",
    descrizione:
      "Misura quanto rende ogni euro di produzione in termini di reddito operativo. Indica potere di pricing e controllo dei costi caratteristici.",
    valore: (a) => pct(a.indicatori.ros),
    extra: (_, d) => `Valore produzione: ${formatEuro(d.valProd)}`,
    percentuale: (a) =>
      a.indicatori.ros === null ? 0 : limita((a.indicatori.ros / SCALE.ros.max) * 100),
  },
  {
    chiave: "turnover",
    titolo: "Turnover",
    sottotitolo: "Rotazione del capitale",
    formula: "Fatturato / Capitale Investito",
    descrizione:
      "Quante volte il capitale investito si trasforma in fatturato. Basso significa impresa capital intensive, alto significa modello snello.",
    valore: (a) =>
      a.indicatori.turnover === null ? "n.d." : formatNumero(a.indicatori.turnover, 2),
    extra: (a) =>
      a.indicatori.ic === null
        ? "Capitale investito a 0"
        : `IC ${formatNumero(a.indicatori.ic, 2)} € di capitale per 1 € di fatturato`,
    percentuale: (a) =>
      a.indicatori.turnover === null
        ? 0
        : limita((a.indicatori.turnover / SCALE.turnover.max) * 100),
  },
  {
    chiave: "roi",
    titolo: "ROI",
    sottotitolo: "Return on Investment",
    formula: "RO / Capitale Investito ×100",
    descrizione:
      "Rendimento complessivo del capitale investito. Se supera il costo medio delle fonti (WACC), l'impresa crea valore.",
    valore: (a) => pct(a.indicatori.roi),
    extra: (a) =>
      a.indicatori.ros !== null && a.indicatori.turnover !== null
        ? `Approssimazione ROS × Turnover: ${formatNumero((a.indicatori.ros / 100) * a.indicatori.turnover * 100, 2)}%`
        : "Approssimazione non calcolabile",
    percentuale: (a) =>
      a.indicatori.roi === null ? 0 : limita((a.indicatori.roi / SCALE.roi.max) * 100),
  },
  {
    chiave: "roiI",
    titolo: "ROI-I",
    sottotitolo: "Lettura industriale",
    formula: "RO / Capitale Investito (soglia sviluppo 5%)",
    descrizione:
      "Interpretazione industriale del ROI: se negativo l'impresa perde valore e necessita capitale esterno; sopra il 5% sostiene lo sviluppo con risorse proprie.",
    valore: (a) => pct(a.indicatori.roi),
    extra: (a) =>
      a.indicatori.roi === null
        ? "Soglia sviluppo 5%: non calcolabile"
        : `Soglia sviluppo 5%: ${a.indicatori.roi >= 5 ? "superata" : "non raggiunta"}`,
    percentuale: (a) =>
      a.indicatori.roi === null ? 0 : limita((a.indicatori.roi / SCALE.roiI.max) * 100),
  },
  {
    chiave: "roe",
    titolo: "ROE",
    sottotitolo: "Return on Equity",
    formula: "Utile Netto / Patrimonio Netto ×100",
    descrizione:
      "Quanto rende il capitale di rischio. È la sintesi finale per il socio: remunerazione al netto di tasse, interessi e componenti straordinarie.",
    valore: (a) => pct(a.indicatori.roe),
    extra: (_, d) => `Patrimonio netto: ${formatEuro(d.patrNetto)}`,
    percentuale: (a) =>
      a.indicatori.roe === null ? 0 : limita((a.indicatori.roe / SCALE.roe.max) * 100),
  },
  {
    chiave: "gi",
    titolo: "GI",
    sottotitolo: "Grado di indebitamento",
    formula: "PFN / EBITDA (anni per ripagare)",
    descrizione:
      "Quanti anni di MOL servono per ripagare il debito finanziario netto. È l'indicatore chiave di bancabilità.",
    valore: (a, d) => {
      if (a.indicatori.gi === null) return "n.d.";
      if (d.ebitda <= 0) return "∞";
      return `${formatNumero(a.indicatori.gi, 2)} anni`;
    },
    extra: (a, d) =>
      `Inverso EBITDA/PFN ${formatNumero(a.indicatori.invGi, 1)}% — ${formatEuro(d.pfn)} / ${formatEuro(d.ebitda)}`,
    percentuale: (a, d) =>
      d.ebitda <= 0
        ? 5
        : a.indicatori.gi === null
          ? 0
          : limita(100 - (a.indicatori.gi / SCALE.gi.max) * 100),
  },
  {
    chiave: "dscr",
    titolo: "DSCR",
    sottotitolo: "Debt Service Coverage Ratio",
    formula: "Flusso Cassa / Servizio Debito",
    descrizione:
      "Misura la capacità dell'impresa di coprire il servizio del debito con i flussi generati. È l'indicatore richiesto dalle banche per la sostenibilità finanziaria (art. 3 CCII): sopra 1,2 indica equilibrio prospettico.",
    valore: (a) => {
      if (a.indicatori.dscr === null) return "n.d.";
      if (a.indicatori.dscr >= 99) return "∞";
      return formatNumero(a.indicatori.dscr, 2);
    },
    extra: (_, d) =>
      `${formatEuro(d.flussoCassa)} / ${formatEuro(d.servizioDebito)} — soglia bancaria 1,2`,
    percentuale: (a) =>
      a.indicatori.dscr === null
        ? 0
        : a.indicatori.dscr >= 99
          ? 100
          : limita((a.indicatori.dscr / SCALE.dscr.max) * 100),
  },
];
