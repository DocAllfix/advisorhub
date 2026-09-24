/**
 * Le scelte del modulo di richiesta, condivise fra l'azione (validazione) e il
 * modulo (etichette). Stanno qui e non in `app/azioni.ts` perché un file
 * "use server" può esportare solo funzioni asincrone.
 */

export const MOTIVI = {
  demo: "Vedere una demo",
  appuntamento: "Fissare un appuntamento",
  acquisto: "Attivare FinBeacon per lo studio",
} as const;

export type Motivo = keyof typeof MOTIVI;

export function eMotivo(valore: string | null | undefined): valore is Motivo {
  return typeof valore === "string" && valore in MOTIVI;
}

export const FASCE_CLIENTI = ["fino a 50", "da 50 a 200", "da 200 a 500", "oltre 500"] as const;

export type CampoModulo =
  "nome" | "studio" | "email" | "telefono" | "clienti" | "motivo" | "messaggio";

export type EsitoRichiesta =
  | { stato: "inattivo" }
  | { stato: "inviata" }
  | { stato: "non-valida"; errori: Partial<Record<CampoModulo, string>>; valori: ValoriModulo }
  | { stato: "errore"; valori: ValoriModulo };

/**
 * I valori inseriti, rimandati indietro quando l'invio non va a buon fine:
 * React 19 azzera i campi del modulo dopo ogni azione, e senza questi chi
 * sbaglia l'email ritroverebbe il modulo vuoto.
 */
export type ValoriModulo = Partial<Record<CampoModulo, string>>;
