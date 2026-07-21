import { formatNumero, parseNumeroIt } from "./numeri";
import type { Analisi, DatiBilancio, DatiPrevisionali6M } from "./types";

/**
 * Mappatura CSV ⇄ dati di bilancio. Porting migliorato del prototipo:
 * import con matching fuzzy delle intestazioni e numeri it-IT; export con le
 * colonne del prototipo v3c2, così che un file esportato sia re-importabile.
 */

/** Alias delle intestazioni per il matching per inclusione (tutto lowercase). */
const ALIAS_BILANCIO: Record<keyof DatiBilancio, string[]> = {
  valProd: ["valore produzione", "valore della produzione", "val prod"],
  fatturato: ["fatturato", "ricavi"],
  ro: ["reddito operativo", "ro"],
  capInvest: ["capitale investito", "cap invest"],
  patrNetto: ["patrimonio netto", "patr netto"],
  utileNetto: ["utile netto"],
  ebitda: ["ebitda", "mol"],
  pfn: ["pfn", "debito finanziario", "posizione finanziaria"],
  servizioDebito: ["servizio debito", "servizio del debito", "rata annua"],
  flussoCassa: ["flusso cassa", "flusso di cassa", "flusso"],
};

/**
 * Alias volutamente stretti: un alias generico come "cassa" catturerebbe
 * "Flusso Cassa Operativo", riempiendo per errore i campi previsionali.
 */
const ALIAS_PREVISIONALE: Record<keyof DatiPrevisionali6M, string[]> = {
  liquiditaIniziale: ["liquidita iniziale", "liquidità iniziale", "liquidita", "liquidità"],
  entrate6m: ["entrate 6m", "entrate previste", "entrate"],
  uscite6m: ["uscite 6m", "uscite previste", "uscite"],
  debito6m: ["debito 6m", "debito da servire"],
};

const ALIAS_NOME = ["nome cliente", "cliente", "azienda", "ragione sociale"];

function normalizza(chiave: string): string {
  return chiave.trim().toLowerCase();
}

/** Trova, tra le chiavi del record, la prima che include uno degli alias. */
function trovaValore(record: Record<string, string>, alias: string[]): string | null {
  const chiavi = Object.keys(record);
  for (const a of alias) {
    const chiave = chiavi.find((k) => normalizza(k).includes(a));
    if (chiave !== undefined) return record[chiave] ?? null;
  }
  return null;
}

export interface BilancioDaCsv {
  nomeCliente: string | null;
  dati: Partial<DatiBilancio>;
  previsionale: Partial<DatiPrevisionali6M>;
  /** Numero di campi numerici riconosciuti e interpretati. */
  nCampi: number;
}

/**
 * Interpreta un record intestazione→valore (una riga CSV) in dati di bilancio.
 * Le intestazioni sono abbinate per inclusione, i numeri col formato it-IT.
 */
export function mappaBilancioDaCsv(record: Record<string, string>): BilancioDaCsv {
  const dati: Partial<DatiBilancio> = {};
  const previsionale: Partial<DatiPrevisionali6M> = {};
  let nCampi = 0;

  for (const campo of Object.keys(ALIAS_BILANCIO) as (keyof DatiBilancio)[]) {
    const grezzo = trovaValore(record, ALIAS_BILANCIO[campo]);
    const n = parseNumeroIt(grezzo);
    if (n !== null) {
      dati[campo] = n;
      nCampi++;
    }
  }
  for (const campo of Object.keys(ALIAS_PREVISIONALE) as (keyof DatiPrevisionali6M)[]) {
    const grezzo = trovaValore(record, ALIAS_PREVISIONALE[campo]);
    const n = parseNumeroIt(grezzo);
    if (n !== null) {
      previsionale[campo] = n;
      nCampi++;
    }
  }

  const nomeGrezzo = trovaValore(record, ALIAS_NOME);
  const nomeCliente = nomeGrezzo ? nomeGrezzo.replace(/^"|"$/g, "").trim() || null : null;

  return { nomeCliente, dati, previsionale, nCampi };
}

/** Intestazioni dell'export CSV (26 colonne, come il prototipo v3c2). */
export const INTESTAZIONI_EXPORT = [
  "Nome Cliente",
  "Valore Produzione",
  "Fatturato",
  "Reddito Operativo",
  "Capitale Investito",
  "Patrimonio Netto",
  "Utile Netto",
  "EBITDA",
  "PFN",
  "Servizio Debito Annuo",
  "Flusso Cassa Operativo",
  "ROS %",
  "Turnover",
  "IC",
  "ROI %",
  "ROI-I %",
  "ROE %",
  "GI anni",
  "DSCR",
  "Liquidita Iniziale",
  "Entrate 6M",
  "Uscite 6M",
  "Debito 6M",
  "Disponibile 6M",
  "DSCR Prospettico 6M",
  "Data",
] as const;

function cella(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

/** Riga export (valori grezzi, non formattati) per un esercizio analizzato. */
export function rigaExport(
  nomeCliente: string,
  dati: DatiBilancio,
  previsionale: DatiPrevisionali6M | null,
  analisi: Analisi,
  data: string,
): string[] {
  const i = analisi.indicatori;
  return [
    nomeCliente,
    cella(dati.valProd),
    cella(dati.fatturato),
    cella(dati.ro),
    cella(dati.capInvest),
    cella(dati.patrNetto),
    cella(dati.utileNetto),
    cella(dati.ebitda),
    cella(dati.pfn),
    cella(dati.servizioDebito),
    cella(dati.flussoCassa),
    cella(i.ros),
    cella(i.turnover),
    cella(i.ic),
    cella(i.roi),
    cella(i.roi), // ROI-I: stessa base del ROI
    cella(i.roe),
    cella(i.gi),
    cella(i.dscr),
    cella(previsionale?.liquiditaIniziale),
    cella(previsionale?.entrate6m),
    cella(previsionale?.uscite6m),
    cella(previsionale?.debito6m),
    cella(i.disponibile6m),
    cella(i.dscrProspettico),
    data,
  ];
}

/** Serializza una riga CSV con escaping degli apici e virgole. */
export function serializzaCsv(righe: string[][]): string {
  return righe
    .map((riga) => riga.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

export { formatNumero };
