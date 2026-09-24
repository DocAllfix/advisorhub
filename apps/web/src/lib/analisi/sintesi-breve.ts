import { fasciaSalute, type FasciaSalute, type Tono } from "@finbeacon/engine";

/**
 * Etichetta breve del punteggio, per liste e tabelle.
 *
 * Le SOGLIE non sono qui: le decide il motore (`fasciaSalute`). Qui restano solo
 * etichetta e tono, che sono presentazione. Prima i confini 30/55/75/90 erano
 * riscritti anche in questo file: due copie degli stessi numeri divergono al
 * primo che si tocca, e la tabella mostrerebbe una fascia diversa dal report
 * senza che niente fallisca.
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

/**
 * Un cliente "in allerta" è quello che il motore colloca nelle due fasce basse.
 * Scritto così invece che con un numero, perché se le fasce cambiassero questo
 * elenco resterebbe indietro in silenzio.
 */
export function inAllerta(score: number | null): boolean {
  if (score === null) return false;
  const f = fasciaSalute(score);
  return f === "ristrutturare" || f === "fragile";
}
