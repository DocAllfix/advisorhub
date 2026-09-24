"use client";

import { analizza, formatEuro, formatNumero, SOGLIE_GIUDIZIO } from "@advisorhub/engine";
import { useId, useMemo, useState } from "react";

import { BILANCIO_ESEMPIO, PREVISIONALE_ESEMPIO } from "@/lib/esempio";
import { sinteticoDaScore } from "@/lib/fasce";
import { righeIndicatori } from "@/lib/indicatori";

import { Giudizio, TESTO_TONO } from "./giudizio";

/**
 * Il motore di FinBeacon, lo stesso dell'applicazione, nel browser. Le tre leve
 * sono ingressi DIRETTI del motore, senza derivazioni inventate: il resto del
 * bilancio resta quello del cliente di esempio, e la pagina lo dice.
 *
 * Lo stato iniziale è reso dal server con i valori di partenza, quindi l'HTML
 * contiene già punteggio e giudizi veri (nessun «0» per chi non esegue
 * JavaScript). Nessun calcolo qui: solo `analizza()`.
 */
const LEVE = [
  {
    chiave: "liquidita",
    etichetta: "Liquidità iniziale",
    aiuto: "Cassa e conti correnti all'inizio dei sei mesi",
    min: 0,
    max: 300_000,
    passo: 1_000,
    partenza: PREVISIONALE_ESEMPIO.liquiditaIniziale,
  },
  {
    chiave: "ro",
    etichetta: "Reddito operativo",
    aiuto: "Risultato della gestione caratteristica",
    min: -100_000,
    max: 500_000,
    passo: 5_000,
    partenza: BILANCIO_ESEMPIO.ro,
  },
  {
    chiave: "pfn",
    etichetta: "Posizione finanziaria netta",
    aiuto: "Debito finanziario al netto della liquidità",
    min: 0,
    max: 4_000_000,
    passo: 50_000,
    partenza: BILANCIO_ESEMPIO.pfn,
  },
] as const;

type Chiave = (typeof LEVE)[number]["chiave"];
const PARTENZA = Object.fromEntries(LEVE.map((l) => [l.chiave, l.partenza])) as Record<
  Chiave,
  number
>;

export function Anteprima() {
  const [valori, setValori] = useState<Record<Chiave, number>>(PARTENZA);
  const base = useId();

  const analisi = useMemo(
    () =>
      analizza(
        { ...BILANCIO_ESEMPIO, ro: valori.ro, pfn: valori.pfn },
        { ...PREVISIONALE_ESEMPIO, liquiditaIniziale: valori.liquidita },
      ),
    [valori],
  );

  const sintetico = sinteticoDaScore(analisi.score);
  const dscr6m = analisi.indicatori.dscrProspettico;
  const righe = righeIndicatori(analisi, ["ros", "roi", "gi", "dscr"]);
  const modificato = LEVE.some((l) => valori[l.chiave] !== l.partenza);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="etichetta mb-6 text-testo-attenuato">Le leve</legend>
        <div className="space-y-8">
          {LEVE.map((l) => {
            const id = `${base}-${l.chiave}`;
            return (
              <div key={l.chiave}>
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor={id} className="text-[0.9375rem] font-semibold">
                    {l.etichetta}
                  </label>
                  <output htmlFor={id} className="cifre text-[0.9375rem] font-semibold">
                    {formatEuro(valori[l.chiave])}
                  </output>
                </div>
                <p id={`${id}-aiuto`} className="mt-0.5 text-[0.8125rem] text-testo-attenuato">
                  {l.aiuto}
                </p>
                <input
                  id={id}
                  type="range"
                  min={l.min}
                  max={l.max}
                  step={l.passo}
                  value={valori[l.chiave]}
                  aria-describedby={`${id}-aiuto`}
                  aria-valuetext={formatEuro(valori[l.chiave])}
                  onChange={(e) => setValori((v) => ({ ...v, [l.chiave]: Number(e.target.value) }))}
                  className="leva mt-3 w-full"
                />
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => setValori(PARTENZA)}
            disabled={!modificato}
            className="inline-flex h-10 items-center rounded-[var(--radius-pulsante)] border border-bordo px-4 text-sm font-medium transition-transform duration-150 ease-[var(--ease-uscita)] enabled:hover:-translate-y-px disabled:cursor-default disabled:border-filetto disabled:text-testo-attenuato"
          >
            Torna ai valori di partenza
          </button>
          <p className="text-[0.8125rem] text-testo-attenuato">
            Il resto del bilancio resta quello del cliente di esempio.
          </p>
        </div>
      </fieldset>

      <div
        aria-live="polite"
        className="rounded-[0.8rem] border border-bordo bg-superficie p-6 sm:p-8"
      >
        <div className="flex items-end justify-between gap-6 border-b border-filetto pb-6">
          <div>
            <p className="etichetta text-testo-attenuato">Punteggio di sintesi</p>
            <p
              className={`cifre mt-2 text-6xl leading-none font-semibold ${TESTO_TONO[sintetico.tone]}`}
            >
              {analisi.score}
            </p>
          </div>
          <div className="text-right">
            <Giudizio tono={sintetico.tone}>{sintetico.label}</Giudizio>
            <p className="mt-2 text-[0.8125rem] text-testo-attenuato">{analisi.sintesi.titolo}</p>
          </div>
        </div>

        <div className="border-b border-filetto py-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[0.9375rem] font-semibold">
              DSCR prospettico · 6 mesi
              <span className="block text-[0.8125rem] font-normal text-testo-attenuato">
                soglia {formatNumero(SOGLIE_GIUDIZIO.dscr6m.soglia, 2)} · art. 3 CCII
              </span>
            </p>
            <p
              className={`cifre text-3xl font-semibold ${TESTO_TONO[analisi.giudizi.dscrPro.tone]}`}
            >
              {dscr6m === null ? "n.d." : dscr6m >= 99 ? "∞" : formatNumero(dscr6m, 2)}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Giudizio tono={analisi.giudizi.dscrPro.tone}>{analisi.giudizi.dscrPro.label}</Giudizio>
            <p className="text-[0.8125rem] text-testo-attenuato">{analisi.giudizi.dscrPro.testo}</p>
          </div>
        </div>

        <ul>
          {righe.map((r) => (
            <li
              key={r.chiave}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-filetto py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_6.5rem_10.5rem]"
            >
              <span className="min-w-0 text-[0.9375rem]">
                <span className="font-semibold">{r.titolo}</span>
                <span className="block truncate text-[0.8125rem] text-testo-attenuato">
                  {r.soglia}
                </span>
              </span>
              <span className="cifre text-right text-[0.9375rem]">{r.valore}</span>
              <span className="col-span-2 text-xs sm:col-span-1">
                <Giudizio tono={r.giudizio.tone}>{r.giudizio.label}</Giudizio>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
