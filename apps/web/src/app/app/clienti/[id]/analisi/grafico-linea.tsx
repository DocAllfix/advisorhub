"use client";

import { formatNumero } from "@advisorhub/engine";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Il solo disegno del grafico, separato da `trend-esercizi.tsx` perche' e'
 * l'unico punto che ha bisogno di recharts: circa 380 KB di JavaScript che la
 * pagina di analisi scaricava e analizzava all'avvio, per grafici che stanno
 * sotto la piega. Ora si caricano dopo, con `next/dynamic`.
 *
 * Il riquadro che lo contiene ha altezza fissa e resta in `trend-esercizi`:
 * lo spazio e' riservato prima che arrivi il grafico, quindi niente
 * spostamento di layout quando compare.
 */
export default function GraficoLinea({
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
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dati} margin={{ top: 6, right: 8, bottom: 0, left: -4 }}>
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
          width={48}
          // Senza formatter recharts stampa 1.05 mentre la pagina scrive 1,40.
          // Sull'asse i decimali servono solo se il valore li ha davvero:
          // "12,00" sfora la banda e verrebbe tagliato in "2,00".
          tickFormatter={(v: number) => formatNumero(v, Number.isInteger(v) ? 0 : decimali)}
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
  );
}
