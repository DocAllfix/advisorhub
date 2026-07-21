import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { requireStudio } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { clienti, esercizi } from "@/lib/schema-dominio";

/** Verifica che il cliente appartenga allo studio corrente; ritorna org o null. */
async function clienteDelloStudio(clienteId: string, organizationId: string) {
  const [c] = await db
    .select({ id: clienti.id, ragioneSociale: clienti.ragioneSociale })
    .from(clienti)
    .where(and(eq(clienti.id, clienteId), eq(clienti.organizationId, organizationId)))
    .limit(1);
  return c ?? null;
}

/** Esercizi di un cliente dello studio corrente, dal più recente. */
export async function listEsercizi(clienteId: string) {
  const { organizationId } = await requireStudio();
  const cliente = await clienteDelloStudio(clienteId, organizationId);
  if (!cliente) return [];
  return db
    .select()
    .from(esercizi)
    .where(eq(esercizi.clienteId, clienteId))
    .orderBy(desc(esercizi.anno));
}

/** Un esercizio per id, solo se il suo cliente appartiene allo studio corrente. */
export async function getEsercizio(esercizioId: string) {
  const { organizationId } = await requireStudio();
  const [row] = await db
    .select({ esercizio: esercizi, clienteId: clienti.id, ragioneSociale: clienti.ragioneSociale })
    .from(esercizi)
    .innerJoin(clienti, eq(clienti.id, esercizi.clienteId))
    .where(and(eq(esercizi.id, esercizioId), eq(clienti.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}
