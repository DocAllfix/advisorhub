"use client";

import { formatEuro, type DatiBilancio, type DatiPrevisionali6M } from "@finbeacon/engine";
import { useState } from "react";

import { Label } from "@/components/ui/label";

type CampoStorico = keyof DatiBilancio;
type CampoPrev = keyof DatiPrevisionali6M;

type Cursore<T> = { campo: T; label: string; /** consente valori negativi */ negativo?: boolean };

/**
 * I dieci valori di bilancio, raggruppati con la stessa tassonomia del form
 * "Nuovo esercizio": chi ha caricato i dati ritrova qui le stesse categorie,
 * invece di una lista piatta di quattordici controlli.
 */
const GRUPPI: { titolo: string; cursori: Cursore<CampoStorico>[] }[] = [
  {
    titolo: "Conto economico",
    cursori: [
      { campo: "valProd", label: "Valore della produzione" },
      { campo: "fatturato", label: "Fatturato" },
      { campo: "ro", label: "Reddito operativo", negativo: true },
      { campo: "ebitda", label: "EBITDA / MOL", negativo: true },
      { campo: "utileNetto", label: "Utile netto", negativo: true },
    ],
  },
  {
    titolo: "Struttura patrimoniale",
    cursori: [
      { campo: "capInvest", label: "Capitale investito" },
      { campo: "patrNetto", label: "Patrimonio netto" },
    ],
  },
  {
    titolo: "Struttura finanziaria",
    cursori: [
      { campo: "pfn", label: "Debito finanziario netto (PFN)" },
      { campo: "servizioDebito", label: "Servizio del debito annuo" },
      { campo: "flussoCassa", label: "Flusso di cassa operativo", negativo: true },
    ],
  },
];

const PREVISIONALI: Cursore<CampoPrev>[] = [
  { campo: "liquiditaIniziale", label: "Liquidità iniziale (cassa + c/c)" },
  { campo: "entrate6m", label: "Entrate previste 6 mesi" },
  { campo: "uscite6m", label: "Uscite previste 6 mesi" },
  { campo: "debito6m", label: "Debito da servire 6 mesi" },
];

/** Arrotonda a due cifre significative, così lo step non produce numeri sporchi. */
function passo(ampiezza: number): number {
  if (ampiezza <= 0) return 1000;
  const ordine = Math.pow(10, Math.floor(Math.log10(ampiezza)) - 2);
  return Math.max(ordine, 1);
}

/**
 * Estremi del cursore calcolati sul valore salvato invece che su costanti
 * globali: con un tetto fisso a 20 milioni, su un cliente da 3 milioni la corsa
 * utile occupava il 5% della barra e un pixel valeva mezzo milione.
 */
function estremi(valoreSalvato: number, ammetteNegativi: boolean) {
  const riferimento = Math.abs(valoreSalvato) || 100_000;
  const max = Math.ceil((riferimento * 2) / passo(riferimento)) * passo(riferimento);
  const min = ammetteNegativi ? -Math.round(max / 2) : 0;
  return { min, max, step: passo(max - min) };
}

