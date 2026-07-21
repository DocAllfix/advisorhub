import "server-only";

import { sql } from "drizzle-orm";

import { requireStudio } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analisi, clienti, esercizi } from "@/lib/schema-dominio";

export type RigaPanoramica = {
  clienteId: string;
  ragioneSociale: string;
  anno: number | null;
  score: number | null;
  dscr: number | null;
  dscrProspettico: number | null;
};

export type Panoramica = {
  nomeStudio: string;
  totaleClienti: number;
  conAnalisi: number;
  punteggioMedio: number | null;
  inAllerta: number;
  dscrSottoSoglia: number;
  dscr6mSottoSoglia: number;
  righe: RigaPanoramica[];
};

/**
 * Fotografia del portafoglio: per ogni cliente l'analisi dell'esercizio più
 * recente. Query unica con alias espliciti (in un template SQL Drizzle non
 * qualifica i nomi di colonna) e DISTINCT ON per non caricare tutto lo storico.
 */
export async function panoramicaStudio(): Promise<Panoramica> {
  const { organizationId, nomeStudio } = await requireStudio();

  const res = await db.execute<{
    cliente_id: string;
    ragione_sociale: string;
    anno: number | null;
    score: number | null;
    dscr: string | null;
    dscr_prospettico: string | null;
  }>(sql`
    select distinct on (c.id)
      c.id            as cliente_id,
      c.ragione_sociale,
      e.anno,
      a.score,
      a.output -> 'indicatori' ->> 'dscr'            as dscr,
      a.output -> 'indicatori' ->> 'dscrProspettico' as dscr_prospettico
    from ${clienti} c
    left join ${analisi} a on a.cliente_id = c.id
    left join ${esercizi} e on e.id = a.esercizio_id
    where c.organization_id = ${organizationId} and c.archiviato_at is null
    order by c.id, e.anno desc nulls last, a.created_at desc
  `);
  const grezze = "rows" in res ? res.rows : (res as never);

  const righe: RigaPanoramica[] = grezze.map((r) => ({
    clienteId: r.cliente_id,
    ragioneSociale: r.ragione_sociale,
    anno: r.anno,
    score: r.score === null ? null : Number(r.score),
    dscr: r.dscr === null ? null : Number(r.dscr),
    dscrProspettico: r.dscr_prospettico === null ? null : Number(r.dscr_prospettico),
  }));

  const analizzati = righe.filter((r) => r.score !== null);
  const punteggioMedio =
    analizzati.length > 0
      ? Math.round(analizzati.reduce((s, r) => s + (r.score ?? 0), 0) / analizzati.length)
      : null;

  return {
    nomeStudio,
    totaleClienti: righe.length,
    conAnalisi: analizzati.length,
    punteggioMedio,
    inAllerta: analizzati.filter((r) => (r.score ?? 100) < 55).length,
    dscrSottoSoglia: righe.filter((r) => r.dscr !== null && r.dscr < 1.2).length,
    dscr6mSottoSoglia: righe.filter((r) => r.dscrProspettico !== null && r.dscrProspettico < 1.1)
      .length,
    // I più fragili in cima: è la lista su cui il commercialista agisce
    righe: [...analizzati].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)),
  };
}
