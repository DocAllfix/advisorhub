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

export type FasciaSalute = "eccellente" | "sana" | "migliorabile" | "fragile" | "ristrutturare";

/** Punto della serie storica: punteggio medio dello studio in un esercizio. */
export type PuntoTrend = { anno: number; media: number; clienti: number };

export type Panoramica = {
  nomeStudio: string;
  totaleClienti: number;
  conAnalisi: number;
  punteggioMedio: number | null;
  inAllerta: number;
  dscrSottoSoglia: number;
  dscr6mSottoSoglia: number;
  distribuzione: Record<FasciaSalute, number>;
  righe: RigaPanoramica[];
  /** Vuoto se lo studio ha meno di due annualità: la scena resta senza trend. */
  trend: PuntoTrend[];
  /**
   * Variazione a perimetro omogeneo fra le ultime due annualità, calcolata sui
   * soli clienti presenti in entrambe. Confrontare medie su insiemi diversi di
   * clienti produrrebbe un delta senza significato.
   */
  deltaOmogeneo: { valore: number; annoPrec: number; clienti: number } | null;
};

function fasciaDi(score: number): FasciaSalute {
  if (score < 30) return "ristrutturare";
  if (score < 55) return "fragile";
  if (score < 75) return "migliorabile";
  if (score < 90) return "sana";
  return "eccellente";
}

/**
 * Fotografia del portafoglio: per ogni cliente l'analisi dell'esercizio più
 * recente. Query unica con alias espliciti (in un template SQL Drizzle non
 * qualifica i nomi di colonna) e DISTINCT ON per non caricare tutto lo storico.
 */
export async function panoramicaStudio(): Promise<Panoramica> {
  const { organizationId, nomeStudio } = await requireStudio();

  const [res, resTrend] = await Promise.all([
    db.execute<{
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
    `),
    // Serie storica per cliente e anno: per ogni esercizio l'analisi più recente.
    db.execute<{ anno: number; cliente_id: string; score: number }>(sql`
      select e.anno as anno, u.cliente_id as cliente_id, u.score as score
      from (
        select distinct on (a.esercizio_id)
          a.esercizio_id as esercizio_id, a.cliente_id as cliente_id, a.score as score
        from ${analisi} a
        join ${clienti} c on c.id = a.cliente_id
        where c.organization_id = ${organizationId} and c.archiviato_at is null
        order by a.esercizio_id, a.created_at desc
      ) u
      join ${esercizi} e on e.id = u.esercizio_id
      order by e.anno
    `),
  ]);
  const grezze = "rows" in res ? res.rows : (res as never);
  const grezzeTrend = "rows" in resTrend ? resTrend.rows : (resTrend as never);

  // Punteggi per anno, e per anno la mappa cliente -> punteggio (serve al delta)
  const perAnno = new Map<number, Map<string, number>>();
  for (const r of grezzeTrend) {
    const anno = Number(r.anno);
    if (!perAnno.has(anno)) perAnno.set(anno, new Map());
    perAnno.get(anno)!.set(r.cliente_id, Number(r.score));
  }
  const anni = [...perAnno.keys()].sort((a, b) => a - b);

  const media = (v: number[]) => v.reduce((s, n) => s + n, 0) / v.length;

  /*
   * Perimetro omogeneo: solo i clienti con un bilancio in tutte le annualità.
   * Linea e variazione poggiano sulla stessa base, altrimenti la scena
   * mostrerebbe una curva calcolata su un insieme e un delta su un altro.
   */
  const mappe = anni.map((a) => perAnno.get(a)!);
  const comuni =
    anni.length >= 2 ? [...mappe[0]!.keys()].filter((id) => mappe.every((m) => m.has(id))) : [];

  const serie: PuntoTrend[] =
    comuni.length > 0
      ? anni.map((anno) => ({
          anno,
          media: Math.round(media(comuni.map((id) => perAnno.get(anno)!.get(id)!))),
          clienti: comuni.length,
        }))
      : [];

  const deltaOmogeneo: Panoramica["deltaOmogeneo"] =
    serie.length >= 2
      ? {
          valore: serie[serie.length - 1]!.media - serie[serie.length - 2]!.media,
          annoPrec: serie[serie.length - 2]!.anno,
          clienti: comuni.length,
        }
      : null;

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

  const distribuzione: Record<FasciaSalute, number> = {
    eccellente: 0,
    sana: 0,
    migliorabile: 0,
    fragile: 0,
    ristrutturare: 0,
  };
  for (const r of analizzati) distribuzione[fasciaDi(r.score!)]++;

  return {
    distribuzione,
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
    // Senza due annualità confrontabili non c'è trend: meglio niente che una linea finta
    trend: serie,
    deltaOmogeneo,
  };
}
