import type { Tono } from "@advisorhub/engine";
import * as React from "react";

import { Cifra } from "@/components/ui/cifra";
import { MicroEtichetta } from "@/components/ui/micro-etichetta";
import { toniGrafica } from "@/lib/analisi/toni";
import { cn } from "@/lib/utils";

/** Anello di punteggio: si disegna una volta all'ingresso, poi resta fermo. */
function Anello({ percentuale, colore }: { percentuale: number; colore: string }) {
  const dim = 168;
  const spessore = 10;
  const r = (dim - spessore) / 2;
  const c = 2 * Math.PI * r;
  const quota = (Math.max(0, Math.min(100, percentuale)) / 100) * c;

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90" aria-hidden>
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={r}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={spessore}
      />
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={r}
        fill="none"
        stroke={colore}
        strokeWidth={spessore}
        strokeLinecap="round"
        style={
          {
            "--anello-c": c,
            strokeDasharray: c,
            strokeDashoffset: c - quota,
            animation: "anello-disegna 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          } as React.CSSProperties
        }
      />
    </svg>
  );
}

export type PuntoScena = { anno: number; media: number };
/** Variazione sull'anno precedente; `nota` precisa la base del confronto. */
export type DeltaScena = { valore: number; annoPrec: number; nota?: string };

/**
 * Andamento del punteggio medio: area tenue, linea sottile, ultimo punto in
 * evidenza. Resta muto per i lettori di schermo perché il dato che conta (la
 * variazione) è già scritto in chiaro accanto.
 */
function Andamento({ punti, colore }: { punti: PuntoScena[]; colore: string }) {
  const w = 220;
  const h = 56;
  const valori = punti.map((p) => p.media);
  const min = Math.min(...valori);
  const max = Math.max(...valori);
  const span = max - min || 1;
  const x = (i: number) => (i / (punti.length - 1)) * w;
  const y = (v: number) => h - 6 - ((v - min) / span) * (h - 14);
  const linea = punti.map((p, i) => `${x(i)},${y(p.media)}`).join(" ");
  const ultimo = punti[punti.length - 1]!;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <polygon points={`${linea} ${w},${h} 0,${h}`} fill={colore} opacity="0.1" />
      <polyline points={linea} fill="none" stroke={colore} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(punti.length - 1)} cy={y(ultimo.media)} r="3.5" fill={colore} />
    </svg>
  );
}

/**
 * Apertura di una schermata: un dato solo, grande, con la frase che lo
 * interpreta. Vive senza contenitore, per staccarsi dalla densità che segue.
 */
function Scena({
  etichetta,
  punteggio,
  suffisso,
  tono = "nd",
  titolo,
  frase,
  nota,
  trend = [],
  delta = null,
  azione,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  etichetta?: React.ReactNode;
  punteggio: number | null;
  suffisso?: React.ReactNode;
  /** Tono dell'anello: segue la fascia del punteggio, non il rischio complessivo */
  tono?: Tono;
  titolo: string;
  frase: string;
  nota?: React.ReactNode;
  trend?: PuntoScena[];
  delta?: DeltaScena | null;
  azione?: React.ReactNode;
}) {
  const colore = toniGrafica[tono];

  return (
    <section data-slot="scena" data-tour="scena" className={cn("flex flex-col gap-6", className)} {...props}>
      {etichetta ? <MicroEtichetta>{etichetta}</MicroEtichetta> : null}

      <div className="flex flex-col items-start gap-7 sm:flex-row sm:items-center sm:gap-10">
        {punteggio !== null && (
          <div className="relative shrink-0">
            <Anello percentuale={punteggio} colore={colore} />
            <div className="absolute inset-0 grid place-content-center text-center">
              <Cifra valore={punteggio} dimensione="lg" />
              {suffisso ? (
                <span className="mt-1 text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                  {suffisso}
                </span>
              ) : null}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{titolo}</h1>
          <p className="mt-2 max-w-[52ch] text-lg leading-relaxed text-foreground/85">{frase}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            {delta !== null && (
              <p className="text-sm text-muted-foreground">
                <span
                  className="font-semibold"
                  style={{
                    color:
                      delta.valore > 0
                        ? "var(--success-foreground)"
                        : delta.valore < 0
                          ? "var(--danger-foreground)"
                          : undefined,
                  }}
                >
                  {delta.valore > 0 ? "▲" : delta.valore < 0 ? "▼" : "="}{" "}
                  {delta.valore > 0 ? "+" : ""}
                  {delta.valore}
                </span>{" "}
                sul {delta.annoPrec}
                {delta.nota ? `, ${delta.nota}` : ""}
              </p>
            )}
            {trend.length >= 2 && <Andamento punti={trend} colore={colore} />}
            {nota ? <p className="text-sm text-muted-foreground">{nota}</p> : null}
          </div>

          {azione ? <div className="mt-5">{azione}</div> : null}
        </div>
      </div>
    </section>
  );
}

export { Scena };
