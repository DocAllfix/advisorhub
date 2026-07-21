import { formatEuro, formatNumero, type Analisi, type DatiBilancio } from "@advisorhub/engine";

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
}

const pct = (v: number | null) => (v === null ? "n.d." : `${formatNumero(v, 2)}%`);

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
  },
];
