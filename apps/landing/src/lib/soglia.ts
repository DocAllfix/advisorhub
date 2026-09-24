/**
 * Geometria del motivo «soglia sul grafico»: il punto di luce si accende
 * esattamente dove la serie attraversa la soglia. Si calcola dai dati, mai a
 * mano: se la serie cambia, il punto si sposta con lei.
 */

export interface Punto {
  x: number;
  y: number;
}

export interface Tracciato {
  /** I vertici della serie, già nello spazio del disegno. */
  punti: Punto[];
  /** La quota della soglia nello spazio del disegno. */
  ySoglia: number;
  /** Dove la serie scende sotto la soglia; null se non la attraversa mai. */
  attraversamento: Punto | null;
}

/**
 * Proietta una serie in un rettangolo `larghezza × altezza` con un margine
 * verticale, e trova il primo punto in cui passa da sopra a sotto la soglia.
 *
 * L'intervallo verticale include sempre la soglia, così la linea
 * dell'orizzonte cade dentro il disegno anche se la serie le resta lontana.
 */
export function tracciaSoglia(
  valori: readonly number[],
  soglia: number,
  larghezza: number,
  altezza: number,
  margine = 0.12,
): Tracciato {
  if (valori.length < 2) throw new Error("Servono almeno due valori per tracciare una serie");

  const min = Math.min(soglia, ...valori);
  const max = Math.max(soglia, ...valori);
  const escursione = max - min || 1;
  const alto = altezza * margine;
  const utile = altezza * (1 - 2 * margine);
  const y = (v: number) => alto + ((max - v) / escursione) * utile;
  const passo = larghezza / (valori.length - 1);

  const punti = valori.map((v, i) => ({ x: i * passo, y: y(v) }));
  const ySoglia = y(soglia);

  let attraversamento: Punto | null = null;
  for (let i = 1; i < valori.length; i++) {
    const prima = valori[i - 1]!;
    const dopo = valori[i]!;
    if (prima >= soglia && dopo < soglia) {
      const t = (prima - soglia) / (prima - dopo);
      attraversamento = { x: (i - 1 + t) * passo, y: ySoglia };
      break;
    }
  }

  return { punti, ySoglia, attraversamento };
}
