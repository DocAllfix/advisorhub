import { LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function PanoramicaPage() {
  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Panoramica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La salute del portafoglio in un colpo d&apos;occhio: clienti seguiti, segnali di allerta,
          scadenze.
        </p>
      </header>

      <div className="mt-8">
        <EmptyState
          icon={LayoutDashboard}
          titolo="La panoramica si popola con i tuoi clienti"
          descrizione="Aggiungi la prima azienda per vedere qui indicatori, punteggi di sintesi e segnali da presidiare."
          azione={
            <Button asChild>
              <Link href="/app/clienti">
                <Plus className="size-4" />
                Aggiungi il primo cliente
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
