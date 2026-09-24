import { formatNumero, SOGLIE_GIUDIZIO } from "@finbeacon/engine";

import {
  ANALISI_ESEMPIO,
  CLIENTE_ESEMPIO,
  ESERCIZIO_ESEMPIO,
  SERIE_DSCR6M,
  SOGLIA_DSCR6M,
  STUDIO_ESEMPIO,
} from "@/lib/esempio";
import { sinteticoDaScore } from "@/lib/fasce";

import { GraficoSoglia } from "./grafico-soglia";
import { Giudizio, SEGNO_TONO, TESTO_TONO } from "./giudizio";

/**
 * IL DECK — ciò che il prodotto produce, non una fotografia dell'interfaccia.
 * Tre artefatti che il commercialista ha davvero in mano: la copertina del
 * report che consegna, la scheda del DSCR prospettico e la riga del cliente nel
 * cruscotto, com'è nell'applicazione.
 *
 * Modello: `evalisdeck/src/components/landing/hero-deck.tsx`. Misure in `em`,
 * radice proporzionale alla larghezza del contenitore (`cqw`): la composizione
 * si rimpicciolisce intera invece di tagliarsi.
 *
 * Due composizioni, scelte dalla larghezza DEL CONTENITORE (container query):
 * - da 30rem in su, i tre artefatti sovrapposti;
 * - sotto, la sola scheda DSCR. Il Deck intero su un telefono scenderebbe a
 *   6 px di testo: un solo artefatto leggibile racconta più di tre illeggibili.
 *
 * Tutti i numeri escono dal motore sul cliente di esempio (`lib/esempio.ts`).
 * La storia è quella del prodotto: il punteggio annuale dice «migliorabile»,
 * la tesoreria a sei mesi dice già «critico».
 */

/** 10px alla larghezza di progetto (480px, cioè 48em), meno sotto. */
const BASE_DECK = "min(10px, 2.083cqw)";
/** La scheda da sola: 10px a 300px (30em). */
const BASE_SCHEDA = "min(11px, 3.333cqw)";

const OMBRA = "shadow-[0_1.4em_3em_-1.2em_oklch(0.06_0.02_250/0.75)]";

export function Deck() {
  const a = ANALISI_ESEMPIO;
  const sintetico = sinteticoDaScore(a.score);
  const dscr6m = a.indicatori.dscrProspettico!;
  const giudizio6m = a.giudizi.dscrPro;
  const primo = SERIE_DSCR6M[0]!;

  return (
    <div className="@container w-full">
      <p className="sr-only">
        Esempio con dati inventati. Per {CLIENTE_ESEMPIO} il punteggio annuale è {a.score} su 100,
        fascia {sintetico.label.toLowerCase()}. Il DSCR prospettico a sei mesi è sceso da{" "}
        {formatNumero(primo.dscr6m, 2)} a {formatNumero(dscr6m, 2)}, sotto la soglia di{" "}
        {formatNumero(SOGLIA_DSCR6M, 2)} dell&apos;articolo 3 del Codice della crisi: giudizio{" "}
        {giudizio6m.label.toLowerCase()}.
      </p>

      {/* Contenitore stretto: la sola scheda. */}
      <div className="@min-[30rem]:hidden" style={{ fontSize: BASE_SCHEDA }} aria-hidden>
        <SchedaDscr />
      </div>

      {/* Contenitore largo: i tre artefatti. */}
      <div
        className="relative mx-auto hidden h-[40.5em] w-[48em] select-none @min-[30rem]:block"
        style={{ fontSize: BASE_DECK }}
        aria-hidden
      >
        {/* 1. La copertina del report, su carta. Il testo resta nella parte che la scheda non copre. */}
        <div
          className={`carta absolute top-[0.8em] left-[0.2em] z-0 flex h-[29em] w-[20em] -rotate-[3.5deg] flex-col rounded-[0.6em] border border-bordo bg-superficie px-[1.8em] pt-[1.8em] pb-[1.7em] ${OMBRA}`}
        >
          <div className="flex items-center gap-[0.6em]">
            <span className="grid size-[2em] shrink-0 place-items-center rounded-[0.35em] bg-testo text-[1em] font-semibold text-superficie">
              {STUDIO_ESEMPIO.slice(0, 1)}
            </span>
            <span className="max-w-[11em] text-[1.05em] leading-tight font-semibold">
              {STUDIO_ESEMPIO}
            </span>
          </div>

          <div className="mt-[3.2em] max-w-[14.2em] border-t border-filetto pt-[1.4em]">
            <p className="text-[0.9em] font-medium tracking-[0.14em] text-testo-attenuato uppercase">
              Analisi economico-finanziaria
            </p>
            <p className="mt-[0.6em] text-[1.75em] leading-[1.12] font-semibold tracking-[-0.015em]">
              {CLIENTE_ESEMPIO}
            </p>
            <p className="mt-[0.5em] text-[1.05em] text-testo-attenuato">
              Esercizio {ESERCIZIO_ESEMPIO}
            </p>
          </div>

          <div className="mt-auto max-w-[14.2em] border-t border-filetto pt-[1.2em]">
            <p className="text-[0.85em] font-medium tracking-[0.14em] text-testo-attenuato uppercase">
              Punteggio di sintesi
            </p>
            <p
              className={`cifre mt-[0.2em] text-[3.4em] leading-none font-semibold ${TESTO_TONO[sintetico.tone]}`}
            >
              {a.score}
            </p>
            <p className="mt-[0.4em] text-[1.05em] text-testo-attenuato">{a.sintesi.titolo}</p>
          </div>
        </div>

        {/* 2. La scheda del DSCR prospettico: il motivo della soglia. */}
        <div className="absolute top-[3.2em] left-[17.8em] z-10 w-[30.2em]">
          <SchedaDscr ombra />
        </div>

        {/* 3. La riga del cruscotto, com'è nell'applicazione. */}
        <RigaCruscotto />
      </div>
    </div>
  );
}

