import { z } from "zod";

import { CATEGORIE } from "./etichette";

export { CATEGORIE, etichettaCategoria } from "./etichette";

export const scadenzaSchema = z.object({
  titolo: z.string().trim().min(1, "Il titolo è obbligatorio").max(200, "Massimo 200 caratteri"),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Data non valida"),
  categoria: z.enum(CATEGORIE),
  clienteId: z.string().uuid().optional().or(z.literal("")),
  note: z.string().trim().max(2000, "Massimo 2000 caratteri").optional(),
});

export type ScadenzaInput = z.infer<typeof scadenzaSchema>;
