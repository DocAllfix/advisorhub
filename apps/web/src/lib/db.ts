import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "./auth-schema";
import * as dominioSchema from "./schema-dominio";

/**
 * Connessione runtime. In self-hosting punta al Postgres sulla rete Docker
 * interna; le migration usano DIRECT_URL via drizzle-kit.
 *
 * La stringa si legge qui da process.env e non da env(): così il `next build`
 * non ha bisogno di un database configurato. La validazione completa avviene
 * all'avvio del server, in instrumentation.ts.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Senza timeout una rete che non risponde tiene appesa la richiesta finché
  // il browser non rinuncia: meglio un errore in 5 secondi.
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  statement_timeout: 15_000,
});

/**
 * Un errore su una connessione IDLE viene emesso sul pool, non sulla query: se
 * nessuno lo ascolta, Node considera l'evento 'error' non gestito e ABBATTE il
 * processo. Con un riavvio del database, l'intera app cadrebbe con lui.
 */
pool.on("error", (errore) => {
  console.error("[db] errore su connessione inattiva del pool:", errore.message);
});

export const schema = { ...authSchema, ...dominioSchema };

export const db = drizzle(pool, { schema });

/**
 * Chi esegue una scrittura: il database oppure una transazione aperta. Le
 * funzioni che partecipano a una mutazione composita accettano questo tipo,
 * cosi' possono essere chiamate dentro o fuori una transazione.
 */
export type Esecutore = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Sonda per /api/health: true se il database risponde. */
export async function databaseRaggiungibile(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
