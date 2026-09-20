"use server";

import {
  analizza,
  INTESTAZIONI_EXPORT,
  rigaExport,
  serializzaCsv,
  type DatiBilancio,
  type DatiPrevisionali6M,
} from "@advisorhub/engine";
import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";

import { requireStudio, vietatoInDemo } from "@/lib/auth-helpers";
import { eUuid } from "@/lib/id";
import { db, type Esecutore } from "@/lib/db";
import { analisi, auditLog, clienti, esercizi } from "@/lib/schema-dominio";

import { esercizioSchema, separaEsercizio, type EsercizioInput } from "./schema";

export type RisultatoEsercizio =
  { ok: true; id: string } | { ok: false; errore: string; campi?: Record<string, string> };

function erroreValidazione(issues: { path: PropertyKey[]; message: string }[]): RisultatoEsercizio {
  const campi: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !campi[key]) campi[key] = i.message;
  }
  return { ok: false, errore: "Controlla i campi evidenziati.", campi };
}

/**
 * Violazione di unicità (cliente, anno). Drizzle incapsula l'errore di pg,
 * quindi il codice va cercato anche in `cause`.
 */
function isAnnoDuplicato(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const err = e as { code?: string; cause?: { code?: string } };
  return err.code === "23505" || err.cause?.code === "23505";
}

async function verificaCliente(clienteId: string, organizationId: string) {
  const [c] = await db
    .select({ id: clienti.id, ragioneSociale: clienti.ragioneSociale })
    .from(clienti)
    .where(and(eq(clienti.id, clienteId), eq(clienti.organizationId, organizationId)))
    .limit(1);
  return c ?? null;
}

/**
 * Calcola l'analisi col motore e la salva come snapshot versionato.
 *
 * Prende l'esecutore perche' va scritta nella stessa transazione dell'esercizio:
 * un esercizio senza analisi mostrerebbe punteggio nullo in portafoglio.
 */
async function salvaAnalisi(
  esecutore: Esecutore,
  esercizioId: string,
  clienteId: string,
  dati: ReturnType<typeof separaEsercizio>["dati"],
  previsionale: ReturnType<typeof separaEsercizio>["previsionale"],
) {
  const risultato = analizza(dati, previsionale ?? undefined);
  const [{ v }] = await esecutore
    .select({ v: sql<number>`coalesce(max(${analisi.versione}), 0) + 1` })
    .from(analisi)
    .where(eq(analisi.esercizioId, esercizioId));
  await esecutore.insert(analisi).values({
    clienteId,
    esercizioId,
    versione: v,
    input: { dati, previsionale },
    output: risultato,
    score: risultato.score,
  });
  return risultato;
}

export async function creaEsercizio(
  clienteId: string,
  input: EsercizioInput,
): Promise<RisultatoEsercizio> {
  if (!eUuid(clienteId)) return { ok: false, errore: "Cliente non trovato." };
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const cliente = await verificaCliente(clienteId, organizationId);
  if (!cliente) return { ok: false, errore: "Cliente non trovato." };

  const parsed = esercizioSchema.safeParse(input);
  if (!parsed.success) return erroreValidazione(parsed.error.issues);
  const { dati, previsionale } = separaEsercizio(parsed.data);

  // Esercizio, analisi e traccia di audit sono un fatto solo: o si salvano
  // tutti e tre, o nessuno. Senza transazione, un errore a meta' lascerebbe un
  // esercizio senza analisi (punteggio nullo) o una modifica senza traccia.
  let esercizioId: string;
  try {
    esercizioId = await db.transaction(async (tx) => {
      const [creato] = await tx
        .insert(esercizi)
        .values({ clienteId, anno: parsed.data.anno, ...dati, ...(previsionale ?? {}) })
        .returning({ id: esercizi.id });
      const id = creato!.id;
      await salvaAnalisi(tx, id, clienteId, dati, previsionale);
      await tx.insert(auditLog).values({
        organizationId,
        userId,
        azione: "esercizio.creato",
        entita: "esercizio",
        entitaId: id,
        dettagli: { clienteId, anno: parsed.data.anno },
      });
      return id;
    });
  } catch (e) {
    if (isAnnoDuplicato(e)) {
      return {
        ok: false,
        errore: `Esiste già un esercizio per l'anno ${parsed.data.anno}.`,
        campi: { anno: "Anno già presente per questo cliente" },
      };
    }
    throw e;
  }

  revalidatePath(`/app/clienti/${clienteId}`);
  return { ok: true, id: esercizioId };
}

