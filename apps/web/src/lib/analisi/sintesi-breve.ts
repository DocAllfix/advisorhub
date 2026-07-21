import type { Tono } from "@advisorhub/engine";

/**
 * Etichetta breve del punteggio di sintesi, per liste e tabelle.
 * Le soglie sono le stesse fasce del motore (30 / 55 / 75 / 90).
 */
export function sinteticoDaScore(score: number): { label: string; tone: Tono } {
  if (score < 30) return { label: "Da ristrutturare", tone: "critico" };
  if (score < 55) return { label: "Fragile", tone: "attenzione" };
  if (score < 75) return { label: "Migliorabile", tone: "buono" };
  if (score < 90) return { label: "Sana", tone: "buono" };
  return { label: "Eccellente", tone: "eccellente" };
}
