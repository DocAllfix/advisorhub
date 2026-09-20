import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";

import { auth } from "./auth";
import { db, schema } from "./db";
import { MESSAGGIO_DEMO } from "./demo";

export type Studio = {
  userId: string;
  nomeUtente: string;
  email: string;
  organizationId: string;
  nomeStudio: string;
  /**
   * Studio dimostrativo: le azioni di scrittura sono inibite (vedi
   * `vietatoInDemo`). Serve per distribuire credenziali ai commercialisti
   * lasciandoli esplorare e simulare, senza che possano inserire i propri
   * clienti o alterare i due esempi.
   */
  demo: boolean;
};

export { MESSAGGIO_DEMO };

/**
 * Fonte unica del tenant scoping: risolve lo studio attivo dalla sessione,
 * mai da input del client. Reindirizza al login se non c'è sessione.
 *
 * Avvolta in `cache()`: durante un singolo render del server viene eseguita
 * una volta sola, anche se layout, pagina e query la chiamano tutte. Senza,
 * ogni chiamata ripeteva una andata e ritorno verso il database.
 */
export const requireStudio = cache(async function requireStudio(): Promise<Studio> {
  const sessione = await auth.api.getSession({ headers: await headers() });
  if (!sessione) redirect("/login");

  const attivo = sessione.session.activeOrganizationId ?? null;

  // Una sola query risolve appartenenza e nome dello studio: prima servivano
  // una lettura della membership e una fetch dell'organizzazione completa.
  const righe = await db
    .select({
      organizationId: schema.organization.id,
      nomeStudio: schema.organization.name,
      metadata: schema.organization.metadata,
    })
    .from(schema.member)
    .innerJoin(schema.organization, eq(schema.organization.id, schema.member.organizationId))
    .where(
      attivo
        ? and(eq(schema.member.userId, sessione.user.id), eq(schema.member.organizationId, attivo))
        : eq(schema.member.userId, sessione.user.id),
    )
    // Ordine deterministico: senza, il fallback "prima membership qualsiasi"
    // (quando activeOrganizationId e' nullo) sceglierebbe uno studio a caso il
    // giorno in cui organizationLimit venisse alzato sopra 1.
    .orderBy(asc(schema.member.createdAt), asc(schema.organization.id))
    .limit(1);

  const studio = righe[0];
  if (!studio) redirect("/login");

  // metadata è un JSON testuale gestito da Better Auth: { "demo": true }
  let demo = false;
  if (studio.metadata) {
    try {
      demo = JSON.parse(studio.metadata)?.demo === true;
    } catch {
      demo = false;
    }
  }

  return {
    userId: sessione.user.id,
    nomeUtente: sessione.user.name,
    email: sessione.user.email,
    organizationId: studio.organizationId,
    nomeStudio: studio.nomeStudio,
    demo,
  };
});

/**
 * Barriera per le azioni di scrittura: da chiamare in testa a ogni server
 * action che modifica dati. Se lo studio è dimostrativo restituisce l'esito
 * di errore con il messaggio esplicito, altrimenti null (si prosegue).
 *
 * Il controllo è qui, sul server: bloccare solo i pulsanti lascerebbe passare
 * chi chiama l'azione per altra via, e comunque la regola vera del dominio
 * deve stare accanto ai dati.
 */
export function vietatoInDemo(studio: Pick<Studio, "demo">): { ok: false; errore: string } | null {
  return studio.demo ? { ok: false, errore: MESSAGGIO_DEMO } : null;
}
