import { ChevronDown } from "lucide-react";

import { Anteprima } from "@/components/anteprima";
import { Contenitore, Occhiello, Paragrafo, Titolo2 } from "@/components/base";
import { ANTEPRIMA, DOMANDE, METODO, RISERVATEZZA } from "@/lib/contenuti";

/** Il secondo momento notte: il motore vero, da provare. */
export function SezioneAnteprima() {
  return (
    <section id="anteprima" aria-labelledby="titolo-anteprima" className="notte scroll-mt-20">
      <Contenitore className="py-24 md:py-32">
        <div className="comparsa max-w-[40rem]">
          <Occhiello>{ANTEPRIMA.occhiello}</Occhiello>
          <Titolo2 id="titolo-anteprima">{ANTEPRIMA.titolo}</Titolo2>
          <Paragrafo className="mt-5">{ANTEPRIMA.testo}</Paragrafo>
        </div>
        <div className="mt-14">
          <Anteprima />
        </div>
      </Contenitore>
    </section>
  );
}

/**
 * Il posto della «prova sociale», che al lancio non esiste: niente loghi né
 * testimonianze inventate. La fiducia si costruisce con ciò che si può
 * verificare. Il titolo resta fermo mentre si legge l'elenco.
 */
export function Metodo() {
  return (
    <section id="metodo" aria-labelledby="titolo-metodo" className="scroll-mt-20">
      <Contenitore className="grid gap-10 py-24 md:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Occhiello>{METODO.occhiello}</Occhiello>
          <Titolo2 id="titolo-metodo">{METODO.titolo}</Titolo2>
          <Paragrafo className="mt-5 max-w-[30rem]">{METODO.testo}</Paragrafo>
        </div>
        <ol className="border-t border-bordo">
          {METODO.punti.map((p, i) => (
            <li
              key={p.titolo}
              className="comparsa grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-5 border-b border-filetto py-7"
            >
              <span className="cifre pt-0.5 text-sm text-testo-attenuato" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[1.0625rem] leading-snug font-semibold">{p.titolo}</h3>
                <p className="mt-2 text-[0.9375rem] leading-[1.6] text-testo-attenuato">
                  {p.testo}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Contenitore>
    </section>
  );
}

export function Riservatezza() {
  return (
    <section
      id="riservatezza"
      aria-labelledby="titolo-riservatezza"
      className="scroll-mt-20 bg-tonale"
    >
      <Contenitore className="py-20 md:py-28">
        <div className="comparsa max-w-[40rem]">
          <Occhiello>{RISERVATEZZA.occhiello}</Occhiello>
          <Titolo2 id="titolo-riservatezza">{RISERVATEZZA.titolo}</Titolo2>
        </div>
        <dl className="mt-12 grid gap-x-12 gap-y-0 md:grid-cols-2">
          {RISERVATEZZA.punti.map((p) => (
            <div key={p.titolo} className="comparsa border-t border-bordo py-6">
              <dt className="text-[1.0625rem] font-semibold">{p.titolo}</dt>
              <dd className="mt-2 text-[0.9375rem] leading-[1.6] text-testo-attenuato">
                {p.testo}
              </dd>
            </div>
          ))}
        </dl>
      </Contenitore>
    </section>
  );
}

/**
 * FAQ con `<details>` nativo: zero JavaScript, tastiera e lettori di schermo
 * funzionano da soli. Lo stesso array alimenta il JSON-LD `FAQPage`.
 */
export function Domande() {
  return (
    <section id="domande" aria-labelledby="titolo-domande" className="scroll-mt-20">
      <Contenitore className="grid gap-10 py-24 md:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
        <div className="comparsa">
          <Occhiello>Domande</Occhiello>
          <Titolo2 id="titolo-domande">Quello che di solito ci chiedono.</Titolo2>
        </div>
        <div className="border-t border-bordo">
          {DOMANDE.map((d) => (
            <details key={d.domanda} className="group border-b border-filetto">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.0625rem] font-semibold [&::-webkit-details-marker]:hidden">
                {d.domanda}
                <ChevronDown
                  className="size-5 shrink-0 text-testo-attenuato transition-transform duration-200 ease-[var(--ease-uscita)] group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="max-w-[60ch] pb-6 text-[0.9375rem] leading-[1.65] text-testo-attenuato">
                {d.risposta}
              </p>
            </details>
          ))}
        </div>
      </Contenitore>
    </section>
  );
}
