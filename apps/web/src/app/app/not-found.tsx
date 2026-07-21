import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppNotFound() {
  return (
    <EmptyState
      icon={Compass}
      titolo="Pagina non trovata"
      descrizione="La pagina che cerchi non esiste o è stata spostata."
      azione={
        <Button asChild variant="outline">
          <Link href="/app">Torna alla Panoramica</Link>
        </Button>
      }
    />
  );
}
