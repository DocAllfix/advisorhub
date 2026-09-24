import { ANALISI_ESEMPIO, CLIENTE_ESEMPIO, ESERCIZIO_ESEMPIO, STUDIO_ESEMPIO } from "@/lib/esempio";
import { sinteticoDaScore } from "@/lib/fasce";
import { righeIndicatori } from "@/lib/indicatori";

import { Giudizio, TESTO_TONO } from "./giudizio";

/**
 * Una pagina del report, come esce dal generatore del prodotto: testata con il
 * nome dello studio, sintesi, i sette indicatori con valore, soglia e giudizio.
 * Sempre su carta, anche dentro un momento notte (DESIGN.md: il report va su
 * carta, al cliente e alla banca). Dati del cliente di esempio, dal motore.
 */
export function PaginaReport() {
  const a = ANALISI_ESEMPIO;
  const sintetico = sinteticoDaScore(a.score);
  const righe = righeIndicatori(a);

  return (
    <div className="carta @container rounded-[0.5rem] border border-bordo bg-superficie shadow-[0_1.5rem_3rem_-1.5rem_oklch(0.22_0.012_250/0.35)]">
      <div className="px-[clamp(1.25rem,5cqw,2.25rem)] pt-[clamp(1.25rem,5cqw,2rem)] pb-[clamp(1.25rem,5cqw,2.25rem)]">
        <div className="flex items-center justify-between gap-4 border-b border-filetto pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-7 place-items-center rounded-[0.3rem] bg-testo text-xs font-semibold text-superficie"
              aria-hidden
            >
              {STUDIO_ESEMPIO.slice(0, 1)}
            </span>
            <span className="text-sm font-semibold">{STUDIO_ESEMPIO}</span>
          </div>
          <span className="etichetta text-testo-attenuato">Esercizio {ESERCIZIO_ESEMPIO}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="etichetta text-testo-attenuato">Analisi economico-finanziaria</p>
            <p className="mt-1.5 text-lg leading-tight font-semibold">{CLIENTE_ESEMPIO}</p>
          </div>
          <div className="text-right">
            <p
              className={`cifre text-4xl leading-none font-semibold ${TESTO_TONO[sintetico.tone]}`}
            >
              {a.score}
            </p>
            <p className="mt-1 text-xs text-testo-attenuato">{a.sintesi.titolo}</p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <caption className="sr-only">
            Indicatori del cliente di esempio, con valore, riferimento e giudizio
          </caption>
          <thead>
            <tr className="border-b border-bordo text-left">
              <th scope="col" className="etichetta pb-2 font-medium text-testo-attenuato">
                Indicatore
              </th>
              <th
                scope="col"
                className="etichetta pb-2 text-right font-medium text-testo-attenuato"
              >
                Valore
              </th>
              <th
                scope="col"
                className="etichetta hidden pb-2 pl-4 text-left font-medium text-testo-attenuato @[26rem]:table-cell"
              >
                Riferimento
              </th>
              <th
                scope="col"
                className="etichetta pb-2 pl-4 text-left font-medium text-testo-attenuato"
              >
                Giudizio
              </th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.chiave} className="border-b border-filetto">
                <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                  <span className="font-semibold">{r.titolo}</span>
                  <span className="hidden text-testo-attenuato @[30rem]:inline">
                    {" "}
                    · {r.descrizione}
                  </span>
                </th>
                <td className="cifre py-2.5 text-right whitespace-nowrap">{r.valore}</td>
                <td className="cifre hidden py-2.5 pl-4 text-xs whitespace-nowrap text-testo-attenuato @[26rem]:table-cell">
                  {r.soglia}
                </td>
                <td className="py-2.5 pl-4 text-xs">
                  <Giudizio tono={r.giudizio.tone}>{r.giudizio.label}</Giudizio>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
