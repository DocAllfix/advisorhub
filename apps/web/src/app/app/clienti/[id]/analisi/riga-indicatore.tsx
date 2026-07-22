"use client";

import type { Analisi, DatiBilancio, Giudizio } from "@advisorhub/engine";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Cifra } from "@/components/ui/cifra";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { NumeroAnimato } from "@/components/ui/numero-animato";
import type { MetaIndicatore } from "@/lib/analisi/indicatori-meta";
import { toniGrafica } from "@/lib/analisi/toni";
import { cn } from "@/lib/utils";

/**
 * Un indicatore come riga editoriale: valore e scala incolonnati con gli altri
 * della famiglia, così il confronto si legge senza rileggere le etichette.
 * Il consiglio resta sempre in chiaro (PRODUCT.md: dal dato al consiglio),
 * formula e spiegazione si aprono su richiesta.
 */
export function RigaIndicatore({
  meta,
  giudizio,
  analisi,
  dati,
  delta,
  marcaTour,
}: {
  meta: MetaIndicatore;
  giudizio: Giudizio;
  analisi: Analisi;
  dati: DatiBilancio;
  /** Valore dei dati salvati, durante la simulazione. */
  delta?: { valorePrecedente: string } | null;
  /** Bersaglio del passo di guida sulla singola riga: solo la prima. */
  marcaTour?: boolean;
}) {
  const [aperta, setAperta] = useState(false);
  const valore = meta.valore(analisi, dati);
  const percentuale = meta.percentuale(analisi, dati);
  const colore = toniGrafica[giudizio.tone];
  const cambiato = delta && delta.valorePrecedente !== valore;

  return (
    <div data-tour={marcaTour ? "riga-indicatore" : undefined} className="border-b border-hairline py-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h3 className="min-w-0 flex-1 text-sm font-semibold">
          {meta.titolo}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {meta.sottotitolo}
          </span>
        </h3>

        <span className="w-32 shrink-0 text-right whitespace-nowrap">
          <Cifra valore={<NumeroAnimato testo={valore} />} dimensione="sm" />
          {cambiato && (
            <span className="nums block font-mono text-[11px] text-muted-foreground">
              da {delta!.valorePrecedente}
            </span>
          )}
        </span>

        {/* Scala di posizione: ridondante col badge, mai unico canale */}
        <span
          className="hidden h-1 w-20 shrink-0 self-center rounded-full bg-muted md:block"
          aria-hidden
        >
          <span
            className="block h-full rounded-full motion-safe:transition-all motion-safe:duration-300"
            style={{ width: `${Math.max(0, Math.min(100, percentuale))}%`, backgroundColor: colore }}
          />
        </span>

        <JudgmentBadge tone={giudizio.tone}>{giudizio.label}</JudgmentBadge>
      </div>

      <p className="mt-2 max-w-[72ch] text-sm text-foreground/80">
        <span className="text-muted-foreground">Cosa puoi fare: </span>
        {giudizio.azione}
      </p>

      <button
        type="button"
        onClick={() => setAperta((v) => !v)}
        aria-expanded={aperta}
        className="mt-2 flex min-h-11 items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:min-h-8"
      >
        Cosa significa
        <ChevronDown
          className={cn("size-3.5 transition-transform", aperta && "rotate-180")}
          aria-hidden
        />
      </button>

      {aperta && (
        <div className="mt-2.5 max-w-[72ch] space-y-2 text-xs leading-relaxed text-foreground/80">
          <p className="nums inline-block rounded bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
            {meta.formula}
          </p>
          <p>{meta.descrizione}</p>
          <p className="text-muted-foreground">{giudizio.testo}</p>
          <p className="nums font-mono text-[11px] text-muted-foreground">
            {meta.extra(analisi, dati)}
          </p>
        </div>
      )}
    </div>
  );
}
