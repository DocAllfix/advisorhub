import { and, asc, isNull, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { mailOutbox } from "@/lib/schema-dominio";

import { inviaSubito, smtpConfigurato } from "./mailer";

/**
 * Worker della coda di posta. Gira in un container separato (servizio
 * `mail-worker`), non dentro il server web: nessun endpoint HTTP da proteggere
 * e nessun token da custodire.
 */
export const MAX_TENTATIVI = 5;
const LOTTO = 100;
// Configurabile per i test end-to-end, che non possono aspettare mezzo minuto
// per vedere partire una mail.
const INTERVALLO_MS = Number(process.env.MAIL_INTERVALLO_MS ?? 30_000);

/**
 * Drena un lotto. Restituisce quante mail sono partite.
 *
 * FOR UPDATE SKIP LOCKED: se un giorno girassero due worker, si dividono la
 * coda invece di spedire due volte lo stesso messaggio.
 */
export async function drena(): Promise<number> {
  if (!smtpConfigurato()) return 0;

  const inSospeso = await db
    .select()
    .from(mailOutbox)
    .where(and(isNull(mailOutbox.inviataAt), lt(mailOutbox.tentativi, MAX_TENTATIVI)))
    .orderBy(asc(mailOutbox.createdAt))
    .limit(LOTTO)
    .for("update", { skipLocked: true });

  let spedite = 0;
  for (const mail of inSospeso) {
    // Il tentativo si registra PRIMA dell'invio: se il processo muore a metà,
    // il contatore è già salito e un messaggio velenoso non blocca la coda in
    // un ciclo infinito.
    await db
      .update(mailOutbox)
      .set({ tentativi: sql`${mailOutbox.tentativi} + 1` })
      .where(sql`${mailOutbox.id} = ${mail.id}`);

    try {
      await inviaSubito({
        a: mail.destinatario,
        oggetto: mail.oggetto,
        testo: mail.corpoTesto,
        html: mail.corpoHtml,
      });
      await db
        .update(mailOutbox)
        .set({ inviataAt: new Date(), ultimoErrore: null })
        .where(sql`${mailOutbox.id} = ${mail.id}`);
      spedite += 1;
    } catch (errore) {
      const messaggio = errore instanceof Error ? errore.message : String(errore);
      await db
        .update(mailOutbox)
        .set({ ultimoErrore: messaggio.slice(0, 500) })
        .where(sql`${mailOutbox.id} = ${mail.id}`);
      // Non si interrompe il lotto: un destinatario che rifiuta non deve
      // fermare le mail degli altri.
      console.error(`[posta] invio fallito (tentativo ${mail.tentativi + 1}):`, messaggio);
    }
  }
  return spedite;
}

/** Ciclo continuo. Punto d'ingresso del container mail-worker. */
export async function avvia(): Promise<never> {
  console.log(
    smtpConfigurato()
      ? "[posta] worker avviato"
      : "[posta] worker avviato SENZA SMTP: le mail restano in coda",
  );
  for (;;) {
    try {
      const n = await drena();
      if (n > 0) console.log(`[posta] ${n} messaggi spediti`);
    } catch (errore) {
      console.error("[posta] ciclo fallito:", errore);
    }
    await new Promise((r) => setTimeout(r, INTERVALLO_MS));
  }
}
