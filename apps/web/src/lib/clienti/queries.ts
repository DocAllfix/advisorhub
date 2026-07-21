import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { requireStudio } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analisi, clienti, esercizi } from "@/lib/schema-dominio";

export type ClienteLista = {
  id: string;
  ragioneSociale: string;
  codiceAteco: string | null;
  dimensione: string | null;
  updatedAt: Date;
  /** Punteggio dell'analisi più recente, null se il cliente non ne ha ancora. */
  score: number | null;
};

/** Clienti attivi (non archiviati) dello studio corrente, ordine alfabetico. */
export async function listClienti(): Promise<ClienteLista[]> {
  const { organizationId } = await requireStudio();
  const righe = await db
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

  const punteggi = await ultimiPunteggi(organizationId);
  return righe.map((c) => ({ ...c, score: punteggi.get(c.id) ?? null }));
}

/**
 * Punteggio della salute corrente di ogni cliente: l'analisi dell'esercizio
 * più recente (non quella inserita per ultima, altrimenti caricare a posteriori
 * un anno vecchio farebbe regredire il punteggio mostrato). A parità di anno
 * vince la versione più recente.
 *
 * Query separata con alias espliciti: in un template SQL Drizzle non qualifica
 * i nomi di colonna, e una subquery correlata finirebbe per confrontare
 * colonne della tabella sbagliata.
 */
async function ultimiPunteggi(organizationId: string): Promise<Map<string, number>> {
  const res = await db.execute<{ cliente_id: string; score: number }>(sql`
    select distinct on (a.cliente_id) a.cliente_id, a.score
    from ${analisi} a
    join ${clienti} c on c.id = a.cliente_id
    left join ${esercizi} e on e.id = a.esercizio_id
    where c.organization_id = ${organizationId}
    order by a.cliente_id, e.anno desc nulls last, a.created_at desc
  `);
  const righe =
    "rows" in res ? res.rows : (res as unknown as { cliente_id: string; score: number }[]);
  return new Map(righe.map((r) => [r.cliente_id, Number(r.score)]));
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
