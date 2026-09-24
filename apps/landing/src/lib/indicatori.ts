import {
  formatNumero,
  giudicaDscr,
  giudicaGi,
  giudicaRoe,
  giudicaRoi,
  giudicaRoiIndustriale,
  giudicaRos,
  giudicaTurnover,
  SOGLIE_GIUDIZIO,
  type Analisi,
  type Giudizio,
} from "@advisorhub/engine";

/**
 * I sette indicatori come li mostra il prodotto: titolo, descrizione in chiaro,
 * valore formattato, soglia e giudizio. Titoli e descrizioni sono quelli di
 * `apps/web/src/lib/analisi/indicatori-meta.ts` e `lib/report/soglie.ts`.
 *
 * La SOGLIA si legge da `SOGLIE_GIUDIZIO` e si formatta qui: scriverla come
 * testo («soglia 10%») la farebbe invecchiare il giorno in cui il motore la
 * cambia (GUASTI G-29). I giudizi sono del motore.
 */
export type ChiaveIndicatore = "ros" | "turnover" | "roi" | "roiI" | "roe" | "gi" | "dscr";

export interface RigaIndicatore {
  chiave: ChiaveIndicatore;
  titolo: string;
  descrizione: string;
  valore: string;
  soglia: string;
  giudizio: Giudizio;
}

const perc = (v: number | null) => (v === null ? "n.d." : `${formatNumero(v, 1)}%`);
const rapporto = (v: number | null) => (v === null ? "n.d." : v >= 99 ? "∞" : formatNumero(v, 2));

const META: Record<
  ChiaveIndicatore,
  { titolo: string; descrizione: string; valore: (a: Analisi) => string; unita: "%" | "" | " anni" }
> = {
  ros: {
    titolo: "ROS",
    descrizione: "Redditività delle vendite",
    valore: (a) => perc(a.indicatori.ros),
    unita: "%",
  },
  turnover: {
    titolo: "Turnover",
    descrizione: "Rotazione del capitale",
    valore: (a) => rapporto(a.indicatori.turnover),
    unita: "",
  },
  roi: {
    titolo: "ROI",
    descrizione: "Rendimento del capitale",
    valore: (a) => perc(a.indicatori.roi),
    unita: "%",
  },
  roiI: {
    titolo: "ROI-I",
    descrizione: "Lettura industriale",
    valore: (a) => perc(a.indicatori.roi),
    unita: "%",
  },
  roe: {
    titolo: "ROE",
    descrizione: "Remunera il capitale di rischio",
    valore: (a) => perc(a.indicatori.roe),
    unita: "%",
  },
  gi: {
    titolo: "GI",
    descrizione: "Anni per ripagare il debito",
    valore: (a) => {
      const gi = a.indicatori.gi;
      if (gi === null) return "n.d.";
      if (gi >= 99) return "non ripagabile";
      return `${formatNumero(gi, 1)} anni`;
    },
    unita: " anni",
  },
  dscr: {
    titolo: "DSCR",
    descrizione: "Copertura del servizio del debito",
    valore: (a) => rapporto(a.indicatori.dscr),
    unita: "",
  },
};

export const ORDINE: readonly ChiaveIndicatore[] = [
  "ros",
  "turnover",
  "roi",
  "roiI",
  "roe",
  "gi",
  "dscr",
];

/**
 * Il giudizio che il motore dà ESATTAMENTE sulla soglia. `SOGLIE_GIUDIZIO` non
 * è il confine della sufficienza ma quello del giudizio migliore (il ROS è
 * «Buono» fra 5 e 10 e «Ottimo» da 10): scrivere «soglia 10%» accanto a un 5%
 * «Buono» è vero ma si legge come un errore. Chiedere il nome al motore invece
 * di scriverlo qui lo tiene allineato anche se un giorno le etichette cambiano.
 */
const GIUDICA: Record<ChiaveIndicatore, (valore: number) => Giudizio> = {
  ros: giudicaRos,
  turnover: giudicaTurnover,
  roi: giudicaRoi,
  roiI: giudicaRoiIndustriale,
  roe: giudicaRoe,
  // Sulla soglia di 2 anni l'EBITDA è positivo per definizione.
  gi: (v) => giudicaGi(v, { ebitda: 1 }),
  dscr: giudicaDscr,
};

function soglia(chiave: ChiaveIndicatore): string {
  const { soglia: s, minoreMeglio } = SOGLIE_GIUDIZIO[chiave];
  const unita = META[chiave].unita;
  const decimali = unita === "%" ? 0 : unita === " anni" ? 0 : 2;
  const nome = GIUDICA[chiave](s).label;
  return `${nome} ${minoreMeglio ? "entro" : "da"} ${formatNumero(s, decimali)}${unita}`;
}

export function righeIndicatori(
  a: Analisi,
  chiavi: readonly ChiaveIndicatore[] = ORDINE,
): RigaIndicatore[] {
  return chiavi.map((chiave) => ({
    chiave,
    titolo: META[chiave].titolo,
    descrizione: META[chiave].descrizione,
    valore: META[chiave].valore(a),
    soglia: soglia(chiave),
    giudizio: a.giudizi[chiave],
  }));
}
