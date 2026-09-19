"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { requireStudio, vietatoInDemo } from "@/lib/auth-helpers";
import { eUuid } from "@/lib/id";
import { db } from "@/lib/db";
import { auditLog, clienti, scadenze } from "@/lib/schema-dominio";

import { scadenzaSchema, type ScadenzaInput } from "./schema";

export type RisultatoScadenza =
  { ok: true; id: string } | { ok: false; errore: string; campi?: Record<string, string> };

function erroreValidazione(issues: { path: PropertyKey[]; message: string }[]): RisultatoScadenza {
  const campi: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !campi[key]) campi[key] = i.message;
  }
  return { ok: false, errore: "Controlla i campi evidenziati.", campi };
}

/** Il cliente, se indicato, deve appartenere allo studio corrente. */
async function clienteValido(clienteId: string | undefined, organizationId: string) {
  if (!clienteId) return null;
  const [c] = await db
    .select({ id: clienti.id })
    .from(clienti)
    .where(and(eq(clienti.id, clienteId), eq(clienti.organizationId, organizationId)))
    .limit(1);
  return c?.id ?? undefined;
}

function normalizza(input: ScadenzaInput) {
  return {
    titolo: input.titolo,
    data: input.data,
    categoria: input.categoria,
    clienteId: input.clienteId && input.clienteId !== "" ? input.clienteId : undefined,
    note: input.note?.trim() ? input.note.trim() : null,
  };
}

export async function creaScadenza(input: ScadenzaInput): Promise<RisultatoScadenza> {
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const parsed = scadenzaSchema.safeParse(input);
  if (!parsed.success) return erroreValidazione(parsed.error.issues);
  const dati = normalizza(parsed.data);

  const clienteId = await clienteValido(dati.clienteId, organizationId);
  if (dati.clienteId && clienteId === undefined) {
    return { ok: false, errore: "Cliente non valido." };
  }

  const [creata] = await db
    .insert(scadenze)
    .values({
      organizationId,
      clienteId: clienteId ?? null,
      titolo: dati.titolo,
      data: dati.data,
      categoria: dati.categoria,
      note: dati.note,
    })
    .returning({ id: scadenze.id });

  await db.insert(auditLog).values({
    organizationId,
    userId,
    azione: "scadenza.creata",
    entita: "scadenza",
    entitaId: creata!.id,
  });

  revalidatePath("/app/scadenze");
  revalidatePath("/app");
  return { ok: true, id: creata!.id };
}

export async function modificaScadenza(
  id: string,
  input: ScadenzaInput,
): Promise<RisultatoScadenza> {
  if (!eUuid(id)) return { ok: false, errore: "Scadenza non trovata." };
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const parsed = scadenzaSchema.safeParse(input);
  if (!parsed.success) return erroreValidazione(parsed.error.issues);
  const dati = normalizza(parsed.data);

  const clienteId = await clienteValido(dati.clienteId, organizationId);
  if (dati.clienteId && clienteId === undefined) {
    return { ok: false, errore: "Cliente non valido." };
  }

  const modificate = await db
    .update(scadenze)
    .set({
      titolo: dati.titolo,
      data: dati.data,
      categoria: dati.categoria,
      clienteId: clienteId ?? null,
      note: dati.note,
    })
    .where(and(eq(scadenze.id, id), eq(scadenze.organizationId, organizationId)))
    .returning({ id: scadenze.id });

  if (modificate.length === 0) return { ok: false, errore: "Scadenza non trovata." };

  await db.insert(auditLog).values({
    organizationId,
    userId,
    azione: "scadenza.modificata",
    entita: "scadenza",
    entitaId: id,
  });

  revalidatePath("/app/scadenze");
  revalidatePath("/app");
  return { ok: true, id };
}

export async function completaScadenza(
  id: string,
  completata: boolean,
): Promise<RisultatoScadenza> {
  if (!eUuid(id)) return { ok: false, errore: "Scadenza non trovata." };
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { organizationId } = studio;
  const aggiornate = await db
    .update(scadenze)
    .set({ completataAt: completata ? new Date() : null })
    .where(and(eq(scadenze.id, id), eq(scadenze.organizationId, organizationId)))
    .returning({ id: scadenze.id });
  if (aggiornate.length === 0) return { ok: false, errore: "Scadenza non trovata." };

  revalidatePath("/app/scadenze");
  revalidatePath("/app");
  return { ok: true, id };
}

export async function eliminaScadenza(id: string): Promise<RisultatoScadenza> {
  if (!eUuid(id)) return { ok: false, errore: "Scadenza non trovata." };
  const studio = await requireStudio();
  const bloccato = vietatoInDemo(studio);
  if (bloccato) return bloccato;
  const { userId, organizationId } = studio;
  const eliminate = await db
    .delete(scadenze)
    .where(and(eq(scadenze.id, id), eq(scadenze.organizationId, organizationId)))
    .returning({ id: scadenze.id });
  if (eliminate.length === 0) return { ok: false, errore: "Scadenza non trovata." };

  await db.insert(auditLog).values({
    organizationId,
    userId,
    azione: "scadenza.eliminata",
    entita: "scadenza",
    entitaId: id,
  });

  revalidatePath("/app/scadenze");
  revalidatePath("/app");
  return { ok: true, id };
}
