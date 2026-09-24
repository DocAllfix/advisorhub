import { tracciaSoglia } from "@/lib/soglia";

const L = 320;
const A = 104;
/** Durata della scoperta della serie: il punto si accende quando il velo arriva lì. */
const SCOPERTA_MS = 1100;
const ATTESA_MS = 350;

/**
 * Il motivo «soglia sul grafico» (Social-Studio): la linea della soglia è
 * l'orizzonte, la serie è l'indice, e l'UNICA cosa accesa in ottanio è il punto
 * in cui il dato scende sotto soglia. Il punto si calcola dai dati.
 *
 * Reso dal server come SVG: niente JavaScript. Il movimento è solo CSS
 * (transform e opacity) e si spegne con prefers-reduced-motion. Senza
 * movimento, il disegno è semplicemente già completo.
 */
export function GraficoSoglia({
  valori,
  soglia,
  etichette,
  animato = false,
}: {
  valori: readonly number[];
  soglia: number;
  etichette?: readonly string[];
  animato?: boolean;
}) {
  const { punti, ySoglia, attraversamento } = tracciaSoglia(valori, soglia, L, A);
  const serie = punti.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  // Il velo scorre a velocità costante: il punto si accende quando lo raggiunge.
  const ritardoLuce = attraversamento
    ? ATTESA_MS + Math.round((attraversamento.x / L) * SCOPERTA_MS)
    : 0;

  return (
    <figure className="m-0">
      <svg
        viewBox={`-6 -6 ${L + 12} ${A + 12}`}
        className={`block w-full overflow-visible ${animato ? "soglia-animata" : ""}`}
        style={
          {
            "--durata-scoperta": `${SCOPERTA_MS}ms`,
            "--attesa-scoperta": `${ATTESA_MS}ms`,
            "--ritardo-luce": `${ritardoLuce}ms`,
          } as React.CSSProperties
        }
        aria-hidden
        focusable="false"
      >
        <polyline
          points={serie}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/*
         * Il velo: stesso colore della superficie, scorre via e scopre la serie.
         * È TRASPARENTE di suo: diventa opaco solo dentro l'animazione, che
         * esiste solo con il movimento consentito. Con reduced-motion, o se il
         * CSS non arriva, non copre niente e il disegno è già completo.
         */}
        {animato && (
          <rect
            className="soglia-velo"
            x={-6}
            y={-6}
            width={L + 12}
            height={A + 12}
            fill="var(--superficie)"
            opacity={0}
          />
        )}
        <line
          x1={-6}
          x2={L + 6}
          y1={ySoglia}
          y2={ySoglia}
          stroke="var(--bordo)"
          strokeWidth={1.5}
        />
        {attraversamento && (
          <>
            <line
              className="soglia-raggio"
              x1={attraversamento.x}
              x2={attraversamento.x}
              y1={ySoglia}
              y2={A + 6}
              stroke="var(--accento)"
              strokeWidth={2}
              opacity={0.35}
            />
            <circle
              className="soglia-luce"
              cx={attraversamento.x}
              cy={ySoglia}
              r={5.5}
              fill="var(--accento)"
            />
          </>
        )}
      </svg>
      {etichette && (
        <figcaption className="cifre mt-[0.5em] flex justify-between text-[0.75em] text-testo-attenuato">
          {etichette.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
