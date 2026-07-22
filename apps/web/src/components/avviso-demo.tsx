import { Info } from "lucide-react";

/**
 * Avviso mostrato al posto dei form di scrittura quando lo studio è
 * dimostrativo. Spiega che è la demo a fermare, così l'utente non pensa a un
 * malfunzionamento, e resta coerente col messaggio delle azioni bloccate.
 */
export function AvvisoDemo({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="flex max-w-xl items-start gap-3 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3.5">
      <Info className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-warning-foreground">{titolo}</p>
        <p className="mt-1 text-sm text-warning-foreground/90">{testo}</p>
      </div>
    </div>
  );
}
