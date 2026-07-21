"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In Fase 10 questo confluirà in Sentry
    console.error(error);
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
