"use client";

import type { Analisi, DatiBilancio, Giudizio, Tono } from "@advisorhub/engine";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { NumeroAnimato } from "@/components/ui/numero-animato";
import type { MetaIndicatore } from "@/lib/analisi/indicatori-meta";
import { cn } from "@/lib/utils";

const coloreTono: Record<Tono, string> = {
  eccellente: "var(--primary)",
  buono: "var(--success)",
  attenzione: "var(--warning)",
  critico: "var(--danger)",
  nd: "var(--muted-foreground)",
};

/** Anello di posizione sulla scala, come nel prototipo. Ridondante col badge. */
function AnelloIndicatore({ percentuale, colore }: { percentuale: number; colore: string }) {
  const r = 17;
  const circonferenza = 2 * Math.PI * r;
  const quota = (Math.max(0, Math.min(100, percentuale)) / 100) * circonferenza;
  return (
    <div className="relative size-11 shrink-0" aria-hidden>
      <svg width={44} height={44} className="-rotate-90">
        <circle cx={22} cy={22} r={r} stroke="var(--muted)" strokeWidth={4} fill="none" />
        <circle
          cx={22}
          cy={22}
          r={r}
          stroke={colore}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${quota} ${circonferenza}`}
          className="motion-safe:transition-all motion-safe:duration-300"
        />
      </svg>
      <span className="nums absolute inset-0 grid place-items-center font-mono text-[10px] text-muted-foreground">
        {Math.round(percentuale)}%
      </span>
    </div>
  );
}

export function CardIndicatore({
  meta,
  giudizio,
  analisi,
  dati,
  delta,
}: {
  meta: MetaIndicatore;
  giudizio: Giudizio;
  analisi: Analisi;
  dati: DatiBilancio;
  /** Valore di riferimento (dati salvati) durante la simulazione. */
  delta?: { valorePrecedente: string } | null;
}) {
  const [aperta, setAperta] = useState(false);
  const valore = meta.valore(analisi, dati);
  const cambiato = delta && delta.valorePrecedente !== valore;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{meta.titolo}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.sottotitolo}</p>
        </div>
        <JudgmentBadge tone={giudizio.tone}>{giudizio.label}</JudgmentBadge>
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{meta.formula}</p>

      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono nums text-2xl font-semibold tracking-tight">
            <NumeroAnimato testo={valore} />
          </p>
          {cambiato && (
            <p className="nums text-xs text-muted-foreground">
              da <span className="font-mono">{delta!.valorePrecedente}</span>
            </p>
          )}
        </div>
        {/* L'anello è ridondante col badge: il colore non è mai l'unico canale */}
        <AnelloIndicatore
          percentuale={meta.percentuale(analisi, dati)}
          colore={coloreTono[giudizio.tone]}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{meta.extra(analisi, dati)}</p>

      <p className="mt-3 text-sm">
        <span className="font-medium">Cosa puoi fare: </span>
        <span className="text-foreground/80">{giudizio.azione}</span>
      </p>

      <button
        type="button"
        onClick={() => setAperta((v) => !v)}
        aria-expanded={aperta}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Cosa significa
        <ChevronDown
          className={cn("size-3.5 transition-transform", aperta && "rotate-180")}
          aria-hidden
        />
      </button>
      {aperta && (
        <div className="mt-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-foreground/80">
          <p>{meta.descrizione}</p>
          <p className="mt-2 text-muted-foreground">{giudizio.testo}</p>
        </div>
      )}
    </div>
  );
}
