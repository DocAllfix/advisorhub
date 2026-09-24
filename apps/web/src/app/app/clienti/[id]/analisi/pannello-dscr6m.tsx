import { formatEuro, formatNumero, type Analisi } from "@finbeacon/engine";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { JudgmentBadge } from "@/components/ui/judgment-badge";

/**
 * DSCR prospettico a 6 mesi (art. 3 CCII, linee guida CNDCEC).
 * Separato dagli altri indicatori perché è prospettico e non concorre allo score.
 */
export function PannelloDscr6M({
  analisi,
  clienteId,
  esercizioId,
}: {
  analisi: Analisi;
  clienteId: string;
  esercizioId: string;
}) {
  const { dscrProspettico, disponibile6m } = analisi.indicatori;
  const g = analisi.giudizi.dscrPro;
  const nonCalcolato = dscrProspettico === null;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">DSCR Prospettico 6M</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Continuità aziendale secondo CNDCEC, art. 3 CCII
          </p>
        </div>
        <JudgmentBadge tone={g.tone}>{g.label}</JudgmentBadge>
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        (Liquidità iniziale + Entrate 6M − Uscite 6M) / Debito da servire 6M
      </p>

      {nonCalcolato ? (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{g.testo}</p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href={`/app/clienti/${clienteId}/esercizi/${esercizioId}/modifica`}>
              Compila i dati previsionali
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono nums text-2xl font-semibold tracking-tight">
              {dscrProspettico >= 99 ? "∞" : formatNumero(dscrProspettico, 2)}
            </span>
            <span className="text-xs text-muted-foreground">soglia CNDCEC 1,1</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Disponibilità 6M {disponibile6m !== null ? formatEuro(disponibile6m) : "n.d."}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{g.testo}</p>
          <p className="mt-3 text-sm">
            <span className="font-medium">Cosa puoi fare: </span>
            <span className="text-foreground/80">{g.azione}</span>
          </p>
          {dscrProspettico < 1.1 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-subtle p-3 text-xs text-warning-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Sotto la soglia 1,1: presidia la tesoreria e segnala all&apos;organo di controllo se
                la situazione persiste.
              </span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
