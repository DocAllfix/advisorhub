"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { requireStudio, vietatoInDemo } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { auditLog, clienti } from "@/lib/schema-dominio";

import { clienteSchema, normalizzaCliente, type ClienteInput } from "./schema";

export type RisultatoAction =
  { ok: true; id: string } | { ok: false; errore: string; campi?: Record<string, string> };

function erroreValidazione(parsed: {
  error: { issues: { path: PropertyKey[]; message: string }[] };
}): RisultatoAction {
  const campi: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !campi[key]) campi[key] = issue.message;
  }
  return { ok: false, errore: "Controlla i campi evidenziati.", campi };
}

/** Crea un cliente nello studio corrente. */
export async function creaCliente(input: ClienteInput): Promise<RisultatoAction> {
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return erroreValidazione(parsed);

  const [creato] = await db
    .insert(clienti)
    .values({ organizationId, ...normalizzaCliente(parsed.data) })
    .returning({ id: clienti.id });

  await db.insert(auditLog).values({
    organizationId,
    userId,
    azione: "cliente.creato",
    entita: "cliente",
    entitaId: creato!.id,
    dettagli: { ragioneSociale: parsed.data.ragioneSociale },
  });

  revalidatePath("/app/clienti");
  return { ok: true, id: creato!.id };
}

/** Modifica un cliente, solo se appartiene allo studio corrente. */
export async function modificaCliente(id: string, input: ClienteInput): Promise<RisultatoAction> {
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return erroreValidazione(parsed);

  const modificati = await db
    .update(clienti)
    .set(normalizzaCliente(parsed.data))
    .where(and(eq(clienti.id, id), eq(clienti.organizationId, organizationId)))
    .returning({ id: clienti.id });

  if (modificati.length === 0) return { ok: false, errore: "Cliente non trovato." };

  await db.insert(auditLog).values({
    organizationId,
    userId,
    azione: "cliente.modificato",
    entita: "cliente",
    entitaId: id,
  });

  revalidatePath("/app/clienti");
  revalidatePath(`/app/clienti/${id}`);
  return { ok: true, id };
}

/** Soft-delete (archivia) un cliente dello studio corrente. */
export async function archiviaCliente(id: string): Promise<RisultatoAction> {
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const archiviati = await db
    .update(clienti)
    .set({ archiviatoAt: new Date() })
    .where(and(eq(clienti.id, id), eq(clienti.organizationId, organizationId)))
    .returning({ id: clienti.id });

  if (archiviati.length === 0) return { ok: false, errore: "Cliente non trovato." };

  await db.insert(auditLog).values({
    organizationId,
    userId,
    azione: "cliente.archiviato",
    entita: "cliente",
    entitaId: id,
  });

  revalidatePath("/app/clienti");
  return { ok: true, id };
}

/** Ripristina un cliente archiviato dello studio corrente. */
export async function ripristinaCliente(id: string): Promise<RisultatoAction> {
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const ripristinati = await db
    .update(clienti)
    .set({ archiviatoAt: null })
    .where(and(eq(clienti.id, id), eq(clienti.organizationId, organizationId)))
    .returning({ id: clienti.id });

  if (ripristinati.length === 0) return { ok: false, errore: "Cliente non trovato." };

  await db.insert(auditLog).values({
    organizationId,
    userId,
    azione: "cliente.ripristinato",
    entita: "cliente",
    entitaId: id,
  });

  revalidatePath("/app/clienti");
  return { ok: true, id };
}
