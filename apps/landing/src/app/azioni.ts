"use server";

import nodemailer from "nodemailer";
import { z } from "zod";

import {
  FASCE_CLIENTI,
  MOTIVI,
  type CampoModulo,
  type EsitoRichiesta,
  type ValoriModulo,
  type Motivo,
} from "@/lib/modulo";

/**
 * La richiesta di demo. Server Action: il modulo funziona anche senza
 * JavaScript, e la pagina resta statica (l'azione è una funzione a parte).
 *
 * Nessun database: la richiesta diventa una mail alla casella commerciale. Se
 * l'invio fallisce lo si DICE all'utente, con un indirizzo di ripiego, invece
 * di far finta che sia arrivata. Nei log finisce solo l'esito, mai i dati
 * personali.
 */

/** Sotto questo tempo di compilazione il modulo l'ha riempito una macchina. */
const TEMPO_MINIMO_MS = 3_000;

const richiesta = z.object({
  nome: z.string().trim().min(2, "Scrivi nome e cognome.").max(120, "Al massimo 120 caratteri."),
  studio: z
    .string()
    .trim()
    .min(2, "Scrivi il nome dello studio.")
    .max(160, "Al massimo 160 caratteri."),
  email: z.string().trim().max(200).pipe(z.email("Questo indirizzo email non sembra valido.")),
  telefono: z
    .string()
    .trim()
    .max(40, "Al massimo 40 caratteri.")
    .regex(/^[+()\d\s./-]*$/, "Usa solo cifre, spazi e il segno +.")
    .optional()
    .or(z.literal("")),
  clienti: z.enum(FASCE_CLIENTI).optional().or(z.literal("")),
  motivo: z.enum(Object.keys(MOTIVI) as [Motivo, ...Motivo[]]),
  messaggio: z
    .string()
    .trim()
    .max(2_000, "Al massimo 2000 caratteri.")
    .optional()
    .or(z.literal("")),
});

function testo(dati: FormData, campo: string): string {
  const v = dati.get(campo);
  return typeof v === "string" ? v : "";
}

export async function inviaRichiesta(
  _precedente: EsitoRichiesta | null,
  dati: FormData,
): Promise<EsitoRichiesta> {
  // Trappola: un campo che un essere umano non vede. Si risponde come se
  // fosse andata bene, per non insegnare al programma che è stato scoperto.
  if (testo(dati, "sito") !== "") return { stato: "inviata" };

  const avvio = Number(testo(dati, "t"));
  if (Number.isFinite(avvio) && avvio > 0 && Date.now() - avvio < TEMPO_MINIMO_MS) {
    return { stato: "inviata" };
  }

  const valori: ValoriModulo = {
    nome: testo(dati, "nome"),
    studio: testo(dati, "studio"),
    email: testo(dati, "email"),
    telefono: testo(dati, "telefono"),
    clienti: testo(dati, "clienti"),
    motivo: testo(dati, "motivo") || "demo",
    messaggio: testo(dati, "messaggio"),
  };
  const verifica = richiesta.safeParse(valori);
  if (!verifica.success) {
    const errori: Partial<Record<CampoModulo, string>> = {};
    for (const problema of verifica.error.issues) {
      const campo = problema.path[0] as CampoModulo;
      errori[campo] ??= problema.message;
    }
    return { stato: "non-valida", errori, valori };
  }

  // Nelle anteprime e in sviluppo senza configurazione nessuna mail parte.
  if (
    process.env.DEMO_ATTIVO !== "true" ||
    !process.env.SMTP_HOST ||
    !process.env.DEMO_DESTINATARIO
  ) {
    return { stato: "inattivo" };
  }

  const r = verifica.data;
  const righe = [
    `Nome: ${r.nome}`,
    `Studio: ${r.studio}`,
    `Email: ${r.email}`,
    r.telefono ? `Telefono: ${r.telefono}` : null,
    r.clienti ? `Clienti seguiti: ${r.clienti}` : null,
    `Motivo: ${MOTIVI[r.motivo]}`,
    "",
    r.messaggio || "(nessun messaggio)",
    "",
    "Inviata dal modulo di finbeacon.eu.",
  ].filter((riga) => riga !== null);

  try {
    await trasporto().sendMail({
      from: process.env.SMTP_FROM ?? "no-reply@finbeacon.it",
      to: process.env.DEMO_DESTINATARIO,
      replyTo: r.email,
      subject: `Richiesta FinBeacon: ${MOTIVI[r.motivo].toLowerCase()} · ${r.studio}`,
      text: righe.join("\n"),
    });
    console.info("[richiesta-demo] inviata");
    return { stato: "inviata" };
  } catch (errore) {
    // Il messaggio d'errore di SMTP non contiene i dati del modulo.
    console.error("[richiesta-demo] invio fallito:", (errore as Error).message);
    return { stato: "errore", valori };
  }
}

function trasporto() {
  const host = process.env.SMTP_HOST!;
  const porta = Number(process.env.SMTP_PORT ?? 587);
  const utente = process.env.SMTP_USER;
  // TLS obbligatorio verso un relay remoto, mai verso un sink locale come
  // Mailpit, che STARTTLS non lo offre (GUASTI G-23): il discrimine è l'host,
  // non NODE_ENV.
  const hostLocale = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  return nodemailer.createTransport({
    host,
    port: porta,
    secure: porta === 465,
    requireTLS: !hostLocale && porta !== 465,
    auth: utente ? { user: utente, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}