export function SchedaDscr({ ombra = false }: { ombra?: boolean }) {
  const a = ANALISI_ESEMPIO;
  const dscr6m = a.indicatori.dscrProspettico!;
  const giudizio6m = a.giudizi.dscrPro;
  return (
    <div
      className={`rounded-[0.8em] border border-bordo bg-superficie p-[1.8em] ${ombra ? OMBRA : ""}`}
    >
      <div className="flex items-start justify-between gap-[1em]">
        <div>
          <p className="text-[1em] font-medium tracking-[0.12em] text-testo-attenuato uppercase">
            DSCR prospettico · 6 mesi
          </p>
          <p className="mt-[0.4em] text-[1.1em] text-testo-attenuato">
            soglia {formatNumero(SOGLIA_DSCR6M, 2)} · art. 3 CCII
          </p>
        </div>
        <p className="cifre text-[3.4em] leading-none font-semibold text-critico-testo">
          {formatNumero(dscr6m, 2)}
        </p>
      </div>

      <div className="mt-[1.5em] text-testo">
        <GraficoSoglia valori={SERIE_DSCR6M.map((r) => r.dscr6m)} soglia={SOGLIA_DSCR6M} animato />
        <div className="mt-[0.5em] flex justify-between text-[1em] text-testo-attenuato">
          <span>{SERIE_DSCR6M[0]!.mese}</span>
          <span>{SERIE_DSCR6M.at(-1)!.mese}</span>
        </div>
      </div>

      <div className="mt-[1.3em] border-t border-filetto pt-[1.3em]">
        <div className="flex flex-wrap items-center gap-[0.8em]">
          <span className="text-[1.15em]">
            <Giudizio tono={giudizio6m.tone}>{giudizio6m.label}</Giudizio>
          </span>
          <p className="text-[1.15em] leading-snug">{giudizio6m.testo}</p>
        </div>
        <p className="mt-[0.7em] text-[1.1em] leading-snug text-testo-attenuato">
          {giudizio6m.azione}
        </p>
      </div>
    </div>
  );
}

function RigaCruscotto() {
  const a = ANALISI_ESEMPIO;
  const sintetico = sinteticoDaScore(a.score);
  const dscr = a.indicatori.dscr!;
  const dscr6m = a.indicatori.dscrProspettico!;
  const dscrSotto = dscr < SOGLIE_GIUDIZIO.dscr.soglia;
  const dscr6mSotto = dscr6m < SOGLIA_DSCR6M;
  return (
    <div
      className={`absolute top-[33.6em] left-[2em] z-20 grid w-[44em] grid-cols-[3em_minmax(0,1fr)_4.5em_auto] items-center gap-[1.2em] rounded-[0.7em] border border-bordo bg-tonale px-[1.5em] py-[1.1em] ${OMBRA}`}
    >
      <p className={`cifre text-right text-[1.6em] font-semibold ${TESTO_TONO[sintetico.tone]}`}>
        {a.score}
      </p>
      <div className="min-w-0">
        <p className="truncate text-[1.2em] font-medium">{CLIENTE_ESEMPIO}</p>
        <p className="text-[1.05em] whitespace-nowrap text-testo-attenuato">
          Esercizio {ESERCIZIO_ESEMPIO}
          {(dscrSotto || dscr6mSotto) && (
            <span className="cifre">
              {" · "}
              {dscrSotto && `DSCR ${formatNumero(dscr, 2)}`}
              {dscrSotto && dscr6mSotto && " · "}
              {dscr6mSotto && (
                <span className="text-critico-testo">6M {formatNumero(dscr6m, 2)}</span>
              )}
            </span>
          )}
        </p>
      </div>
      <span className="h-[0.4em] w-full rounded-full bg-fondo">
        <span
          className={`block h-full rounded-full ${SEGNO_TONO[sintetico.tone]}`}
          style={{ width: `${a.score}%` }}
        />
      </span>
      <span className="text-[1.1em]">
        <Giudizio tono={sintetico.tone}>{sintetico.label}</Giudizio>
      </span>
    </div>
  );
}
