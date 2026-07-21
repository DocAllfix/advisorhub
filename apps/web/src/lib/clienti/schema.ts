import { z } from "zod";

export const DIMENSIONI = ["micro", "piccola", "media", "grande"] as const;

export const clienteSchema = z.object({
  ragioneSociale: z
    .string()
    .trim()
    .min(1, "La ragione sociale è obbligatoria")
    .max(200, "Massimo 200 caratteri"),
  codiceAteco: z
    .string()
    .trim()
    .max(20, "Codice ATECO troppo lungo")
    .regex(/^[0-9.]*$/, "Solo cifre e punti (es. 62.01)")
    .optional(),
  dimensione: z.enum(DIMENSIONI).optional(),
  note: z.string().trim().max(2000, "Massimo 2000 caratteri").optional(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

/** Normalizza i campi opzionali: stringa vuota → null, per la persistenza. */
export function normalizzaCliente(input: ClienteInput) {
  return {
    ragioneSociale: input.ragioneSociale,
    codiceAteco: input.codiceAteco?.trim() ? input.codiceAteco.trim() : null,
    dimensione: input.dimensione ?? null,
    note: input.note?.trim() ? input.note.trim() : null,
  };
}

export const etichettaDimensione: Record<(typeof DIMENSIONI)[number], string> = {
  micro: "Micro",
  piccola: "Piccola",
  media: "Media",
  grande: "Grande",
};
