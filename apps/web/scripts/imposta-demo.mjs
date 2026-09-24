/**
 * Marca (o smarca) uno studio come dimostrativo.
 *
 *   node scripts/imposta-demo.mjs demo@finbeacon.it        # attiva la demo
 *   node scripts/imposta-demo.mjs demo@finbeacon.it --off  # la disattiva
 *
 * Il flag vive in organization.metadata (JSON gestito da Better Auth), quindi
 * non richiede migrazioni. requireStudio lo legge e vietatoInDemo blocca le
 * scritture: qui si cambia solo il dato.
 */
import "dotenv/config";
import { Client } from "pg";

const email = process.argv[2];
const spegni = process.argv.includes("--off");

if (!email) {
  console.error("Uso: node scripts/imposta-demo.mjs <email-utente> [--off]");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

try {
  const { rows } = await client.query(
    `select o.id, o.name, o.metadata
       from "user" u
       join member m on m.user_id = u.id
       join organization o on o.id = m.organization_id
      where u.email = $1`,
    [email],
  );

  if (rows.length === 0) {
    console.error(`Nessuno studio trovato per ${email}.`);
    process.exit(1);
  }

  for (const studio of rows) {
    let meta = {};
    try {
      meta = studio.metadata ? JSON.parse(studio.metadata) : {};
    } catch {
      meta = {};
    }

    if (spegni) delete meta.demo;
    else meta.demo = true;

    const nuovo = Object.keys(meta).length > 0 ? JSON.stringify(meta) : null;
    await client.query("update organization set metadata = $1 where id = $2", [nuovo, studio.id]);
    console.log(`${spegni ? "Demo disattivata" : "Demo attivata"} su "${studio.name}".`);
  }
} finally {
  await client.end();
}
