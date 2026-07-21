import * as Sentry from "@sentry/nextjs";

/**
 * Telemetria degli errori. Senza DSN il client Sentry resta inattivo: la
 * piattaforma funziona identica, e basta impostare NEXT_PUBLIC_SENTRY_DSN
 * per iniziare a raccogliere. Nessun dato di bilancio viene inviato.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const telemetriaAttiva = Boolean(dsn);

export function inizializzaTelemetria() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Nessuna registrazione di sessione: l'app mostra dati contabili di clienti
    sendDefaultPii: false,
  });
}

/** Segnala un errore, se la telemetria è attiva. */
export function segnalaErrore(errore: unknown, contesto?: Record<string, unknown>) {
  if (!dsn) return;
  Sentry.captureException(errore, contesto ? { extra: contesto } : undefined);
}