export async function modificaEsercizio(
  esercizioId: string,
  input: EsercizioInput,
): Promise<RisultatoEsercizio> {
  if (!eUuid(esercizioId)) return { ok: false, errore: "Esercizio non trovato." };
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const parsed = esercizioSchema.safeParse(input);
  if (!parsed.success) return erroreValidazione(parsed.error.issues);
  const { dati, previsionale } = separaEsercizio(parsed.data);

  // Solo esercizi di clienti dello studio corrente
  const [esistente] = await db
    .select({ id: esercizi.id, clienteId: esercizi.clienteId })
    .from(esercizi)
    .innerJoin(clienti, eq(clienti.id, esercizi.clienteId))
    .where(and(eq(esercizi.id, esercizioId), eq(clienti.organizationId, organizationId)))
    .limit(1);
  if (!esistente) return { ok: false, errore: "Esercizio non trovato." };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(esercizi)
        .set({
          anno: parsed.data.anno,
          ...dati,
          liquiditaIniziale: previsionale?.liquiditaIniziale ?? null,
          entrate6m: previsionale?.entrate6m ?? null,
          uscite6m: previsionale?.uscite6m ?? null,
          debito6m: previsionale?.debito6m ?? null,
        })
        .where(eq(esercizi.id, esercizioId));
      await salvaAnalisi(tx, esercizioId, esistente.clienteId, dati, previsionale);
      await tx.insert(auditLog).values({
        organizationId,
        userId,
        azione: "esercizio.modificato",
        entita: "esercizio",
        entitaId: esercizioId,
      });
    });
  } catch (e) {
    if (isAnnoDuplicato(e)) {
      return {
        ok: false,
        errore: `Esiste già un esercizio per l'anno ${parsed.data.anno}.`,
        campi: { anno: "Anno già presente per questo cliente" },
      };
    }
    throw e;
  }

  revalidatePath(`/app/clienti/${esistente.clienteId}`);
  return { ok: true, id: esercizioId };
}

export async function eliminaEsercizio(esercizioId: string): Promise<RisultatoEsercizio> {
  if (!eUuid(esercizioId)) return { ok: false, errore: "Esercizio non trovato." };
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const [esistente] = await db
    .select({ id: esercizi.id, clienteId: esercizi.clienteId })
    .from(esercizi)
    .innerJoin(clienti, eq(clienti.id, esercizi.clienteId))
    .where(and(eq(esercizi.id, esercizioId), eq(clienti.organizationId, organizationId)))
    .limit(1);
  if (!esistente) return { ok: false, errore: "Esercizio non trovato." };

  // Le analisi di un esercizio rimosso non hanno più significato: senza questa
  // pulizia resterebbero orfane e il cliente mostrerebbe ancora un punteggio.
  await db.transaction(async (tx) => {
    await tx.delete(analisi).where(eq(analisi.esercizioId, esercizioId));
    await tx.delete(esercizi).where(eq(esercizi.id, esercizioId));
    await tx.insert(auditLog).values({
      organizationId,
      userId,
      azione: "esercizio.eliminato",
      entita: "esercizio",
      entitaId: esercizioId,
    });
  });

  revalidatePath(`/app/clienti/${esistente.clienteId}`);
  return { ok: true, id: esistente.clienteId };
}

/** Esporta tutti gli esercizi di un cliente in CSV (26 colonne, formato v3c2). */
export async function esportaEserciziCsv(
  clienteId: string,
): Promise<{ ok: true; csv: string; nomeFile: string } | { ok: false; errore: string }> {
  if (!eUuid(clienteId)) return { ok: false, errore: "Cliente non trovato." };
  const { organizationId } = await requireStudio();
  const cliente = await verificaCliente(clienteId, organizationId);
  if (!cliente) return { ok: false, errore: "Cliente non trovato." };

  const righe = await db
    .select()
    .from(esercizi)
    .where(eq(esercizi.clienteId, clienteId))
    .orderBy(desc(esercizi.anno));

  const output: string[][] = [[...INTESTAZIONI_EXPORT]];
  for (const e of righe) {
    const dati: DatiBilancio = {
      valProd: e.valProd,
      fatturato: e.fatturato,
      ro: e.ro,
      capInvest: e.capInvest,
      patrNetto: e.patrNetto,
      utileNetto: e.utileNetto,
      ebitda: e.ebitda,
      pfn: e.pfn,
      servizioDebito: e.servizioDebito,
      flussoCassa: e.flussoCassa,
    };
    const previsionale: DatiPrevisionali6M | null =
      e.liquiditaIniziale !== null &&
      e.entrate6m !== null &&
      e.uscite6m !== null &&
      e.debito6m !== null
        ? {
            liquiditaIniziale: e.liquiditaIniziale,
            entrate6m: e.entrate6m,
            uscite6m: e.uscite6m,
            debito6m: e.debito6m,
          }
        : null;
    const analisiRis = analizza(dati, previsionale ?? undefined);
    output.push(rigaExport(cliente.ragioneSociale, dati, previsionale, analisiRis, String(e.anno)));
  }

  const slug = cliente.ragioneSociale.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40) || "cliente";
  return {
    ok: true,
    csv: serializzaCsv(output),
    nomeFile: `esercizi_${slug}.csv`,
  };
}
