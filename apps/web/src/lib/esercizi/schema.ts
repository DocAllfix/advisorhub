import { z } from "zod";

/** Campo numerico obbligatorio (NaN da input vuoto → errore). */
const numero = z
  .number({ error: "Inserisci un numero" })
  .refine((n) => Number.isFinite(n), "Valore non valido");

/** Numerico obbligatorio e non negativo (quantità che non possono essere negative). */
const numeroNonNeg = numero.refine((n) => n >= 0, "Non può essere negativo");

/**
 * Numerico opzionale non negativo. Il form mappa i campi vuoti a `undefined`
 * (setValueAs), quindi qui basta rendere il numero opzionale.
 */
const numeroOpz = z
  .number({ error: "Inserisci un numero" })
  .refine((n) => Number.isFinite(n), "Valore non valido")
  .refine((n) => n >= 0, "Non può essere negativo")
  .optional();

export const esercizioSchema = z
  .object({
    anno: z
      .number({ error: "Anno obbligatorio" })
      .int("Anno non valido")
      .min(1900, "Anno non valido")
      .max(2100, "Anno non valido"),

    // Conto economico
    valProd: numeroNonNeg,
    fatturato: numeroNonNeg,
    ro: numero,
    ebitda: numero,
    utileNetto: numero,
    // Patrimoniale
    capInvest: numeroNonNeg,
    patrNetto: numero,
    // Finanziario
    pfn: numero,
    servizioDebito: numeroNonNeg,
    flussoCassa: numero,

    // Previsionale 6M (opzionale, tutto o niente)
    liquiditaIniziale: numeroOpz,
    entrate6m: numeroOpz,
    uscite6m: numeroOpz,
    debito6m: numeroOpz,
  })
  .superRefine((v, ctx) => {
    const prev = [v.liquiditaIniziale, v.entrate6m, v.uscite6m, v.debito6m];
    const compilati = prev.filter((x) => x !== undefined).length;
    if (compilati > 0 && compilati < 4) {
      for (const campo of ["liquiditaIniziale", "entrate6m", "uscite6m", "debito6m"] as const) {
        if (v[campo] === undefined) {
          ctx.addIssue({
            code: "custom",
            path: [campo],
            message: "Compila tutti i 4 campi previsionali o lasciali vuoti",
          });
        }
      }
    }
  });

export type EsercizioInput = z.infer<typeof esercizioSchema>;

/** Separa input in dati storici (10) e previsionali 6M (4, o null se incompleti). */
export function separaEsercizio(v: EsercizioInput) {
  const dati = {
    valProd: v.valProd,
    fatturato: v.fatturato,
    ro: v.ro,
    capInvest: v.capInvest,
    patrNetto: v.patrNetto,
    utileNetto: v.utileNetto,
    ebitda: v.ebitda,
    pfn: v.pfn,
    servizioDebito: v.servizioDebito,
    flussoCassa: v.flussoCassa,
  };
  const haPrev =
    v.liquiditaIniziale !== undefined &&
    v.entrate6m !== undefined &&
    v.uscite6m !== undefined &&
    v.debito6m !== undefined;
  const previsionale = haPrev
    ? {
        liquiditaIniziale: v.liquiditaIniziale!,
        entrate6m: v.entrate6m!,
        uscite6m: v.uscite6m!,
        debito6m: v.debito6m!,
      }
    : null;
  return { dati, previsionale };
}
