import type { Tono } from "@finbeacon/engine";

/**
 * Il badge di giudizio del prodotto (DESIGN.md): pillola, pallino da 6px ED
 * etichetta scritta. Il colore non è mai l'unico canale (Regola del Semaforo
 * Parlante). Usato SOLO per giudizi sul dato.
 */
const TONI: Record<Tono, string> = {
  eccellente: "bg-ottimo-fondo text-ottimo-testo border-ottimo/35 [--pallino:var(--ottimo)]",
  buono: "bg-buono-fondo text-buono-testo border-buono/35 [--pallino:var(--buono)]",
  attenzione:
    "bg-attenzione-fondo text-attenzione-testo border-attenzione/35 [--pallino:var(--attenzione)]",
  critico: "bg-critico-fondo text-critico-testo border-critico/35 [--pallino:var(--critico)]",
  nd: "bg-tonale text-testo-attenuato border-bordo [--pallino:var(--testo-attenuato)]",
};

export function Giudizio({ tono, children }: { tono: Tono; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.5em] rounded-full border px-[0.85em] py-[0.2em] text-[0.8125em] leading-[1.35] font-medium whitespace-nowrap ${TONI[tono]}`}
    >
      <span className="size-[0.5em] shrink-0 rounded-full bg-[var(--pallino)]" aria-hidden />
      {children}
    </span>
  );
}

/** Colore del testo di un punteggio, per tono: come la cifra colorata del portafoglio. */
export const TESTO_TONO: Record<Tono, string> = {
  eccellente: "text-ottimo-testo",
  buono: "text-buono-testo",
  attenzione: "text-attenzione-testo",
  critico: "text-critico-testo",
  nd: "text-testo-attenuato",
};

/** Colore di una grafica (barra, segno), per tono. */
export const SEGNO_TONO: Record<Tono, string> = {
  eccellente: "bg-ottimo",
  buono: "bg-buono",
  attenzione: "bg-attenzione",
  critico: "bg-critico",
  nd: "bg-bordo",
};