function Riga<T extends string>({
  cursore,
  valore,
  valoreSalvato,
  modificato,
  onCambio,
}: {
  cursore: Cursore<T>;
  valore: number;
  valoreSalvato: number;
  modificato: boolean;
  onCambio: (campo: T, valore: number) => void;
}) {
  const { min, max, step } = estremi(valoreSalvato, Boolean(cursore.negativo));
  // Mentre si digita si tiene il testo grezzo, così "-" e i campi vuoti non
  // vengono riscritti a 0 sotto le dita.
  const [inDigitazione, setInDigitazione] = useState<string | null>(null);
  const [avviso, setAvviso] = useState<string | null>(null);
  const id = `sim-${cursore.campo}`;
  const idAvviso = `${id}-avviso`;

  /**
   * Il campo è vincolato agli stessi estremi del cursore: senza clamp si poteva
   * scrivere un valore fuori scala e ottenere un "Ottimo" su un ROS del
   * 33.000%, cioè un numero da mostrare a un cliente senza che nulla avvertisse.
   */
  function scrivi(testo: string) {
    setInDigitazione(testo);
    if (testo.trim() === "" || testo.trim() === "-") return;
    const pulito = testo.replace(/[^\d-]/g, "");
    const n = Number(pulito);
    if (pulito === "" || !Number.isFinite(n)) {
      setAvviso("Serve un numero.");
      return;
    }
    const limitato = Math.max(min, Math.min(max, n));
    setAvviso(limitato !== n ? `Oltre il simulabile: portato a ${formatEuro(limitato)}.` : null);
    onCambio(cursore.campo, limitato);
  }

  return (
    <div data-tour={cursore.campo === "valProd" ? "cursore" : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-xs">
          {cursore.label}
        </Label>
        <input
          type="text"
          inputMode="numeric"
          aria-label={`${cursore.label}, valore in euro`}
          aria-invalid={avviso !== null}
          aria-describedby={avviso ? idAvviso : undefined}
          value={inDigitazione ?? String(Math.round(valore))}
          onChange={(e) => scrivi(e.target.value)}
          onBlur={() => {
            setInDigitazione(null);
            setAvviso(null);
          }}
          className={`nums w-32 rounded border bg-transparent px-1 py-0.5 text-right font-mono text-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none ${
            avviso
              ? "border-danger text-danger-foreground"
              : `border-transparent hover:border-input ${modificato ? "font-semibold text-primary" : "text-muted-foreground"}`
          }`}
        />
      </div>
      {avviso && (
        <p
          id={idAvviso}
          role="alert"
          className="mt-1 text-right text-[10px] text-danger-foreground"
        >
          {avviso}
        </p>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.max(min, Math.min(max, valore))}
        onChange={(e) => onCambio(cursore.campo, Number(e.target.value))}
        className="mt-1.5 w-full accent-primary"
      />
      {/* Il valore salvato resta il riferimento di lettura del cursore */}
      <p className="nums mt-0.5 text-right font-mono text-[10px] text-muted-foreground">
        salvato {formatEuro(valoreSalvato)}
      </p>
    </div>
  );
}

export function Simulatore({
  dati,
  datiSalvati,
  previsionale,
  previsionaleSalvato,
  dscrProspettico,
  onCambio,
  onCambioPrevisionale,
}: {
  dati: DatiBilancio;
  datiSalvati: DatiBilancio;
  previsionale: DatiPrevisionali6M;
  previsionaleSalvato: DatiPrevisionali6M | null;
  /** Mostrato accanto ai cursori previsionali, che altrimenti comandano un dato fuori campo. */
  dscrProspettico: { valore: number | null; label: string; colore: string };
  onCambio: (campo: CampoStorico, valore: number) => void;
  onCambioPrevisionale: (campo: CampoPrev, valore: number) => void;
}) {
  const basePrev = previsionaleSalvato ?? previsionale;

  return (
    <div data-tour="simulatore" className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Cursori di simulazione</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Muovi un valore o scrivilo: indicatori, giudizi e punteggio si ricalcolano subito.
      </p>
      {/* Il pannello scorre: dire quanti sono e come sono divisi evita che i
          quattro previsionali in fondo restino invisibili. */}
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        14 valori in 4 gruppi, previsionale compreso.
      </p>

      {GRUPPI.map((g, i) => (
        <section key={g.titolo} className={i === 0 ? "mt-4" : "mt-5 border-t border-border pt-4"}>
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">
            {g.titolo}
          </p>
          <div className="mt-3 space-y-4">
            {g.cursori.map((c) => (
              <Riga
                key={c.campo}
                cursore={c}
                valore={dati[c.campo]}
                valoreSalvato={datiSalvati[c.campo]}
                modificato={dati[c.campo] !== datiSalvati[c.campo]}
                onCambio={onCambio}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-5 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">
            Previsionale 6 mesi
          </p>
          {/* Il DSCR che questi cursori comandano vive a fondo pagina: qui c'è
              la sua lettura, altrimenti si muoverebbero alla cieca. */}
          <p
            data-tour="dscr-sim"
            className="nums font-mono text-sm font-semibold"
            style={{ color: dscrProspettico.colore }}
          >
            {dscrProspettico.valore === null
              ? "n.d."
              : dscrProspettico.valore >= 99
                ? "∞"
                : dscrProspettico.valore.toFixed(2).replace(".", ",")}
            <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">
              DSCR 6M · {dscrProspettico.label}
            </span>
          </p>
        </div>
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
              valoreSalvato={basePrev[c.campo]}
              modificato={
                previsionaleSalvato ? previsionale[c.campo] !== previsionaleSalvato[c.campo] : true
              }
              onCambio={onCambioPrevisionale}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
