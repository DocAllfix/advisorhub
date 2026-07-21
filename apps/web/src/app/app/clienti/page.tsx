import { Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ClientiPage() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Clienti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Il portafoglio dello studio. Da qui apri la scheda di ogni azienda.
          </p>
        </header>
        <Button disabled>
          <Plus className="size-4" />
          Nuovo cliente
        </Button>
      </div>

      <div className="mt-8">
        <EmptyState
          icon={Users}
          titolo="Nessun cliente nel portafoglio"
          descrizione="La creazione e la gestione dei clienti arrivano con la prossima fase. Questa vista ne ospiterà l'elenco e la ricerca."
        />
      </div>
    </div>
  );
}
