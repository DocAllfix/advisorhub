import { analizza } from "@advisorhub/engine";
import { FileBarChart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { datiDa, previsionaleDa } from "@/lib/analisi/da-esercizio";
import { getCliente } from "@/lib/clienti/queries";
import { listEsercizi } from "@/lib/esercizi/queries";

import { ContenitoreAnalisi } from "./contenitore-analisi";
import { VistaAnalisi } from "./vista-analisi";

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

  // La serie fino all'esercizio in lettura: mostrare anni successivi a quello
  // a schermo darebbe una variazione che non riguarda il numero mostrato.
  const indiceAnno = serie.findIndex((s) => s.anno === selezionato.anno);
  const serieFinoAdOra = indiceAnno >= 0 ? serie.slice(0, indiceAnno + 1) : serie;
  const delta =
    indiceAnno > 0
      ? {
          valore: serie[indiceAnno]!.score - serie[indiceAnno - 1]!.score,
          annoPrec: serie[indiceAnno - 1]!.anno,
        }
      : null;

  /*
   * La vista e' resa QUI, dal server, e passata come figlio al contenitore
   * client. Cosi' resta HTML e non viene idratata: il contenitore la mostra
   * finche' non si entra in simulazione, e le poche interazioni (selettore
   * dell'esercizio, «Simula», scarico del PDF) restano vive.
   */
  return (
    <ContenitoreAnalisi
      clienteId={cliente.id}
      ragioneSociale={cliente.ragioneSociale}
      anno={selezionato.anno}
      esercizi={esercizi.map((e) => ({ id: e.id, anno: e.anno }))}
      esercizioSelezionatoId={selezionato.id}
      dati={dati}
      previsionale={previsionale}
      analisi={analisi}
      serie={serie}
    >
      <VistaAnalisi
        clienteId={cliente.id}
        esercizioSelezionatoId={selezionato.id}
        analisi={analisi}
        dati={dati}
        serie={serie}
        trend={serieFinoAdOra.map((s) => ({ anno: s.anno, media: s.score }))}
        delta={delta}
      />
    </ContenitoreAnalisi>
  );
}
