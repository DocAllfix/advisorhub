import { formatEuro, formatNumero } from "@advisorhub/engine";
import { FileText } from "lucide-react";

import { Contenitore, Occhiello, Titolo2 } from "@/components/base";
import { Giudizio, TESTO_TONO } from "@/components/giudizio";
import { PASSI } from "@/lib/contenuti";
import {
  ANALISI_ESEMPIO,
  BILANCIO_ESEMPIO,
  CLIENTE_ESEMPIO,
  ESERCIZIO_ESEMPIO,
} from "@/lib/esempio";
import { sinteticoDaScore } from "@/lib/fasce";

/**
 * «Come funziona»: tre passi, ciascuno con il suo frammento di prodotto
 * (modello: la fascia dei passi di FormazioneEvalis). Non tre schede uguali:
 * tre colonne sotto un filetto, con contenuti diversi.
 *
 * Il filo che le unisce è la linea della soglia del marchio, e il punto di luce
 * si accende sul secondo passo: è lì che il giudizio arriva.
 */

/** Stessa regola del nome del file nell'applicazione (api/report/[id]/route.ts). */
function nomeFile(ragioneSociale: string, anno: number) {
  const base = ragioneSociale
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return `Analisi_${base || "cliente"}_${anno}.pdf`;
}

function Frammento({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-[0.7rem] border border-bordo bg-superficie p-4" aria-hidden>
      {children}
    </div>
  );
}

function FrammentoCarica() {
  const voci = [
    ["Valore della produzione", BILANCIO_ESEMPIO.valProd],
    ["Reddito operativo", BILANCIO_ESEMPIO.ro],
    ["Posizione finanziaria netta", BILANCIO_ESEMPIO.pfn],
  ] as const;
  return (
    <Frammento>
      <ul className="space-y-2">
        {voci.map(([voce, valore]) => (
          <li
            key={voce}
            className="flex items-baseline justify-between gap-3 border-b border-filetto pb-2 text-sm"
          >
            <span className="text-testo-attenuato">{voce}</span>
            <span className="cifre">{formatEuro(valore)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-testo-attenuato">
        e altre sette grandezze · oppure importa un CSV
      </p>
    </Frammento>
  );
}

function FrammentoGiudizio() {
  const s = sinteticoDaScore(ANALISI_ESEMPIO.score);
  const g = ANALISI_ESEMPIO.giudizi.dscrPro;
  return (
    <Frammento>
      <div className="flex items-end justify-between gap-3">
        <p className={`cifre text-4xl leading-none font-semibold ${TESTO_TONO[s.tone]}`}>
          {ANALISI_ESEMPIO.score}
        </p>
        <span className="text-xs">
          <Giudizio tono={s.tone}>{s.label}</Giudizio>
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-filetto pt-3 text-sm">
        <span className="text-testo-attenuato">
          DSCR 6M{" "}
          <span className="cifre text-critico-testo">
            {formatNumero(ANALISI_ESEMPIO.indicatori.dscrProspettico!, 2)}
          </span>
        </span>
        <span className="text-xs">
          <Giudizio tono={g.tone}>{g.label}</Giudizio>
        </span>
      </div>
    </Frammento>
  );
}

function FrammentoConsegna() {
  return (
    <Frammento>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[0.4rem] bg-tonale">
          <FileText className="size-5 text-testo-attenuato" />
        </span>
        <span className="min-w-0">
          <span className="cifre block text-[0.8125rem] leading-snug break-all">
            {nomeFile(CLIENTE_ESEMPIO, ESERCIZIO_ESEMPIO)}
          </span>
          <span className="block text-xs text-testo-attenuato">Per il cliente e per la banca</span>
        </span>
      </div>
    </Frammento>
  );
}

export function Passi() {
  const frammenti = [
    <FrammentoCarica key="1" />,
    <FrammentoGiudizio key="2" />,
    <FrammentoConsegna key="3" />,
  ];
  return (
    <section
      id="come-funziona"
      aria-labelledby="titolo-passi"
      className="scroll-mt-20 border-t border-filetto"
    >
      <Contenitore className="py-24 md:py-28">
        <div className="comparsa max-w-[40rem]">
          <Occhiello>{PASSI.occhiello}</Occhiello>
          <Titolo2 id="titolo-passi">{PASSI.titolo}</Titolo2>
        </div>

        <div className="relative mt-14">
          {/*
           * Il filo della soglia, solo da schermo largo: una linea sopra le tre
           * colonne e un punto di luce sul passo del giudizio. Decorativo.
           */}
          <div
            className="absolute top-0 right-0 left-0 hidden h-px bg-bordo lg:block"
            aria-hidden
          />
          <span
            className="absolute top-0 left-1/2 hidden size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accento lg:block"
            aria-hidden
          />

          <ol className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-10">
            {PASSI.passi.map((p, i) => (
              <li
                key={p.titolo}
                className="comparsa min-w-0 border-t border-bordo pt-8 lg:border-t-0 lg:pt-10"
              >
                <span className="cifre text-sm text-testo-attenuato" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl leading-snug font-semibold tracking-[-0.01em]">
                  {p.titolo}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-[1.6] text-testo-attenuato">
                  {p.testo}
                </p>
                {frammenti[i]}
              </li>
            ))}
          </ol>
        </div>
      </Contenitore>
    </section>
  );
}
