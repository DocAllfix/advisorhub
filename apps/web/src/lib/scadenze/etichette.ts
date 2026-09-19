/**
 * Etichette di presentazione, SENZA zod.
 *
 * Stavano in `schema.ts`, che esegue `z.object(...)` in testa al modulo. Un
 * componente client che importava solo un'etichetta si portava dietro l'intero
 * zod (~310 KB), perche' codice con effetti al caricamento non si puo' togliere
 * dal bundle. `schema.ts` le riesporta: i chiamanti lato server non cambiano.
 */
export const CATEGORIE = [
  "bilancio",
  "iva",
  "imposte",
  "contributi",
  "adempimenti",
  "altro",
] as const;

export const etichettaCategoria: Record<(typeof CATEGORIE)[number], string> = {
  bilancio: "Bilancio",
  iva: "IVA",
  imposte: "Imposte",
  contributi: "Contributi",
  adempimenti: "Adempimenti",
  altro: "Altro",
};
