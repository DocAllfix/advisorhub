import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { requireStudio } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { clienti } from "@/lib/schema-dominio";

export type ClienteLista = {
  id: string;
  ragioneSociale: string;
  codiceAteco: string | null;
  dimensione: string | null;
  updatedAt: Date;
};

/** Clienti attivi (non archiviati) dello studio corrente, ordine alfabetico. */
export async function listClienti(): Promise<ClienteLista[]> {
  const { organizationId } = await requireStudio();
  return db
    .select({
      id: clienti.id,
      ragioneSociale: clienti.ragioneSociale,
      codiceAteco: clienti.codiceAteco,
      dimensione: clienti.dimensione,
      updatedAt: clienti.updatedAt,
    })
    .from(clienti)
    .where(and(eq(clienti.organizationId, organizationId), isNull(clienti.archiviatoAt)))
    .orderBy(asc(clienti.ragioneSociale));
}

/** Coppie id/nome dei clienti attivi, per la command palette. */
export async function listClientiPerRicerca(): Promise<{ id: string; ragioneSociale: string }[]> {
  const { organizationId } = await requireStudio();
  return db
    .select({ id: clienti.id, ragioneSociale: clienti.ragioneSociale })
    .from(clienti)
    .where(and(eq(clienti.organizationId, organizationId), isNull(clienti.archiviatoAt)))
    .orderBy(asc(clienti.ragioneSociale));
}

/** Un cliente dello studio corrente per id, o null se non appartiene allo studio. */
export async function getCliente(id: string) {
  const { organizationId } = await requireStudio();
  const [cliente] = await db
    .select()
    .from(clienti)
    .where(and(eq(clienti.id, id), eq(clienti.organizationId, organizationId)))
    .limit(1);
  return cliente ?? null;
}
