import type { Tono } from "@finbeacon/engine";

/**
 * Colore di un tono per elementi **grafici** (anelli, barre, pallini): il
 * requisito di contrasto è 3:1 su non-testo, quindi si usano le tinte piene.
 */
export const toniGrafica: Record<Tono, string> = {
  eccellente: "var(--success)",
  buono: "var(--success-buono)",
  attenzione: "var(--warning)",
  critico: "var(--danger)",
  nd: "var(--muted-foreground)",
};

/**
 * Colore di un tono per il **testo** (cifre, etichette): serve 4,5:1, che le
 * tinte grafiche non garantiscono in tema chiaro. Le varianti -foreground sono
 * calibrate su entrambe le superfici.
 *
 * La scala dei giudizi parte dal verde e non dall'ottanio: l'ottanio è il
 * colore dell'azione (DESIGN.md) e usarlo anche come voto "Ottimo" gli toglie
 * forza di segnale, oltre a spezzare la lettura della scala.
 */
export const toniTesto: Record<Tono, string> = {
  eccellente: "var(--success-foreground)",
  buono: "var(--success-buono-foreground)",
  attenzione: "var(--warning-foreground)",
  critico: "var(--danger-foreground)",
  nd: "var(--muted-foreground)",
};
