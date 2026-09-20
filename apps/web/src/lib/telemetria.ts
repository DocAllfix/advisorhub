/**
 * Telemetria degli errori. Senza DSN il client Sentry resta inattivo: la
 * piattaforma funziona identica, e basta impostare NEXT_PUBLIC_SENTRY_DSN
 * per iniziare a raccogliere. Nessun dato di bilancio viene inviato.
 *
 * Il pacchetto si carica SOLO se il DSN c'e'. Prima era importato in testa al
 * file: il browser scaricava e analizzava circa 220 KB di Sentry su ogni
 * pagina anche quando la telemetria, senza DSN, non faceva nulla. Il DSN e'
 * una variabile NEXT_PUBLIC_, fissata al build: senza, il chunk esiste ma non
 * viene mai richiesto.
 *
 * Il prezzo, quando il DSN c'e', e' che l'inizializzazione avviene un istante
 * dopo invece che in modo sincrono. Init e segnalazioni passano dalla stessa
 * promessa, quindi l'ordine e' garantito: nessun errore arriva prima di init.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const telemetriaAttiva = Boolean(dsn);

let sentry: Promise<typeof import("@sentry/nextjs")> | null = null;
const caricaSentry = () => (sentry ??= import("@sentry/nextjs"));

export function inizializzaTelemetria() {
  if (!dsn) return;
  void caricaSentry().then((Sentry) =>
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      // Nessuna registrazione di sessione: l'app mostra dati contabili di clienti
      sendDefaultPii: false,
    }),
  );
}

/** Segnala un errore, se la telemetria è attiva. */
export function segnalaErrore(errore: unknown, contesto?: Record<string, unknown>) {
  if (!dsn) return;
  void caricaSentry().then((Sentry) =>
    Sentry.captureException(errore, contesto ? { extra: contesto } : undefined),
  );
}
