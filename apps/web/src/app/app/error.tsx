"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { segnalaErrore } from "@/lib/telemetria";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    segnalaErrore(error, { digest: error.digest });
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      titolo="Qualcosa è andato storto"
      descrizione="Si è verificato un errore nel caricamento di questa sezione. Riprova; se persiste, ricarica la pagina."
      azione={<Button onClick={reset}>Riprova</Button>}
    />
  );
}
