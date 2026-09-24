import { Client } from "pg";

import type { APIRequestContext } from "@playwright/test";

/**
 * Inserimento diretto dei dati di prova nel database.
 *
 * Le server action non sono richiamabili da un client API (parlano il protocollo
 * RSC), e qui interessa verificare il percorso di LETTURA — generazione del
 * report e tenant scoping — non quello di scrittura. Le scritture hanno i loro
 * controlli nelle action stesse.
 */
const URL_DB =
  process.env.E2E_DATABASE_URL ?? "postgresql://finbeacon:sviluppo@127.0.0.1:5433/finbeacon";

export async function conDatabase<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: URL_DB });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

/** Id dello studio attivo per la sessione corrente. */
export async function idStudio(request: APIRequestContext): Promise<string> {
  const r = await request.get("/api/auth/organization/list");
  const elenco = (await r.json()) as { id: string }[];
  if (!elenco?.length) throw new Error("Nessuno studio per questa sessione");
  return elenco[0].id;
}

/**
 * Un cliente con un esercizio. I valori sono quelli di Mario Rossi Spa
 * dell'archivio: danno punteggio 91, lo stesso dei golden test del motore.
 */
export async function creaClienteConEsercizio(
  organizationId: string,
  ragioneSociale: string,
  anno = 2026,
): Promise<string> {
  return conDatabase(async (c) => {
    const cliente = await c.query(
      `insert into clienti (organization_id, ragione_sociale, dimensione)
       values ($1, $2, 'media') returning id`,
      [organizationId, ragioneSociale],
    );
    const clienteId = cliente.rows[0].id as string;
    await c.query(
      `insert into esercizi (cliente_id, anno, val_prod, fatturato, ro, cap_invest,
         patr_netto, utile_netto, ebitda, pfn, servizio_debito, flusso_cassa)
       values ($1, $2, 3000000, 2800000, 320000, 2000000,
         900000, 210000, 430000, 450000, 120000, 380000)`,
      [clienteId, anno],
    );
    return clienteId;
  });
}

/** Marca uno studio come dimostrativo (sola lettura lato server). */
export async function rendiDimostrativo(organizationId: string): Promise<void> {
  await conDatabase(async (c) => {
    await c.query(`update organization set metadata = $2 where id = $1`, [
      organizationId,
      JSON.stringify({ demo: true }),
    ]);
  });
}

/** Righe ancora in coda per un destinatario. */
export async function inCoda(destinatario: string): Promise<number> {
  return conDatabase(async (c) => {
    const r = await c.query(
      `select count(*)::int n from mail_outbox where destinatario = $1 and inviata_at is null`,
      [destinatario],
    );
    return r.rows[0].n as number;
  });
}

/**
 * Aggiunge un esercizio a un cliente che ce l'ha gia'.
 *
 * Serve ai test sui grafici: con UN solo esercizio i mini-grafici non si
 * disegnano affatto (mostrano «Servono almeno due esercizi») e recharts non
 * viene mai chiesto. Un test sul caricamento del grafico fatto su un cliente a
 * un esercizio passerebbe sempre, misurando un'assenza invece di un rinvio
 * (GUASTI G-32).
 *
 * I valori sono un po' piu' bassi dell'esercizio pieno, cosi' le serie hanno
 * una pendenza e non una retta.
 */
export async function aggiungiEsercizio(clienteId: string, anno: number): Promise<void> {
  await conDatabase(async (c) => {
    await c.query(
      `insert into esercizi (cliente_id, anno, val_prod, fatturato, ro, cap_invest,
         patr_netto, utile_netto, ebitda, pfn, servizio_debito, flusso_cassa)
       values ($1, $2, 2600000, 2400000, 240000, 1900000,
         800000, 150000, 350000, 520000, 130000, 300000)`,
      [clienteId, anno],
    );
  });
}
