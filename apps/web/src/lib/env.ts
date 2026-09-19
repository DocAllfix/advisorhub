import { z } from "zod";

/**
 * Variabili d'ambiente del server, validate all'avvio (instrumentation.ts).
 *
 * Questo file è l'UNICA fonte dei nomi: `.env.example`, il compose di produzione
 * e la documentazione si allineano a `schema`. Senza un punto solo, un compose
 * che passa SMTP_USERNAME mentre il codice legge SMTP_USER non darebbe errore —
 * zod scarta le chiavi sconosciute in silenzio e restituisce il default.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database: runtime sul pooler, migration e script sulla connessione diretta.
  DATABASE_URL: z.string().min(1, "DATABASE_URL mancante"),
  DIRECT_URL: z.string().min(1).optional(),

  // Better Auth le legge internamente: qui servono solo per fallire all'avvio
  // invece che al primo login.
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET: almeno 32 caratteri"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL deve essere un URL assoluto"),

  // Posta: assenti in sviluppo (la mail resta in coda e non parte).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Identifica la release nella telemetria e in /api/health.
  GIT_SHA: z.string().default("sviluppo"),
});

export type Ambiente = z.infer<typeof schema>;

let memo: Ambiente | null = null;

/** Ambiente validato. Lancia con un messaggio leggibile se qualcosa manca. */
export function env(): Ambiente {
  if (memo) return memo;
  const esito = schema.safeParse(process.env);
  if (!esito.success) {
    const dettagli = esito.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Configurazione non valida:\n${dettagli}`);
  }
  memo = esito.data;
  return memo;
}

/** localhost e' l'unico caso in cui http non espone la sessione a nessuno. */
export function eLocale(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Su un dominio pubblico BETTER_AUTH_URL deve essere https, altrimenti Better
 * Auth emette il cookie di sessione senza flag Secure e la sessione viaggia in
 * chiaro. L'eccezione e' localhost: serve a collaudare la build di produzione
 * in locale, dove il cookie non attraversa alcuna rete.
 */
export function verificaAmbiente() {
  const e = env();
  const insicuro =
    e.NODE_ENV === "production" &&
    !e.BETTER_AUTH_URL.startsWith("https://") &&
    !eLocale(e.BETTER_AUTH_URL);
  if (insicuro) {
    throw new Error(
      `BETTER_AUTH_URL deve usare https su un dominio pubblico (ora: ${e.BETTER_AUTH_URL}): ` +
        "il cookie di sessione non avrebbe il flag Secure.",
    );
  }
  if (e.NODE_ENV === "production" && !e.SMTP_HOST && !eLocale(e.BETTER_AUTH_URL)) {
    // Non blocca l'avvio: la posta resta in coda e la sentinella se ne accorge.
    console.warn(
      "[avvio] SMTP_HOST non impostato: le email restano in coda e il recupero password non arriva.",
    );
  }
}
