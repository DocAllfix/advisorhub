"use client";

import type { Analisi, DatiBilancio, Giudizio, Tono } from "@advisorhub/engine";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { JudgmentBadge } from "@/components/ui/judgment-badge";
import type { MetaIndicatore } from "@/lib/analisi/indicatori-meta";
import { cn } from "@/lib/utils";

const barraPerTono: Record<Tono, string> = {
  eccellente: "bg-primary",
  buono: "bg-success",
  attenzione: "bg-warning",
  critico: "bg-danger",
  nd: "bg-muted-foreground/40",
};

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

      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono nums text-2xl font-semibold tracking-tight">{valore}</span>
        {cambiato && (
          <span className="nums text-xs text-muted-foreground">
            da <span className="font-mono">{delta!.valorePrecedente}</span>
          </span>
        )}
      </div>

      {/* Barra di stato: ridondante col badge, mai unico canale */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barraPerTono[giudizio.tone])}
          style={{ width: `${Math.max(4, Math.min(100, giudizio.score))}%` }}
          aria-hidden
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{meta.extra(analisi, dati)}</p>

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
