import { existsSync } from "node:fs";
import { join } from "node:path";

import { FASCE_SALUTE, formatNumero, SOGLIE_GIUDIZIO } from "@advisorhub/engine";
import { ArrowDownToLine } from "lucide-react";
import Link from "next/link";

import { Contenitore, PulsantePrimario, PulsanteSecondario } from "@/components/base";
import { Deck } from "@/components/deck";
import { Logotipo } from "@/components/marchio";
import { URL_PRENOTAZIONE } from "@/lib/configurazione";
import { HERO, VOCI_MENU } from "@/lib/contenuti";
import { ORDINE } from "@/lib/indicatori";

/** Il report d'esempio si offre solo se il file c'è davvero: niente link rotti. */
const REPORT_ESEMPIO = "/report-esempio.pdf";
export const reportEsempioPresente = existsSync(join(process.cwd(), "public", REPORT_ESEMPIO));

export function Intestazione() {
  return (
    <header className="sticky top-0 z-40 border-b border-filetto bg-fondo">
      <Contenitore className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="-m-2 p-2 text-testo" aria-label="FinBeacon, torna all'inizio">
          <Logotipo className="h-6 w-auto" titolo="FinBeacon" />
        </Link>
        <nav aria-label="Sezioni" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.9375rem] text-testo-attenuato">
            {VOCI_MENU.map((v) => (
              <li key={v.href}>
                <a href={v.href} className="py-2 hover:text-testo">
                  {v.testo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* Secondario: nella prima schermata il primario è quello dell'hero (uno per schermata). */}
        <PulsanteSecondario href="#richiesta">Richiedi una demo</PulsanteSecondario>
      </Contenitore>
    </header>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="titolo-principale" className="overflow-x-clip">
      <Contenitore className="grid items-center gap-x-14 gap-y-12 pt-14 pb-20 md:pt-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:pt-24 lg:pb-28">
        <div className="max-w-[36rem]">
          <p className="etichetta flex items-center gap-3 text-testo-attenuato">
            <span className="h-px w-6 bg-testo-attenuato" aria-hidden />
            {HERO.occhiello}
          </p>
          <h1
            id="titolo-principale"
            className="mt-6 text-[clamp(2.25rem,1.3rem+3.6vw,4rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-balance"
          >
            {HERO.titolo}
          </h1>
          <p className="mt-6 text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-snug font-medium text-balance">
            {HERO.sottotitolo}
          </p>
          <p className="mt-5 text-[1.0625rem] leading-[1.65] text-testo-attenuato">{HERO.testo}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <PulsantePrimario href="#richiesta">Richiedi una demo</PulsantePrimario>
            {URL_PRENOTAZIONE && (
              <PulsanteSecondario href={URL_PRENOTAZIONE} esterno>
                Prenota una chiamata
              </PulsanteSecondario>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 text-sm text-testo-attenuato">
            {reportEsempioPresente && (
              <a
                href={REPORT_ESEMPIO}
                className="inline-flex items-center gap-2 self-start py-1 font-medium text-testo underline decoration-bordo underline-offset-4 hover:decoration-testo"
              >
                <ArrowDownToLine className="size-4" aria-hidden />
                Scarica un report d&apos;esempio (PDF)
              </a>
            )}
            <p>{HERO.rassicurazione}</p>
          </div>
        </div>

        {/* Il primo dei due momenti notte: parla il prodotto. */}
        <figure className="notte m-0 rounded-[1.1rem] px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-5">
          <Deck />
          <figcaption className="mt-4 text-right text-xs text-testo-attenuato">
            Esempio con dati inventati, calcolato dal motore di FinBeacon.
          </figcaption>
        </figure>
      </Contenitore>
    </section>
  );
}

/**
 * «Cosa calcola»: non la fascia di numeri giganti con l'etichetta sotto (il
 * cliché dell'hero-metric), ma un prospetto, come una pagina di bilancio
 * stampata. Ogni valore esce dal motore al momento del build: niente contatori
 * che partono da zero e che un motore di ricerca leggerebbe come «0».
 */
export function Prospetto() {
  const voci = [
    {
      voce: "Indicatori di bilancio, ciascuno con soglia e giudizio",
      valore: String(ORDINE.length),
    },
    { voce: "Fasce di salute sul punteggio da 0 a 100", valore: String(FASCE_SALUTE.length) },
    {
      voce: "Soglia del DSCR prospettico a 6 mesi (art. 3 CCII)",
      valore: formatNumero(SOGLIE_GIUDIZIO.dscr6m.soglia, 2),
    },
    {
      voce: "Soglia del DSCR sull'esercizio",
      valore: formatNumero(SOGLIE_GIUDIZIO.dscr.soglia, 2),
    },
  ];
  return (
    <section aria-labelledby="titolo-prospetto" className="bg-tonale">
      <Contenitore className="grid gap-8 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-14">
        <h2
          id="titolo-prospetto"
          className="text-xl leading-snug font-semibold text-balance md:text-2xl"
        >
          Cosa calcola FinBeacon, per ogni cliente dello studio.
        </h2>
        <dl className="border-t border-bordo">
          {voci.map((v) => (
            <div key={v.voce} className="flex items-baseline gap-4 border-b border-filetto py-3.5">
              <dt className="flex-1 text-[0.9375rem]">{v.voce}</dt>
              <dd className="cifre text-lg font-semibold">{v.valore}</dd>
            </div>
          ))}
        </dl>
      </Contenitore>
    </section>
  );
}
