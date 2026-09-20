import type { Tono } from "./types";

/**
 * Fotografia aggregata del portafoglio di uno studio, già ridotta a conteggi.
 * Le soglie che generano questi conteggi restano quelle del motore: attenzione
 * sotto 55 di score, DSCR sotto 1,2 (bancabilità), DSCR prospettico sotto 1,1
 * (CNDCEC, art. 3 CCII).
 */
export interface StatoPortafoglio {
  totaleClienti: number;
  conAnalisi: number;
  /** Media arrotondata degli score, null se nessun cliente è stato analizzato */
  punteggioMedio: number | null;
  inAllerta: number;
  dscrSottoSoglia: number;
  dscr6mSottoSoglia: number;
}

/** Lettura discorsiva del portafoglio, da mostrare in apertura di Panoramica. */
export interface SintesiPortafoglio {
  /** Titolo breve della fascia (es. "Portafoglio sano") */
  titolo: string;
  /** Frase che interpreta il dato, già pronta da leggere */
  frase: string;
  tono: Tono;
}

const plurale = (n: number, singolare: string, plurale: string) => (n === 1 ? singolare : plurale);

/** Unisce un elenco in italiano: "a", "a e b", "a, b e c". */
function elenca(voci: string[]): string {
  if (voci.length <= 1) return voci[0] ?? "";
  return `${voci.slice(0, -1).join(", ")} e ${voci[voci.length - 1]}`;
}

/** Attacco della frase per fascia di punteggio medio, senza punteggiatura finale. */
function attacco(medio: number): string {
  if (medio < 30) return "Il portafoglio è in tensione";
  if (medio < 55) return "Il portafoglio mostra fragilità diffusa";
  if (medio < 75) return "Il portafoglio regge";
  if (medio < 90) return "Il portafoglio è complessivamente sano";
  return "Il portafoglio è in salute su tutta la linea";
}

function titoloDi(medio: number): string {
  if (medio < 30) return "Portafoglio in tensione";
  if (medio < 55) return "Portafoglio fragile";
  if (medio < 75) return "Portafoglio solido";
  if (medio < 90) return "Portafoglio sano";
  return "Portafoglio in eccellenza";
}

/**
 * Traduce i conteggi del portafoglio in una lettura discorsiva.
 *
 * Regola di prodotto: quando non ci sono posizioni sotto soglia la frase deve
 * dirlo esplicitamente, senza inventare allarmi; quando ce ne sono, le nomina
 * in ordine di gravità (score, poi DSCR, poi prospettico 6M).
 */
export function sintetizzaPortafoglio(stato: StatoPortafoglio): SintesiPortafoglio {
  const { totaleClienti, conAnalisi, punteggioMedio, inAllerta } = stato;
  const { dscrSottoSoglia, dscr6mSottoSoglia } = stato;

  if (totaleClienti === 0) {
    return {
      titolo: "Nessun cliente in portafoglio",
      frase: "Aggiungi la prima azienda per vedere qui punteggi, allerte e priorità.",
      tono: "nd",
    };
  }

  if (conAnalisi === 0 || punteggioMedio === null) {
    return {
      titolo: "Portafoglio da analizzare",
      frase: `${totaleClienti} ${plurale(totaleClienti, "cliente in anagrafica", "clienti in anagrafica")}, nessun bilancio ancora caricato: carica un esercizio per iniziare a monitorarne la salute.`,
      tono: "nd",
    };
  }

  const criticita: string[] = [];
  if (inAllerta > 0) {
    criticita.push(
      `${inAllerta} ${plurale(inAllerta, "cliente", "clienti")} sotto la soglia di attenzione`,
    );
  }
  if (dscrSottoSoglia > 0) {
    criticita.push(`${dscrSottoSoglia} con DSCR sotto 1,2`);
  }
  if (dscr6mSottoSoglia > 0) {
    criticita.push(`${dscr6mSottoSoglia} in tensione sul prospettico a 6 mesi`);
  }

  const frase =
    criticita.length === 0
      ? `${attacco(punteggioMedio)}: nessuna posizione sotto le soglie di allerta.`
      : `${attacco(punteggioMedio)}, ma ${elenca(criticita)}.`;

  const tono: Tono =
    dscr6mSottoSoglia > 0 || punteggioMedio < 30
      ? "critico"
      : inAllerta > 0 || dscrSottoSoglia > 0 || punteggioMedio < 55
        ? "attenzione"
        : punteggioMedio >= 90
          ? "eccellente"
          : "buono";

  return { titolo: titoloDi(punteggioMedio), frase, tono };
}
