/**
 * Etichette di presentazione, SENZA zod.
 *
 * Stavano in `schema.ts`, che esegue `z.object(...)` in testa al modulo. Un
 * componente client che importava solo un'etichetta si portava dietro l'intero
 * zod (~310 KB), perche' codice con effetti al caricamento non si puo' togliere
 * dal bundle. `schema.ts` le riesporta: i chiamanti lato server non cambiano.
 */
export const DIMENSIONI = ["micro", "piccola", "media", "grande"] as const;

export const etichettaDimensione: Record<(typeof DIMENSIONI)[number], string> = {
  micro: "Micro",
  piccola: "Piccola",
  media: "Media",
  grande: "Grande",
};
