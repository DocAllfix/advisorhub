"use client";

import { formatNumero } from "@finbeacon/engine";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/*
 * recharts non arriva con la pagina: arriva quando i grafici entrano in vista.
 *
 * `ssr: false` dice «non sul server», NON «al momento del bisogno». Appena
 * TrendEsercizi si idratava, l'import partiva: 348 KB di recharts scaricati e
 * valutati all'avvio della pagina di analisi, che e' gia' la piu' carica del
 * prodotto. Non bloccavano il primo disegno — per quello era stato messo
 * l'import dinamico — ma il lavoro lo facevano lo stesso.
 *
 * I grafici stanno in fondo, sotto il DSCR prospettico: una visita che non
 * scorre non li vede mai. `ssr: false` resta perche' ResponsiveContainer misura
 * il contenitore, cosa che sul server non si puo' fare.
 */
const GraficoLinea = dynamic(() => import("./grafico-linea"), { ssr: false });

/**
 * Vero quando il nodo osservato si e' affacciato almeno una volta.
 *
 * Una volta sola: dopo il primo incontro l'osservatore si stacca, perche' un
 * chunk scaricato resta scaricato e continuare a guardare sarebbe lavoro per
 * niente. Il margine anticipa di mezzo schermo, cosi' i grafici sono gia' li'
 * quando l'occhio arriva.
 *
 * Nessun ripiego per i browser senza IntersectionObserver, e non per
 * ottimismo: il ripiego esiste gia' ed e' il bottone «Mostra tabella» qui
 * sotto, che da' gli stessi numeri senza disegnarli. Un ripiego scritto qui
 * sarebbe codice che nessuno esegue mai e che nessun test puo' provare.
 */
function useVistaAlmenoUnaVolta<T extends HTMLElement>() {
  const rif = useRef<T>(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const nodo = rif.current;
    if (!nodo || visto) return;
    const osservatore = new IntersectionObserver(
      (voci) => {
        if (voci.some((v) => v.isIntersecting)) setVisto(true);
      },
      { rootMargin: "50% 0px" },
    );
    osservatore.observe(nodo);
    return () => osservatore.disconnect();
  }, [visto]);

  return [rif, visto] as const;
}

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
  disegna,
}: {
  titolo: string;
  suffisso: string;
  decimali: number;
  dati: { anno: number; valore: number | null }[];
  /** Falso finche' il riquadro non si e' affacciato: tiene fuori recharts. */
  disegna: boolean;
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
          {/* L'altezza e' fissa e non dipende dal contenuto: il grafico che
              arriva dopo non sposta niente (CLS 0). */}
          {disegna && (
            <GraficoLinea titolo={titolo} suffisso={suffisso} decimali={decimali} dati={dati} />
          )}
        </div>
      )}
    </figure>
  );
}

export function TrendEsercizi({ serie }: { serie: PuntoSerie[] }) {
  const [tabella, setTabella] = useState(false);
  const [rifGriglia, griglieInVista] = useVistaAlmenoUnaVolta<HTMLDivElement>();

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
        <div ref={rifGriglia} className="mt-4 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {GRAFICI.map((g) => (
            <MiniGrafico
              key={g.chiave}
              titolo={g.titolo}
              suffisso={g.suffisso}
              decimali={g.decimali}
              dati={serie.map((p) => ({ anno: p.anno, valore: p[g.chiave] }))}
              disegna={griglieInVista}
            />
          ))}
        </div>
      )}
    </section>
  );
}
