import type { ChiaveIndicatore } from "@/lib/analisi/indicatori-meta";

/**
 * Scala di lettura di ogni indicatore nel report: valore, soglia di
 * riferimento e fondo scala. Sostituisce le percentuali normalizzate del
 * report precedente, che erano calcolate contro tetti convenzionali e
 * stampate senza legenda: la soglia è invece il numero che il cliente e la
 * banca discutono davvero.
 *
 * Le soglie sono le stesse esposte in "Soglie di riferimento" nell'analisi.
 */
export interface ScalaIndicatore {
  /** Fondo scala della barra */
  max: number;
  /** Posizione della soglia sulla scala */
  soglia: number;
  /** Come si legge la soglia nel report */
  etichetta: string;
  /**
   * true quando un valore basso è migliore (il GI: anni di rientro del
   * debito). Cambia solo il testo della legenda, non la geometria.
   */
  minoreMeglio?: boolean;
  /** Sottotitolo in chiaro dell'indicatore, in italiano non tecnico */
  descrizione: string;
}

export const SCALE: Record<ChiaveIndicatore, ScalaIndicatore> = {
  ros: { max: 20, soglia: 10, etichetta: "soglia 10%", descrizione: "Redditività delle vendite" },
  turnover: {
    max: 2.5,
    soglia: 1,
    etichetta: "soglia 1,0",
    descrizione: "Rotazione del capitale",
  },
  roi: { max: 20, soglia: 8, etichetta: "soglia 8%", descrizione: "Rendimento del capitale" },
  roiI: { max: 20, soglia: 5, etichetta: "soglia sviluppo 5%", descrizione: "Lettura industriale" },
  roe: { max: 30, soglia: 5, etichetta: "fascia buona 5-15%", descrizione: "Remunera il capitale di rischio" },
  gi: {
    max: 6,
    soglia: 2,
    etichetta: "soglia 2 anni",
    minoreMeglio: true,
    descrizione: "Anni di rientro (PFN/EBITDA)",
  },
  dscr: {
    max: 2.5,
    soglia: 1.2,
    etichetta: "soglia bancabile 1,20",
    descrizione: "Copertura del servizio debito",
  },
};

/** Il prospettico 6M non è fra i sette: ha una sezione propria (art. 3 CCII). */
export const SCALA_DSCR_6M: ScalaIndicatore = {
  max: 2.5,
  soglia: 1.1,
  etichetta: "soglia CNDCEC 1,10",
  descrizione: "Copertura prospettica del debito",
};

/** Valore grezzo dell'indicatore, per posizionare la barra sulla scala. */
export function valoreGrezzo(
  chiave: ChiaveIndicatore,
  ind: {
    ros: number | null;
    turnover: number | null;
    roi: number | null;
    roe: number | null;
    gi: number | null;
    dscr: number | null;
  },
): number | null {
  switch (chiave) {
    case "ros":
      return ind.ros;
    case "turnover":
      return ind.turnover;
    case "roi":
    case "roiI":
      return ind.roi;
    case "roe":
      return ind.roe;
    case "gi":
      return ind.gi;
    case "dscr":
      // 99 è il segnaposto del motore per "servizio del debito nullo"
      return ind.dscr !== null && ind.dscr >= 99 ? null : ind.dscr;
  }
}

/** Percentuale 0-100 di una quantità sulla sua scala, limitata agli estremi. */
export const quota = (valore: number, max: number) =>
  Math.max(0, Math.min(100, (valore / max) * 100));
