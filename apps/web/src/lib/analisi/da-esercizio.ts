import type { DatiBilancio, DatiPrevisionali6M } from "@finbeacon/engine";

/** Riga di esercizio come arriva dal database (campi previsionali opzionali). */
type RigaEsercizio = {
  valProd: number;
  fatturato: number;
  ro: number;
  capInvest: number;
  patrNetto: number;
  utileNetto: number;
  ebitda: number;
  pfn: number;
  servizioDebito: number;
  flussoCassa: number;
  liquiditaIniziale: number | null;
  entrate6m: number | null;
  uscite6m: number | null;
  debito6m: number | null;
};

/** Le 10 grandezze da passare al motore. */
export function datiDa(e: RigaEsercizio): DatiBilancio {
  return {
    valProd: e.valProd,
    fatturato: e.fatturato,
    ro: e.ro,
    capInvest: e.capInvest,
    patrNetto: e.patrNetto,
    utileNetto: e.utileNetto,
    ebitda: e.ebitda,
    pfn: e.pfn,
    servizioDebito: e.servizioDebito,
    flussoCassa: e.flussoCassa,
  };
}

/** I dati di tesoreria 6M, solo se l'esercizio li ha tutti e quattro. */
export function previsionaleDa(e: RigaEsercizio): DatiPrevisionali6M | null {
  return e.liquiditaIniziale !== null &&
    e.entrate6m !== null &&
    e.uscite6m !== null &&
    e.debito6m !== null
    ? {
        liquiditaIniziale: e.liquiditaIniziale,
        entrate6m: e.entrate6m,
        uscite6m: e.uscite6m,
        debito6m: e.debito6m,
      }
    : null;
}
