"use client";

import type { Analisi } from "@advisorhub/engine";

import { JudgmentBadge } from "@/components/ui/judgment-badge";

const CHIP: { k: string; get: (a: Analisi) => Analisi["giudizi"][keyof Analisi["giudizi"]] }[] = [
  { k: "ROS", get: (a) => a.giudizi.ros },
  { k: "TURN", get: (a) => a.giudizi.turnover },
  { k: "ROI", get: (a) => a.giudizi.roi },
  { k: "ROI-I", get: (a) => a.giudizi.roiI },
  { k: "ROE", get: (a) => a.giudizi.roe },
  { k: "GI", get: (a) => a.giudizi.gi },
  { k: "DSCR", get: (a) => a.giudizi.dscr },
];

/** Anello del punteggio: il numero resta leggibile senza il colore. */
function AnelloScore({ score }: { score: number }) {
  const r = 44;
  const circonferenza = 2 * Math.PI * r;
  const colore =
    score < 35
      ? "var(--danger)"
      : score < 60
        ? "var(--warning)"
        : score < 85
          ? "var(--success)"
          : "var(--primary)";
  return (
    <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
      <svg width={108} height={108} className="-rotate-90" aria-hidden>
        <circle cx={54} cy={54} r={r} stroke="var(--muted)" strokeWidth={9} fill="none" />
        <circle
          cx={54}
          cy={54}
          r={r}
          stroke={colore}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circonferenza} ${circonferenza}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-mono nums text-2xl font-bold leading-none">{score}</div>
          <div className="mt-0.5 text-[10px] tracking-widest uppercase text-muted-foreground">
            /100
          </div>
        </div>
      </div>
    </div>
  );
}

export function PannelloSintesi({ analisi }: { analisi: Analisi }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <AnelloScore score={analisi.score} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            Valutazione di sintesi
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{analisi.sintesi.titolo}</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {analisi.sintesi.descrizione}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CHIP.map((c) => {
              const g = c.get(analisi);
              return (
                <JudgmentBadge key={c.k} tone={g.tone}>
                  {c.k}: {g.label}
                </JudgmentBadge>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg bg-muted/60 p-3">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Cosa guardare adesso
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-foreground/85">
              <li>
                <span className="font-medium">Marginalità: </span>
                {analisi.giudizi.ros.testo}
              </li>
              <li>
                <span className="font-medium">Efficienza del capitale: </span>
                {analisi.giudizi.turnover.testo}
              </li>
              <li>
                <span className="font-medium">Sostenibilità del debito: </span>
                {analisi.giudizi.gi.testo}
              </li>
              <li>
                <span className="font-medium">DSCR: </span>
                {analisi.giudizi.dscr.testo}
              </li>
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-sm">
              <span className="font-semibold">Azione prioritaria: </span>
              {analisi.azionePrioritaria}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
