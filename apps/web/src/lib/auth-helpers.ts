import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "./auth";
import { db, schema } from "./db";

export type Studio = {
  userId: string;
  organizationId: string;
};

/**
 * Fonte unica del tenant scoping: risolve lo studio attivo dalla sessione,
 * mai da input del client. Ogni query/action di dominio parte da qui.
 * Reindirizza al login se non c'è sessione.
 */
export async function requireStudio(): Promise<Studio> {
  const h = await headers();
  const sessione = await auth.api.getSession({ headers: h });
  if (!sessione) redirect("/login");

  let organizationId = sessione.session.activeOrganizationId ?? null;

  // Fallback: sessione senza studio attivo → prima membership dell'utente
  if (!organizationId) {
    const membri = await db
      .select({ organizationId: schema.member.organizationId })
      .from(schema.member)
      .where(eq(schema.member.userId, sessione.user.id))
      .limit(1);
    organizationId = membri[0]?.organizationId ?? null;
  }

  if (!organizationId) redirect("/login");

  return { userId: sessione.user.id, organizationId };
}
