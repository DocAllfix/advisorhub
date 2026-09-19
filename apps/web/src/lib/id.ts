import { z } from "zod";

const UUID = z.string().uuid();

/**
 * Gli identificatori posizionali delle server action arrivano dal client e non
 * passano dagli schema zod degli input. Senza questo controllo un id malformato
 * raggiunge Postgres su una colonna uuid e produce un 500 grezzo invece di un
 * errore di dominio pulito.
 *
 * Non e' una difesa contro l'injection — drizzle parametrizza tutto — ma contro
 * le risposte illeggibili e il rumore nella telemetria.
 */
export function eUuid(valore: string): boolean {
  return UUID.safeParse(valore).success;
}
