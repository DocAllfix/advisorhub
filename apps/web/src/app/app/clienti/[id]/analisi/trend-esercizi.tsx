"use client";

import { formatNumero } from "@advisorhub/engine";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PuntoSerie = {
  anno: number;
  score: number;
  ros: number | null;
  roi: number | null;
  dscr: number | null;
};

/**
 * Small multiples: una serie per grafico. ROS/ROI (percentuali), DSCR (rapporto)
 * e score (0-100) hanno scale diverse: un unico grafico richiederebbe due assi,
 * che è l'errore da evitare. Ogni grafico ha il proprio asse e il proprio titolo.
 */
const GRAFICI = [
  { chiave: "score" as const, titolo: "Punteggio di sintesi", suffisso: "/100", decimali: 0 },
  { chiave: "ros" as const, titolo: "ROS", suffisso: "%", decimali: 2 },
  { chiave: "roi" as const, titolo: "ROI", suffisso: "%", decimali: 2 },
  { chiave: "dscr" as const, titolo: "DSCR", suffisso: "", decimali: 2 },
];

function Variazione({ delta, suffisso }: { delta: number; suffisso: string }) {
  if (Math.abs(delta) < 0.005) {
    return <span className="text-xs text-muted-foreground">invariato</span>;
  }
  const positivo = delta > 0;
  return (
    <span
      className={`nums font-mono text-xs ${positivo ? "text-success-foreground" : "text-danger-foreground"}`}
      title="Variazione rispetto all'esercizio precedente"
    >
      {positivo ? "▲" : "▼"} {formatNumero(Math.abs(delta), 2)}
      {suffisso}
    </span>
  );
}

function MiniGrafico({
  titolo,
  suffisso,
  decimali,
  dati,
}: {
  titolo: string;
  suffisso: string;
  decimali: number;
  dati: { anno: number; valore: number | null }[];
}) {
  const validi = dati.filter((d) => d.valore !== null);
  // Variazione tra gli ultimi due esercizi con valore
  const delta =
    validi.length >= 2
      ? validi[validi.length - 1]!.valore! - validi[validi.length - 2]!.valore!
      : null;
  return (
    <figure className="border-t border-hairline pt-3">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">
          {titolo}
        </figcaption>
        {delta !== null && <Variazione delta={delta} suffisso={suffisso} />}
      </div>
      {validi.length < 2 ? (
        <p className="mt-6 mb-6 text-center text-xs text-muted-foreground">
          Servono almeno due esercizi
        </p>
      ) : (
        <div className="mt-2 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dati} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="anno"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(l) => `Esercizio ${l}`}
                formatter={(v) => [
                  typeof v === "number" ? `${formatNumero(v, decimali)}${suffisso}` : "n.d.",
                  titolo,
                ]}
              />
              <Line
                type="monotone"
                dataKey="valore"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}

export function TrendEsercizi({ serie }: { serie: PuntoSerie[] }) {
  const [tabella, setTabella] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">
          Andamento tra esercizi
        </h2>
        <Button variant="outline" size="sm" onClick={() => setTabella((v) => !v)}>
          {tabella ? "Mostra grafici" : "Mostra tabella"}
        </Button>
      </div>

      {tabella ? (
        <div className="mt-4 overflow-x-auto border-t border-hairline">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Esercizio</TableHead>
                <TableHead className="text-right">Punteggio</TableHead>
                <TableHead className="text-right">ROS</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">DSCR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serie.map((p) => (
                <TableRow key={p.anno}>
                  <TableCell className="font-medium nums">{p.anno}</TableCell>
                  <TableCell className="text-right font-mono nums">{p.score}</TableCell>
                  <TableCell className="text-right font-mono nums">
                    {p.ros === null ? "n.d." : `${formatNumero(p.ros, 2)}%`}
                  </TableCell>
                  <TableCell className="text-right font-mono nums">
                    {p.roi === null ? "n.d." : `${formatNumero(p.roi, 2)}%`}
                  </TableCell>
                  <TableCell className="text-right font-mono nums">
                    {p.dscr === null ? "n.d." : formatNumero(p.dscr, 2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {GRAFICI.map((g) => (
            <MiniGrafico
              key={g.chiave}
              titolo={g.titolo}
              suffisso={g.suffisso}
              decimali={g.decimali}
              dati={serie.map((p) => ({ anno: p.anno, valore: p[g.chiave] }))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
