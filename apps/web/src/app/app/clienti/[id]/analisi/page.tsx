import { analizza, type DatiBilancio, type DatiPrevisionali6M } from "@advisorhub/engine";
import { FileBarChart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCliente } from "@/lib/clienti/queries";
import { listEsercizi } from "@/lib/esercizi/queries";

import { AnalisiDashboard } from "./analisi-dashboard";

type RigaEsercizio = Awaited<ReturnType<typeof listEsercizi>>[number];

function datiDa(e: RigaEsercizio): DatiBilancio {
  return {
    valProd: e.valProd,
    fatturato: e.fatturato,
    ro: e.ro,
    capInvest: e.capInvest,
    patrNetto: e.patrNetto,
    utileNetto: e.utileNetto,
    ebitda: e.ebitda,
    pfn: e.pfn,
    servizioDebito: e.servizioDebito,
    flussoCassa: e.flussoCassa,
  };
}

function previsionaleDa(e: RigaEsercizio): DatiPrevisionali6M | null {
  return e.liquiditaIniziale !== null &&
    e.entrate6m !== null &&
    e.uscite6m !== null &&
    e.debito6m !== null
    ? {
        liquiditaIniziale: e.liquiditaIniziale,
        entrate6m: e.entrate6m,
        uscite6m: e.uscite6m,
        debito6m: e.debito6m,
      }
    : null;
}

export default async function AnalisiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ esercizio?: string }>;
}) {
  const { id } = await params;
  const { esercizio: esercizioParam } = await searchParams;

  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const esercizi = await listEsercizi(id); // già ordinati per anno desc

  if (esercizi.length === 0) {
    return (
      <div>
        <header>
          <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {cliente.ragioneSociale}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analisi</h1>
        </header>
        <div className="mt-8">
          <EmptyState
            icon={FileBarChart}
            titolo="Nessun esercizio da analizzare"
            descrizione="Carica i dati di bilancio di almeno un esercizio per vedere indicatori, giudizi e DSCR prospettico."
            azione={
              <Button asChild>
                <Link href={`/app/clienti/${id}/esercizi/nuovo`}>Aggiungi un esercizio</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const selezionato = esercizi.find((e) => e.id === esercizioParam) ?? esercizi[0]!;
  const dati = datiDa(selezionato);
  const previsionale = previsionaleDa(selezionato);
  const analisi = analizza(dati, previsionale ?? undefined);

  // Serie storica per il trend, dal più vecchio al più recente
  const serie = [...esercizi]
    .sort((a, b) => a.anno - b.anno)
    .map((e) => {
      const a = analizza(datiDa(e), previsionaleDa(e) ?? undefined);
      return {
        anno: e.anno,
        score: a.score,
        ros: a.indicatori.ros,
        roi: a.indicatori.roi,
        dscr: a.indicatori.dscr !== null && a.indicatori.dscr < 99 ? a.indicatori.dscr : null,
      };
    });

  return (
    <AnalisiDashboard
      clienteId={cliente.id}
      ragioneSociale={cliente.ragioneSociale}
      esercizi={esercizi.map((e) => ({ id: e.id, anno: e.anno }))}
      esercizioSelezionatoId={selezionato.id}
      anno={selezionato.anno}
      dati={dati}
      previsionale={previsionale}
      analisi={analisi}
      serie={serie}
    />
  );
}
