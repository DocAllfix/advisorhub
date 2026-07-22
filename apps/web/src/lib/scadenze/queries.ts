import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { requireStudio } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { clienti, scadenze } from "@/lib/schema-dominio";

export type ScadenzaLista = {
  id: string;
  titolo: string;
  data: string;
  categoria: string;
  note: string | null;
  completata: boolean;
  clienteId: string | null;
  cliente: string | null;
};

/** Scadenze dello studio corrente, dalla più vicina, con nome cliente. */
export async function listScadenze(): Promise<ScadenzaLista[]> {
  const { organizationId } = await requireStudio();
  const righe = await db
    .select({
      id: scadenze.id,
      titolo: scadenze.titolo,
      data: scadenze.data,
      categoria: scadenze.categoria,
      note: scadenze.note,
      completataAt: scadenze.completataAt,
      clienteId: scadenze.clienteId,
      cliente: clienti.ragioneSociale,
    })
    .from(scadenze)
    .leftJoin(clienti, eq(clienti.id, scadenze.clienteId))
    .where(eq(scadenze.organizationId, organizationId))
    .orderBy(asc(scadenze.data));

  return righe.map((r) => ({
    id: r.id,
    titolo: r.titolo,
    data: r.data,
    categoria: r.categoria,
    note: r.note,
    completata: r.completataAt !== null,
    clienteId: r.clienteId,
    cliente: r.cliente,
  }));
}

/** Conteggi per la Panoramica: scadute (non completate) e in arrivo a 30 giorni. */
export async function contatoreScadenze(): Promise<{ scadute: number; inArrivo: number }> {
  const { organizationId } = await requireStudio();
  const oggi = new Date().toISOString().slice(0, 10);
  const fra30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const [row] = await db
    .select({
      scadute: sql<number>`count(*) filter (where ${scadenze.data} < ${oggi} and ${scadenze.completataAt} is null)`,
      inArrivo: sql<number>`count(*) filter (where ${scadenze.data} >= ${oggi} and ${scadenze.data} <= ${fra30} and ${scadenze.completataAt} is null)`,
    })
    .from(scadenze)
    .where(eq(scadenze.organizationId, organizationId));

  return { scadute: Number(row?.scadute ?? 0), inArrivo: Number(row?.inArrivo ?? 0) };
}

/** Clienti dello studio per il selettore nel form scadenza. */
export async function clientiPerScadenze(): Promise<{ id: string; ragioneSociale: string }[]> {
  const { organizationId } = await requireStudio();
  return db
    .select({ id: clienti.id, ragioneSociale: clienti.ragioneSociale })
    .from(clienti)
    .where(and(eq(clienti.organizationId, organizationId), isNull(clienti.archiviatoAt)))
    .orderBy(asc(clienti.ragioneSociale));
}
