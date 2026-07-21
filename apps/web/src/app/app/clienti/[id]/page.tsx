import { notFound } from "next/navigation";

import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { getCliente } from "@/lib/clienti/queries";
import { etichettaDimensione } from "@/lib/clienti/schema";
import { listEsercizi } from "@/lib/esercizi/queries";

import { EserciziPannello } from "../esercizi-pannello";

export default async function SchedaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const esercizi = await listEsercizi(id);
  const righe = esercizi.map((e) => ({
    id: e.id,
    anno: e.anno,
    valProd: e.valProd,
    fatturato: e.fatturato,
    ebitda: e.ebitda,
    pfn: e.pfn,
    haPrevisionale:
      e.liquiditaIniziale !== null &&
      e.entrate6m !== null &&
      e.uscite6m !== null &&
      e.debito6m !== null,
  }));

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
              {cliente.dimensione && <span aria-hidden>·</span>}
              <span className="font-mono nums">ATECO {cliente.codiceAteco}</span>
            </>
          )}
          {(cliente.dimensione || cliente.codiceAteco) && <span aria-hidden>·</span>}
          <JudgmentBadge tone="nd">Da analizzare</JudgmentBadge>
        </div>
        {cliente.note && (
          <p className="mt-3 max-w-prose text-sm text-foreground/80">{cliente.note}</p>
        )}
      </header>

      <div className="mt-8">
        <EserciziPannello clienteId={cliente.id} esercizi={righe} />
      </div>
    </div>
  );
}
