import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { auth } from "./auth";
import { db, schema } from "./db";

export type Studio = {
  userId: string;
  nomeUtente: string;
  email: string;
  organizationId: string;
  nomeStudio: string;
};

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
    })
    .from(schema.member)
    .innerJoin(schema.organization, eq(schema.organization.id, schema.member.organizationId))
    .where(
      attivo
        ? and(eq(schema.member.userId, sessione.user.id), eq(schema.member.organizationId, attivo))
        : eq(schema.member.userId, sessione.user.id),
    )
    .limit(1);

  const studio = righe[0];
  if (!studio) redirect("/login");

  return {
    userId: sessione.user.id,
    nomeUtente: sessione.user.name,
    email: sessione.user.email,
    organizationId: studio.organizationId,
    nomeStudio: studio.nomeStudio,
  };
});
