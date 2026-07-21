"use client";

import { formatEuro, type DatiBilancio, type DatiPrevisionali6M } from "@advisorhub/engine";

import { Label } from "@/components/ui/label";

type CampoStorico = keyof DatiBilancio;
type CampoPrev = keyof DatiPrevisionali6M;

type Cursore<T> = { campo: T; label: string; min: number; max: number; step: number };

/** Range dei cursori, ereditati dal prototipo (limiti di interfaccia, non di dominio). */
const STORICI: Cursore<CampoStorico>[] = [
  { campo: "valProd", label: "Valore della produzione", min: 0, max: 20_000_000, step: 50_000 },
  { campo: "fatturato", label: "Fatturato", min: 0, max: 20_000_000, step: 50_000 },
  { campo: "ro", label: "Reddito operativo", min: -500_000, max: 3_000_000, step: 10_000 },
  { campo: "capInvest", label: "Capitale investito", min: 0, max: 20_000_000, step: 50_000 },
  { campo: "patrNetto", label: "Patrimonio netto", min: 0, max: 10_000_000, step: 20_000 },
  { campo: "utileNetto", label: "Utile netto", min: -300_000, max: 2_000_000, step: 10_000 },
  { campo: "ebitda", label: "EBITDA / MOL", min: -200_000, max: 4_000_000, step: 10_000 },
  { campo: "pfn", label: "Debito finanziario netto (PFN)", min: 0, max: 15_000_000, step: 50_000 },
  {
    campo: "servizioDebito",
    label: "Servizio del debito annuo",
    min: 0,
    max: 2_000_000,
    step: 10_000,
  },
  {
    campo: "flussoCassa",
    label: "Flusso di cassa operativo",
    min: -200_000,
    max: 4_000_000,
    step: 10_000,
  },
];

const PREVISIONALI: Cursore<CampoPrev>[] = [
  {
    campo: "liquiditaIniziale",
    label: "Liquidità iniziale (cassa + c/c)",
    min: 0,
    max: 5_000_000,
    step: 10_000,
  },
  { campo: "entrate6m", label: "Entrate previste 6 mesi", min: 0, max: 10_000_000, step: 20_000 },
  { campo: "uscite6m", label: "Uscite previste 6 mesi", min: 0, max: 10_000_000, step: 20_000 },
  { campo: "debito6m", label: "Debito da servire 6 mesi", min: 0, max: 2_000_000, step: 5_000 },
];

function Riga<T extends string>({
  cursore,
  valore,
  modificato,
  onCambio,
}: {
  cursore: Cursore<T>;
  valore: number;
  modificato: boolean;
  onCambio: (campo: T, valore: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={`sim-${cursore.campo}`} className="text-xs">
          {cursore.label}
        </Label>
        <span
          className={`font-mono nums text-xs ${modificato ? "font-semibold text-primary" : "text-muted-foreground"}`}
        >
          {formatEuro(valore)}
        </span>
      </div>
      <input
        id={`sim-${cursore.campo}`}
        type="range"
        min={cursore.min}
        max={cursore.max}
        step={cursore.step}
        value={Math.max(cursore.min, Math.min(cursore.max, valore))}
        onChange={(e) => onCambio(cursore.campo, Number(e.target.value))}
        className="mt-1.5 w-full accent-primary"
      />
    </div>
  );
}

export function Simulatore({
  dati,
  datiSalvati,
  previsionale,
  previsionaleSalvato,
  onCambio,
  onCambioPrevisionale,
}: {
  dati: DatiBilancio;
  datiSalvati: DatiBilancio;
  previsionale: DatiPrevisionali6M;
  previsionaleSalvato: DatiPrevisionali6M | null;
  onCambio: (campo: CampoStorico, valore: number) => void;
  onCambioPrevisionale: (campo: CampoPrev, valore: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Cursori di simulazione</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Muovi un valore: indicatori, giudizi e punteggio si ricalcolano subito.
      </p>

      <div className="mt-4 space-y-4">
        {STORICI.map((c) => (
          <Riga
            key={c.campo}
            cursore={c}
            valore={dati[c.campo]}
            modificato={dati[c.campo] !== datiSalvati[c.campo]}
            onCambio={onCambio}
          />
        ))}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          Previsionale 6 mesi
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {previsionaleSalvato
            ? "Muovili per simulare il DSCR prospettico."
            : "Questo esercizio non ha dati previsionali salvati: qui puoi comunque provarli."}
        </p>
        <div className="mt-3 space-y-4">
          {PREVISIONALI.map((c) => (
            <Riga
              key={c.campo}
              cursore={c}
              valore={previsionale[c.campo]}
              modificato={
                previsionaleSalvato ? previsionale[c.campo] !== previsionaleSalvato[c.campo] : true
              }
              onCambio={onCambioPrevisionale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
