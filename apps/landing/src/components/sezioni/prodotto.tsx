import { ArrowDownToLine } from "lucide-react";

import {
  ArtefattoDscr,
  ArtefattoIndicatori,
  ArtefattoPortafoglio,
  ArtefattoReport,
  ArtefattoScadenze,
  ArtefattoSimulatore,
} from "@/components/artefatti";
import { Contenitore, Occhiello, Paragrafo, Titolo2 } from "@/components/base";
import { GiroProdotto } from "@/components/giro-prodotto";
import { PaginaReport } from "@/components/pagina-report";
import { FUNZIONI, REPORT } from "@/lib/contenuti";

import { reportEsempioPresente } from "./apertura";

/**
 * «Cosa fa»: un giro guidato del prodotto, non un elenco. Ogni funzione ha il
 * suo pezzo di prodotto accanto, calcolato dal motore (modello: Mercury). Il
 * titolo resta a tutta larghezza sopra, così il giro ha tutto lo spazio.
 */
export function Funzioni() {
  const pannelli = [
    <ArtefattoPortafoglio key="portafoglio" />,
    <ArtefattoIndicatori key="indicatori" />,
    <ArtefattoDscr key="dscr" />,
    <ArtefattoSimulatore key="simulatore" />,
    <ArtefattoReport key="report" />,
    <ArtefattoScadenze key="scadenze" />,
  ];
  return (
    <section id="cosa-fa" aria-labelledby="titolo-funzioni" className="scroll-mt-20 bg-tonale">
      <Contenitore className="py-24 md:py-32">
        <div className="comparsa grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <Occhiello>Cosa fa</Occhiello>
            <Titolo2 id="titolo-funzioni">Lo studio che guarda avanti, non solo indietro.</Titolo2>
          </div>
          <Paragrafo className="max-w-[34rem] self-end">
            Il bilancio racconta l&apos;anno passato. FinBeacon lo legge insieme alla tesoreria dei
            prossimi sei mesi, e mette ogni cliente al suo posto. Apri una voce per vederla al
            lavoro.
          </Paragrafo>
        </div>
        <div className="mt-14">
          <GiroProdotto voci={FUNZIONI} pannelli={pannelli} />
        </div>
      </Contenitore>
    </section>
  );
}

/** Il secondo pilastro: gli artefatti. Il report che il commercialista consegna. */
export function Report() {
  return (
    <section id="report" aria-labelledby="titolo-report" className="scroll-mt-20">
      <Contenitore className="grid items-center gap-12 py-24 md:py-32 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        <div className="comparsa">
          <Occhiello>{REPORT.occhiello}</Occhiello>
          <Titolo2 id="titolo-report">{REPORT.titolo}</Titolo2>
          <Paragrafo className="mt-5 max-w-[36rem]">{REPORT.testo}</Paragrafo>
          <dl className="mt-8 border-t border-bordo">
            {REPORT.destinatari.map((d) => (
              <div
                key={d.chi}
                className="grid gap-1 border-b border-filetto py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="text-[0.9375rem] font-semibold">{d.chi}</dt>
                <dd className="text-[0.9375rem] text-testo-attenuato">{d.cosa}</dd>
              </div>
            ))}
          </dl>
          {reportEsempioPresente && (
            <a
              href="/report-esempio.pdf"
              className="mt-7 inline-flex items-center gap-2 py-1 text-[0.9375rem] font-medium underline decoration-bordo underline-offset-4 hover:decoration-testo"
            >
              <ArrowDownToLine className="size-4" aria-hidden />
              Scarica un report d&apos;esempio (PDF)
            </a>
          )}
        </div>
        <div className="comparsa lg:pl-4">
          <PaginaReport />
          <p className="mt-3 text-right text-xs text-testo-attenuato">
            Prima pagina di un report, cliente di esempio.
          </p>
        </div>
      </Contenitore>
    </section>
  );
}
