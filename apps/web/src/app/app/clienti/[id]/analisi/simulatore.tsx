"use client";

import { formatEuro, type DatiBilancio } from "@advisorhub/engine";

import { Label } from "@/components/ui/label";

/** Range dei cursori, ereditati dal prototipo (limiti di UI, non vincoli di dominio). */
const CURSORI: {
  campo: keyof DatiBilancio;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { campo: "valProd", label: "Valore della produzione", min: 0, max: 20_000_000, step: 50_000 },
  { campo: "fatturato", label: "Fatturato", min: 0, max: 20_000_000, step: 50_000 },
  { campo: "ro", label: "Reddito operativo", min: -500_000, max: 3_000_000, step: 10_000 },
  { campo: "capInvest", label: "Capitale investito", min: 0, max: 20_000_000, step: 50_000 },
  { campo: "patrNetto", label: "Patrimonio netto", min: 0, max: 10_000_000, step: 20_000 },
  { campo: "utileNetto", label: "Utile netto", min: -300_000, max: 2_000_000, step: 10_000 },
  { campo: "ebitda", label: "EBITDA / MOL", min: -200_000, max: 4_000_000, step: 10_000 },
  { campo: "pfn", label: "PFN", min: 0, max: 15_000_000, step: 50_000 },
  { campo: "servizioDebito", label: "Servizio del debito", min: 0, max: 2_000_000, step: 10_000 },
  { campo: "flussoCassa", label: "Flusso di cassa", min: -200_000, max: 4_000_000, step: 10_000 },
];

export function Simulatore({
  dati,
  datiSalvati,
  onCambio,
}: {
  dati: DatiBilancio;
  datiSalvati: DatiBilancio;
  onCambio: (campo: keyof DatiBilancio, valore: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Cursori di simulazione</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Muovi un valore per vedere come cambiano gli indicatori.
      </p>
      <div className="mt-4 space-y-4">
        {CURSORI.map((c) => {
          const valore = dati[c.campo];
          const modificato = valore !== datiSalvati[c.campo];
          return (
            <div key={c.campo}>
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`sim-${c.campo}`} className="text-xs">
                  {c.label}
                </Label>
                <span
                  className={`font-mono nums text-xs ${modificato ? "font-semibold text-primary" : "text-muted-foreground"}`}
                >
                  {formatEuro(valore)}
                </span>
              </div>
              <input
                id={`sim-${c.campo}`}
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={Math.max(c.min, Math.min(c.max, valore))}
                onChange={(e) => onCambio(c.campo, Number(e.target.value))}
                className="mt-1.5 w-full accent-primary"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
