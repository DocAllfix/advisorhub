import { verificaAmbiente } from "@/lib/env";
import { inizializzaTelemetria } from "@/lib/telemetria";

/**
 * Avvio lato server. La validazione dell'ambiente sta qui, non nei moduli di
 * dominio: un'istanza mal configurata deve morire subito e rumorosamente, non
 * alla prima query di un utente con una schermata bianca.
 */
export function register() {
  // L'edge runtime non vede le variabili del server: si valida solo su Node.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    verificaAmbiente();
  }
  inizializzaTelemetria();
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
