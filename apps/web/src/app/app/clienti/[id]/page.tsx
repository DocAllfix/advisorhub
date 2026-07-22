import { analizza } from "@advisorhub/engine";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Cifra } from "@/components/ui/cifra";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { MicroEtichetta } from "@/components/ui/micro-etichetta";
import { datiDa, previsionaleDa } from "@/lib/analisi/da-esercizio";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";
import { getCliente } from "@/lib/clienti/queries";
import { etichettaDimensione } from "@/lib/clienti/schema";
import { listEsercizi } from "@/lib/esercizi/queries";

import { EserciziPannello } from "../esercizi-pannello";

const coloreTono: Record<string, string> = {
  eccellente: "var(--primary)",
  buono: "var(--success)",
  attenzione: "var(--warning)",
  critico: "var(--danger)",
  nd: "var(--muted-foreground)",
};

export default async function SchedaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const esercizi = await listEsercizi(id); // già ordinati per anno desc
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

  // Salute corrente dall'esercizio più recente: prima la scheda mostrava
  // "Da analizzare" anche per clienti già analizzati.
  const recente = esercizi[0];
  const analisi = recente
    ? analizza(datiDa(recente), previsionaleDa(recente) ?? undefined)
    : null;
  const sintetico = analisi ? sinteticoDaScore(analisi.score) : null;

  const identita = [
    cliente.dimensione
      ? etichettaDimensione[cliente.dimensione as keyof typeof etichettaDimensione]
      : null,
    cliente.codiceAteco ? `ATECO ${cliente.codiceAteco}` : null,
  ].filter(Boolean);

  return (
    <div>
      <header>
        <MicroEtichetta>Cliente</MicroEtichetta>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">{cliente.ragioneSociale}</h1>
        {identita.length > 0 && (
          <p className="mt-1.5 text-sm text-muted-foreground">{identita.join(" · ")}</p>
        )}
      </header>

      {analisi && sintetico && recente ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-hairline py-5">
          <Cifra
            valore={analisi.score}
            suffisso="/100"
            dimensione="md"
            style={{ color: coloreTono[sintetico.tone] }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="font-semibold">{analisi.sintesi.titolo}</p>
              <JudgmentBadge tone={sintetico.tone}>{sintetico.label}</JudgmentBadge>
            </div>
            <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
              Esercizio {recente.anno}. {analisi.azionePrioritaria}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/app/clienti/${cliente.id}/analisi`}>
              <BarChart3 className="size-4" />
              Apri analisi
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 border-y border-hairline py-5">
          <JudgmentBadge tone="nd">Da analizzare</JudgmentBadge>
          <p className="mt-2 text-sm text-muted-foreground">
            Carica un esercizio per calcolare indicatori, giudizi e DSCR prospettico.
          </p>
        </div>
      )}

      {cliente.note && (
        <div className="mt-6">
          <MicroEtichetta come="h2">Note</MicroEtichetta>
          <p className="mt-2 max-w-[72ch] text-sm text-foreground/80">{cliente.note}</p>
        </div>
      )}

      <div className="mt-8">
        <EserciziPannello clienteId={cliente.id} esercizi={righe} />
      </div>
    </div>
  );
}
