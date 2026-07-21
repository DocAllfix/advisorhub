import type { DatiBilancio, DatiPrevisionali6M, Indicatori } from "./types";

/**
 * Formule degli indicatori, porting fedele del prototipo.
 *
 * Nota metodo (ereditata e documentata nel README): il Turnover usa il
 * Fatturato mentre il ROS usa il Valore della Produzione; per questo
 * ROI ≈ ROS × Turnover è un'approssimazione, non un'identità.
 *
 * Convenzioni sui casi limite (dal prototipo):
 * - divisore a 0 → null (indicatore non calcolabile), tranne:
 *   - GI con EBITDA=0: 99 se PFN>0 ("mai ripagabile"), 0 se PFN=0, null se PFN<0
 *   - DSCR con Servizio Debito=0: 99 se flusso>0, 0 se flusso=0, null se flusso<0
 * - invGi con PFN=0 → 0
 * - DSCR prospettico 6M (prototipo v3c2) con Debito 6M=0: 99 se disponibilità>0,
 *   altrimenti 0; null se i dati previsionali non sono forniti
 */
export function calcolaIndicatori(d: DatiBilancio, prev?: DatiPrevisionali6M): Indicatori {
  const ros = d.valProd !== 0 ? (d.ro / d.valProd) * 100 : null;
  const turnover = d.capInvest !== 0 ? d.fatturato / d.capInvest : null;
  const ic = turnover !== null && turnover !== 0 ? 1 / turnover : null;
  const roi = d.capInvest !== 0 ? (d.ro / d.capInvest) * 100 : null;
  const roe = d.patrNetto !== 0 ? (d.utileNetto / d.patrNetto) * 100 : null;
  const gi = d.ebitda !== 0 ? d.pfn / d.ebitda : d.pfn > 0 ? 99 : d.pfn === 0 ? 0 : null;
  const invGi = d.pfn !== 0 ? (d.ebitda / d.pfn) * 100 : 0;
  const dscr =
    d.servizioDebito !== 0
      ? d.flussoCassa / d.servizioDebito
      : d.flussoCassa > 0
        ? 99
        : d.flussoCassa === 0
          ? 0
          : null;

  const disponibile6m = prev ? prev.liquiditaIniziale + prev.entrate6m - prev.uscite6m : null;
  const dscrProspettico =
    prev && disponibile6m !== null
      ? prev.debito6m === 0
        ? disponibile6m > 0
          ? 99
          : 0
        : disponibile6m / prev.debito6m
      : null;

  return { ros, turnover, ic, roi, roe, gi, invGi, dscr, disponibile6m, dscrProspettico };
}
