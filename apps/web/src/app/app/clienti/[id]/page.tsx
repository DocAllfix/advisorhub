import { FileBarChart } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { getCliente } from "@/lib/clienti/queries";
import { etichettaDimensione } from "@/lib/clienti/schema";

export default async function SchedaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  return (
    <div>
      <header>
        <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Cliente</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{cliente.ragioneSociale}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {cliente.dimensione && (
            <span>
              {etichettaDimensione[cliente.dimensione as keyof typeof etichettaDimensione]}
            </span>
          )}
          {cliente.codiceAteco && (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono nums">ATECO {cliente.codiceAteco}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <JudgmentBadge tone="nd">Da analizzare</JudgmentBadge>
        </div>
        {cliente.note && (
          <p className="mt-3 max-w-prose text-sm text-foreground/80">{cliente.note}</p>
        )}
      </header>

      <div className="mt-8">
        <EmptyState
          icon={FileBarChart}
          titolo="Nessun esercizio caricato"
          descrizione="Carica i dati di bilancio di un esercizio per calcolare indicatori, giudizi e DSCR prospettico. L'inserimento arriva con la prossima fase."
        />
      </div>
    </div>
  );
}
