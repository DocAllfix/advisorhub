import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Avvia il worker della posta per la durata dei test, e lo spegne alla fine.
 *
 * Gira il BUNDLE (`worker.js` prodotto da esbuild), non il sorgente: è lo stesso
 * artefatto che va nel container, e ha già dimostrato di funzionare senza
 * `node_modules` — che nell'immagine standalone non contiene `drizzle-orm`
 * (GUASTI G-13).
 *
 * L'intervallo scende a 2 secondi: i test non possono aspettare mezzo minuto.
 */
const PID_FILE = path.join(process.cwd(), ".e2e-posta.pid");
const BUNDLE = path.join(process.cwd(), "worker.js");

export async function avvia() {
  if (!fs.existsSync(BUNDLE)) {
    throw new Error(
      `worker.js non trovato in ${BUNDLE}. Esegui prima: pnpm --filter web build:worker`,
    );
  }
  const db =
    process.env.E2E_DATABASE_URL ?? "postgresql://advisorhub:sviluppo@127.0.0.1:5433/advisorhub";

  const figlio = spawn(process.execPath, [BUNDLE], {
    env: {
      ...process.env,
      DATABASE_URL: db,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
      SMTP_FROM: "no-reply@advisorhub.test",
      MAIL_INTERVALLO_MS: "2000",
      NODE_ENV: "production",
    },
    stdio: "ignore",
    detached: false,
  });
  fs.writeFileSync(PID_FILE, String(figlio.pid));
  // Un attimo per il primo giro: se il worker morisse subito, i test sulla
  // posta fallirebbero con un messaggio incomprensibile.
  await new Promise((r) => setTimeout(r, 1500));
  if (figlio.exitCode !== null) {
    throw new Error(`Il worker della posta è terminato subito (codice ${figlio.exitCode})`);
  }
}

export async function ferma() {
  if (!fs.existsSync(PID_FILE)) return;
  const pid = Number(fs.readFileSync(PID_FILE, "utf8"));
  try {
    process.kill(pid);
  } catch {
    // già terminato
  }
  fs.rmSync(PID_FILE, { force: true });
}

export default avvia;
