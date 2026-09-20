import { randomUUID } from "node:crypto";

import { analizza, type DatiBilancio, type DatiPrevisionali6M } from "@advisorhub/engine";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as authSchema from "./auth-schema";
import * as dominio from "./schema-dominio";

/**
 * Seed idempotente: (ri)crea lo studio demo con i due clienti dell'archivio.
 * Usa la connessione diretta (session pooler) per evitare limiti del
 * transaction pooler sugli statement. Rilancia pure quante volte vuoi:
 * elimina e ricrea lo studio demo (cascata su clienti/esercizi/analisi).
 */
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const db = drizzle(pool, { schema: { ...authSchema, ...dominio } });

const STUDIO_SLUG = "studio-demo";

/** Dati dei due clienti dell'archivio (CSV di export del prototipo). */
const marioRossi: DatiBilancio = {
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
// Grandezze previsionali 6M (default del prototipo v3c2) per esercitare il DSCR prospettico
const marioRossiPrev: DatiPrevisionali6M = {
  liquiditaIniziale: 150_000,
  entrate6m: 1_200_000,
  uscite6m: 950_000,
  debito6m: 180_000,
};

const lucaBianchi: DatiBilancio = {
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

async function seed() {
  // 1. Studio demo pulito (cascata su tutto il dominio collegato)
  await db.delete(authSchema.organization).where(eq(authSchema.organization.slug, STUDIO_SLUG));

  const orgId = randomUUID();
  await db.insert(authSchema.organization).values({
    id: orgId,
    name: "Studio Demo",
    slug: STUDIO_SLUG,
    createdAt: new Date(),
  });

  // 2. Titolare demo (solo FK/membership: il login demo si configura in Fase 10)
  const userId = randomUUID();
  await db
    .insert(authSchema.user)
    .values({
      id: userId,
      name: "Titolare Demo",
      email: "demo@advisorhub.test",
      emailVerified: true,
    })
    .onConflictDoNothing({ target: authSchema.user.email });
  const [titolare] = await db
    .select({ id: authSchema.user.id })
    .from(authSchema.user)
    .where(eq(authSchema.user.email, "demo@advisorhub.test"))
    .limit(1);

  await db.insert(authSchema.member).values({
    id: randomUUID(),
    organizationId: orgId,
    userId: titolare!.id,
    role: "owner",
    createdAt: new Date(),
  });

  // 3-4-5. Clienti + esercizi + analisi calcolata dal motore
  const clientiSeed = [
    {
      ragioneSociale: "Mario Rossi Spa",
      dimensione: "media",
      dati: marioRossi,
      prev: marioRossiPrev,
    },
    {
      ragioneSociale: "Luca Bianchi Spa",
      dimensione: "media",
      dati: lucaBianchi,
      prev: undefined,
    },
  ] as const;

  for (const c of clientiSeed) {
    const [cliente] = await db
      .insert(dominio.clienti)
      .values({
        organizationId: orgId,
        ragioneSociale: c.ragioneSociale,
        dimensione: c.dimensione,
      })
      .returning({ id: dominio.clienti.id });

    const [esercizio] = await db
      .insert(dominio.esercizi)
      .values({
        clienteId: cliente!.id,
        anno: 2026,
        ...c.dati,
        ...(c.prev ?? {}),
      })
      .returning({ id: dominio.esercizi.id });

    const analisi = analizza(c.dati, c.prev);
    await db.insert(dominio.analisi).values({
      clienteId: cliente!.id,
      esercizioId: esercizio!.id,
      versione: 1,
      input: { dati: c.dati, previsionale: c.prev ?? null },
      output: analisi,
      score: analisi.score,
    });

    console.log(
      `  ${c.ragioneSociale}: esercizio 2026, score ${analisi.score} (${analisi.sintesi.titolo})`,
    );
  }

  await db.insert(dominio.auditLog).values({
    organizationId: orgId,
    userId: titolare!.id,
    azione: "seed.eseguito",
    entita: "organization",
    entitaId: orgId,
    dettagli: { clienti: clientiSeed.length },
  });

  console.log("Seed completato: studio demo con 2 clienti.");
  await pool.end();
}

seed().catch(async (e) => {
  console.error("Seed fallito:", e.message);
  await pool.end();
  process.exit(1);
});
