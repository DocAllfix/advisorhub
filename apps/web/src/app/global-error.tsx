"use client";

import { useEffect } from "react";

import { segnalaErrore } from "@/lib/telemetria";

/**
 * Ultima rete di sicurezza: cattura gli errori del layout radice, dove il
 * boundary di segmento non arriva. Senza questo file, una caduta del database
 * durante requireStudio() — che gira NEL layout — produce una schermata bianca
 * muta, e nessun evento raggiunge la telemetria.
 *
 * Sostituisce l'intero documento, quindi deve dichiarare <html> e <body> e non
 * può contare sui provider dell'app: gli stili sono in linea di proposito.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    segnalaErrore(error, { digest: error.digest, origine: "global-error" });
  }, [error]);

  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "oklch(0.985 0.004 240)",
          color: "oklch(0.22 0.012 250)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            Il servizio non è raggiungibile
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6, opacity: 0.8 }}>
            Si è verificato un errore che ha interrotto il caricamento. Il problema è stato
            segnalato automaticamente. Riprova fra qualche istante.
          </p>
          <button
            onClick={reset}
            style={{
              border: "1px solid oklch(0.22 0.012 250 / 0.2)",
              borderRadius: "0.5rem",
              background: "oklch(0.22 0.012 250)",
              color: "oklch(0.985 0.004 240)",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Riprova
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", opacity: 0.55 }}>
              Riferimento per l&apos;assistenza: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
