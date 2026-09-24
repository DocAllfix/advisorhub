import Link from "next/link";

import { Contenitore, Occhiello, Paragrafo, PulsanteSecondario, Titolo2 } from "@/components/base";
import { Logotipo } from "@/components/marchio";
import { ModuloDemo } from "@/components/modulo-demo";
import { EMAIL_CONTATTO, URL_DEMO_PUBBLICA, URL_PRENOTAZIONE } from "@/lib/configurazione";
import { CHIUSURA, VOCI_MENU } from "@/lib/contenuti";

export function Chiusura() {
  return (
    <section
      id="richiesta"
      aria-labelledby="titolo-richiesta"
      className="scroll-mt-20 border-t border-filetto"
    >
      <Contenitore className="grid gap-12 py-24 md:py-32 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <Occhiello>{CHIUSURA.occhiello}</Occhiello>
          <Titolo2 id="titolo-richiesta">{CHIUSURA.titolo}</Titolo2>
          <Paragrafo className="mt-5 max-w-[30rem]">{CHIUSURA.testo}</Paragrafo>
          {(URL_PRENOTAZIONE || URL_DEMO_PUBBLICA) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {URL_PRENOTAZIONE && (
                <PulsanteSecondario href={URL_PRENOTAZIONE} esterno>
                  Prenota una chiamata
                </PulsanteSecondario>
              )}
              {URL_DEMO_PUBBLICA && (
                <PulsanteSecondario href={URL_DEMO_PUBBLICA} esterno>
                  Entra nella demo
                </PulsanteSecondario>
              )}
            </div>
          )}
        </div>
        <ModuloDemo emailRipiego={EMAIL_CONTATTO} />
      </Contenitore>
    </section>
  );
}

export function Piede() {
  return (
    <footer className="bg-tonale">
      <Contenitore className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[22rem]">
            <Logotipo className="h-6 w-auto text-testo" />
            <p className="mt-4 text-sm leading-[1.6] text-testo-attenuato">
              Analisi di bilancio e allerta crisi per gli studi commercialisti.
            </p>
          </div>
          <nav aria-label="Piè di pagina" className="grid grid-cols-2 gap-x-14 gap-y-2 text-sm">
            <ul className="space-y-2">
              {VOCI_MENU.map((v) => (
                <li key={v.href}>
                  <Link href={`/${v.href}`} className="text-testo-attenuato hover:text-testo">
                    {v.testo}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-2">
              <li>
                <Link href="/#richiesta" className="text-testo-attenuato hover:text-testo">
                  Richiedi una demo
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-testo-attenuato hover:text-testo">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/note-legali" className="text-testo-attenuato hover:text-testo">
                  Note legali
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-bordo pt-6 text-xs text-testo-attenuato sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} FinBeacon</p>
        </div>
      </Contenitore>
    </footer>
  );
}
