import { fasciaSalute, type FasciaSalute, type Tono } from "@finbeacon/engine";

/**
 * Etichetta e tono di una fascia di salute: sono PRESENTAZIONE, e sono le
 * stesse di `apps/web/src/lib/analisi/sintesi-breve.ts`, così la landing mostra
 * un cliente esattamente come lo mostra il prodotto.
 *
 * I CONFINI delle fasce non sono qui: li decide il motore (`fasciaSalute`).
 */
const PRESENTAZIONE: Record<FasciaSalute, { label: string; tone: Tono }> = {
  ristrutturare: { label: "Da ristrutturare", tone: "critico" },
  fragile: { label: "Fragile", tone: "attenzione" },
  migliorabile: { label: "Migliorabile", tone: "buono" },
  sana: { label: "Sana", tone: "buono" },
  eccellente: { label: "Eccellente", tone: "eccellente" },
};

export function sinteticoDaScore(score: number): { label: string; tone: Tono } {
  return PRESENTAZIONE[fasciaSalute(score)];
}
