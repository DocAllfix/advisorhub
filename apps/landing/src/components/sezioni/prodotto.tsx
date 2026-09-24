import { ArrowDownToLine } from "lucide-react";

import { Contenitore, Occhiello, Paragrafo, Titolo2 } from "@/components/base";
import { PaginaReport } from "@/components/pagina-report";
import { FUNZIONI, REPORT } from "@/lib/contenuti";

import { reportEsempioPresente } from "./apertura";

/**
 * «Cosa fa»: righe, non una griglia di schede tutte uguali. Un prospetto che si
 * legge dall'alto in basso, con l'indice in mono come le righe di un bilancio.
 */
export function Funzioni() {
  return (
    <section id="cosa-fa" aria-labelledby="titolo-funzioni" className="scroll-mt-20">
      <Contenitore className="grid gap-10 py-24 md:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-16">
        <div className="comparsa">
          <Occhiello>Cosa fa</Occhiello>
          <Titolo2 id="titolo-funzioni">Lo studio che guarda avanti, non solo indietro.</Titolo2>
          <Paragrafo className="mt-5 max-w-[34rem]">
            Il bilancio racconta l&apos;anno passato. FinBeacon lo legge insieme alla tesoreria dei
            prossimi sei mesi, e mette ogni cliente al suo posto.
          </Paragrafo>
        </div>
        <ol className="border-t border-bordo">
          {FUNZIONI.map((f, i) => (
            <li
              key={f.titolo}
              className="comparsa grid gap-x-6 gap-y-1.5 border-b border-filetto py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)] md:grid-cols-[2.5rem_minmax(0,0.9fr)_minmax(0,1.1fr)]"
            >
              <span className="cifre pt-0.5 text-sm text-testo-attenuato" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[1.0625rem] leading-snug font-semibold">{f.titolo}</h3>
              <p className="text-[0.9375rem] leading-[1.6] text-testo-attenuato sm:col-start-2 md:col-start-auto">
                {f.testo}
              </p>
            </li>
          ))}
        </ol>
      </Contenitore>
    </section>
  );
}

/** Il secondo pilastro: gli artefatti. Il report che il commercialista consegna. */
export function Report() {
  return (
    <section
      id="report"
      aria-labelledby="titolo-report"
      className="scroll-mt-20 border-t border-filetto bg-tonale"
    >
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
