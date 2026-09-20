import { db, type Esecutore } from "@/lib/db";
import { mailOutbox } from "@/lib/schema-dominio";

import type { Messaggio } from "./template";

/**
 * Accoda un messaggio in mail_outbox.
 *
 * Passando la transazione della mutazione che la origina, la mail viene scritta
 * nella STESSA transazione: se il dominio non si salva la mail non parte, e
 * viceversa. Nessuna email fantasma, nessuna mutazione senza notifica.
 */
export async function accoda(
  destinatario: string,
  messaggio: Messaggio,
  opzioni: { organizationId?: string | null; esecutore?: Esecutore } = {},
): Promise<void> {
  const esecutore = opzioni.esecutore ?? db;
  await esecutore.insert(mailOutbox).values({
    organizationId: opzioni.organizationId ?? null,
    destinatario,
    oggetto: messaggio.oggetto,
    corpoTesto: messaggio.testo,
    corpoHtml: messaggio.html,
  });
}
