import { inizializzaTelemetria } from "@/lib/telemetria";

/** Avvio della telemetria lato server (no-op senza DSN). */
export function register() {
  inizializzaTelemetria();
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
