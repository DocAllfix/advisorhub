import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Applica le migrazioni. Usa il migratore di drizzle-ORM, non la CLI drizzle-kit:
 *
 *  - drizzle-orm e' una dipendenza di RUNTIME, quindi questo script gira anche
 *    nell'immagine di produzione, dove le devDependencies non esistono;
 *  - il bersaglio e la cartella sono espliciti e vengono stampati prima di
 *    scrivere: il nome di un file .env non e' una prova di dove si sta andando.
 */
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("[migra] DIRECT_URL/DATABASE_URL mancante.");
  process.exit(1);
}

const cartella = process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");

/** Host e database, senza mai stampare la password. */
function bersaglio(u: string): string {
  try {
    const p = new URL(u);
    return `${p.hostname}:${p.port || "5432"}${p.pathname}`;
  } catch {
    return "(stringa di connessione non interpretabile)";
  }
}

async function main() {
  console.log(`[migra] bersaglio:  ${bersaglio(url!)}`);
  console.log(`[migra] migrazioni: ${cartella}`);
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: cartella });
    const { rows } = await pool.query(
      "select count(*)::int n from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname='public' and c.relkind='r'",
    );
    console.log(`[migra] fatto: ${rows[0].n} tabelle nello schema public.`);
  } finally {
    await pool.end();
  }
}

main().catch((errore) => {
  console.error("[migra] fallito:", errore instanceof Error ? errore.message : errore);
  process.exit(1);
});
