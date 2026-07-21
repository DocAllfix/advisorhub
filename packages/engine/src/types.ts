/** Le 10 grandezze di bilancio in input (in euro). */
export interface DatiBilancio {
  /** Valore della Produzione */
  valProd: number;
  /** Fatturato (ricavi delle vendite) */
  fatturato: number;
  /** Reddito Operativo (RO), può essere negativo */
  ro: number;
  /** Capitale Investito */
  capInvest: number;
  /** Patrimonio Netto */
  patrNetto: number;
  /** Utile Netto, può essere negativo */
  utileNetto: number;
  /** EBITDA / MOL, può essere negativo */
  ebitda: number;
  /** Posizione Finanziaria Netta (debito finanziario netto) */
  pfn: number;
  /** Servizio del debito annuo (quota capitale + interessi) */
  servizioDebito: number;
  /** Flusso di cassa operativo (per DSCR) */
  flussoCassa: number;
}

/**
 * Dati di tesoreria previsionale a 6 mesi per il DSCR prospettico
 * (richiesta CNDCEC / art. 3 CCII, prototipo v3c2).
 */
export interface DatiPrevisionali6M {
  /** Liquidità iniziale (cassa + c/c) */
  liquiditaIniziale: number;
  /** Entrate previste nei prossimi 6 mesi */
  entrate6m: number;
  /** Uscite previste nei prossimi 6 mesi, escluso il servizio del debito */
  uscite6m: number;
  /** Debito da servire nei prossimi 6 mesi */
  debito6m: number;
}

/** Tono visivo del giudizio, mappato sui token del design system. */
export type Tono = "eccellente" | "buono" | "attenzione" | "critico" | "nd";

/** Giudizio qualitativo su un indicatore. */
export interface Giudizio {
  /** Etichetta breve (es. "Ottimo", "Tensione", "n.d.") */
  label: string;
  tone: Tono;
  /** Contributo allo score complessivo, 0-100 */
  score: number;
  /** Lettura sintetica dell'indicatore */
  testo: string;
  /** Consiglio operativo ("Cosa puoi fare") */
  azione: string;
}

/** Valori numerici degli indicatori; null = non calcolabile con gli input correnti. */
export interface Indicatori {
  /** Return on Sales % = RO / Valore Produzione × 100 */
  ros: number | null;
  /** Rotazione del capitale = Fatturato / Capitale Investito */
  turnover: number | null;
  /** Intensità di capitale = 1 / Turnover (€ di capitale per 1€ di fatturato) */
  ic: number | null;
  /** Return on Investment % = RO / Capitale Investito × 100 */
  roi: number | null;
  /** Return on Equity % = Utile Netto / Patrimonio Netto × 100 */
  roe: number | null;
  /** Grado di indebitamento in anni = PFN / EBITDA (99 = non ripagabile) */
  gi: number | null;
  /** Inverso del GI in % = EBITDA / PFN × 100 */
  invGi: number;
  /** Debt Service Coverage Ratio = Flusso Cassa / Servizio Debito (99 = servizio nullo) */
  dscr: number | null;
  /** Disponibilità a 6 mesi = Liquidità Iniziale + Entrate 6M − Uscite 6M (null senza dati previsionali) */
  disponibile6m: number | null;
  /** DSCR prospettico 6M = Disponibile 6M / Debito 6M (99 = debito nullo con disponibilità positiva) */
  dscrProspettico: number | null;
}

export interface Sintesi {
  titolo: string;
  descrizione: string;
}

export interface VoceElenco {
  /** Chiave dell'indicatore di riferimento (es. "ROS", "DSCR", "OK") */
  k: string;
  txt: string;
}

/** Output completo del motore per un esercizio. */
export interface Analisi {
  indicatori: Indicatori;
  giudizi: {
    ros: Giudizio;
    turnover: Giudizio;
    roi: Giudizio;
    roiI: Giudizio;
    roe: Giudizio;
    gi: Giudizio;
    dscr: Giudizio;
    dscrPro: Giudizio;
  };
  /** Media arrotondata dei 7 score, 0-100 */
  score: number;
  sintesi: Sintesi;
  azionePrioritaria: string;
  puntiForza: VoceElenco[];
  areeAttenzione: VoceElenco[];
  analisiEstesa: string;
}
