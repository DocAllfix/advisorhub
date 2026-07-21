import "dotenv/config";

import { analizza, type DatiBilancio, type DatiPrevisionali6M } from "@advisorhub/engine";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "./auth-schema";
import * as dominio from "./schema-dominio";

/**
 * Studio demo pronto all'uso: crea l'account via API (così la password è
 * valida davvero) e vi collega i due clienti dell'archivio con i loro esercizi.
 * Richiede l'app in esecuzione su BASE.
 */
const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const EMAIL = "demo@advisorhub.it";
const PASSWORD = "DemoAdvisor2026!";
const STUDIO = "Studio Demo Commercialisti";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const db = drizzle(pool, { schema: { ...authSchema, ...dominio } });

const rossi: DatiBilancio = {
  valProd: 3_000_000,
  fatturato: 2_800_000,
  ro: 350_000,
  capInvest: 2_500_000,
  patrNetto: 800_000,
  utileNetto: 180_000,
  ebitda: 550_000,
  pfn: 1_200_000,
  servizioDebito: 300_000,
  flussoCassa: 420_000,
};
const rossiPrev: DatiPrevisionali6M = {
  liquiditaIniziale: 150_000,
  entrate6m: 1_200_000,
  uscite6m: 950_000,
  debito6m: 180_000,
};
// Anno precedente, per avere un andamento tra esercizi
const rossi2025: DatiBilancio = {
  valProd: 2_600_000,
  fatturato: 2_400_000,
  ro: 210_000,
  capInvest: 2_400_000,
  patrNetto: 700_000,
  utileNetto: 110_000,
  ebitda: 420_000,
  pfn: 1_350_000,
  servizioDebito: 300_000,
  flussoCassa: 330_000,
};

const bianchi: DatiBilancio = {
  valProd: 5_500_000,
  fatturato: 5_500_000,
  ro: 90_000,
  capInvest: 3_550_000,
  patrNetto: 720_000,
  utileNetto: 100_000,
  ebitda: 550_000,
  pfn: 1_200_000,
  servizioDebito: 420_000,
  flussoCassa: 360_000,
};
const bianchiPrev: DatiPrevisionali6M = {
  liquiditaIniziale: 20_000,
  entrate6m: 500_000,
  uscite6m: 450_000,
  debito6m: 180_000,
};

async function main() {
  // 1. Ripulisci un eventuale demo precedente
  await db.delete(authSchema.user).where(eq(authSchema.user.email, EMAIL));

  // 2. Crea account e studio tramite l'API (password valida)
  const reg = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: BASE },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Titolare Demo" }),
  });
  if (!reg.ok) throw new Error(`Registrazione non riuscita: ${reg.status} ${await reg.text()}`);
  const cookie = reg.headers.getSetCookie().join("; ");

  const org = await fetch(`${BASE}/api/auth/organization/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: BASE, cookie },
    body: JSON.stringify({ name: STUDIO, slug: `studio-demo-${Date.now().toString(36)}` }),
  });
  if (!org.ok) throw new Error(`Creazione studio non riuscita: ${org.status} ${await org.text()}`);
  const { id: orgId } = (await org.json()) as { id: string };

  // 3. Clienti, esercizi e analisi
  const daCreare = [
    {
      ragioneSociale: "Mario Rossi Spa",
      codiceAteco: "62.01",
      dimensione: "media",
      esercizi: [
        { anno: 2026, dati: rossi, prev: rossiPrev },
        { anno: 2025, dati: rossi2025, prev: null },
      ],
    },
    {
      ragioneSociale: "Luca Bianchi Spa",
      codiceAteco: "46.90",
      dimensione: "media",
      esercizi: [{ anno: 2026, dati: bianchi, prev: bianchiPrev }],
    },
  ] as const;

  for (const c of daCreare) {
    const [cliente] = await db
      .insert(dominio.clienti)
      .values({
        organizationId: orgId,
        ragioneSociale: c.ragioneSociale,
        codiceAteco: c.codiceAteco,
        dimensione: c.dimensione,
      })
      .returning({ id: dominio.clienti.id });

    for (const es of c.esercizi) {
      const [esercizio] = await db
        .insert(dominio.esercizi)
        .values({ clienteId: cliente!.id, anno: es.anno, ...es.dati, ...(es.prev ?? {}) })
        .returning({ id: dominio.esercizi.id });
      const risultato = analizza(es.dati, es.prev ?? undefined);
      await db.insert(dominio.analisi).values({
        clienteId: cliente!.id,
        esercizioId: esercizio!.id,
        versione: 1,
        input: { dati: es.dati, previsionale: es.prev },
        output: risultato,
        score: risultato.score,
      });
      console.log(
        `  ${c.ragioneSociale} ${es.anno}: score ${risultato.score} (${risultato.sintesi.titolo})`,
      );
    }
  }

  console.log(`\nStudio demo pronto: ${STUDIO}`);
  console.log(`  accesso: ${EMAIL} / ${PASSWORD}`);
  await pool.end();
}

main().catch(async (e) => {
  console.error("Seed demo fallito:", e.message);
  await pool.end();
  process.exit(1);
});
