import { notFound } from "next/navigation";

import { EsercizioForm } from "@/app/app/clienti/esercizio-form";
import { getEsercizio } from "@/lib/esercizi/queries";
import type { EsercizioInput } from "@/lib/esercizi/schema";

export default async function ModificaEsercizioPage({
  params,
}: {
  params: Promise<{ id: string; esercizioId: string }>;
}) {
  const { esercizioId } = await params;
  const row = await getEsercizio(esercizioId);
  if (!row) notFound();
  const e = row.esercizio;

  const valori: Partial<EsercizioInput> = {
    anno: e.anno,
    valProd: e.valProd,
    fatturato: e.fatturato,
    ro: e.ro,
    ebitda: e.ebitda,
    utileNetto: e.utileNetto,
    capInvest: e.capInvest,
    patrNetto: e.patrNetto,
    pfn: e.pfn,
    servizioDebito: e.servizioDebito,
    flussoCassa: e.flussoCassa,
    liquiditaIniziale: e.liquiditaIniziale ?? undefined,
    entrate6m: e.entrate6m ?? undefined,
    uscite6m: e.uscite6m ?? undefined,
    debito6m: e.debito6m ?? undefined,
  };

  return (
    <div>
      <header>
        <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
          {row.ragioneSociale}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Modifica esercizio {e.anno}</h1>
      </header>
      <div className="mt-8">
        <EsercizioForm
          clienteId={row.clienteId}
          ragioneSociale={row.ragioneSociale}
          esercizioId={e.id}
          valoriIniziali={valori}
        />
      </div>
    </div>
  );
}
