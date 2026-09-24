import type { Analisi, DatiBilancio, Giudizio } from "@finbeacon/engine";
import { ChevronDown } from "lucide-react";

import { Cifra } from "@/components/ui/cifra";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { NumeroAnimato } from "@/components/ui/numero-animato";
import type { MetaIndicatore } from "@/lib/analisi/indicatori-meta";
import { toniGrafica } from "@/lib/analisi/toni";

/**
 * Un indicatore come riga editoriale: valore e scala incolonnati con gli altri
 * della famiglia, così il confronto si legge senza rileggere le etichette.
 * Il consiglio resta sempre in chiaro (PRODUCT.md: dal dato al consiglio),
 * formula e spiegazione si aprono su richiesta.
 */
export function RigaIndicatore({
  meta,
  giudizio,
  analisi,
  dati,
  delta,
  marcaTour,
}: {
  meta: MetaIndicatore;
  giudizio: Giudizio;
  analisi: Analisi;
  dati: DatiBilancio;
  /** Valore dei dati salvati, durante la simulazione. */
  delta?: { valorePrecedente: string } | null;
  /** Bersaglio del passo di guida sulla singola riga: solo la prima. */
  marcaTour?: boolean;
}) {
  const valore = meta.valore(analisi, dati);
  const percentuale = meta.percentuale(analisi, dati);
  const colore = toniGrafica[giudizio.tone];
  const cambiato = delta && delta.valorePrecedente !== valore;

  return (
    <div
      data-tour={marcaTour ? "riga-indicatore" : undefined}
      className="border-b border-hairline py-3.5"
    >
      {/*
       * Tracce FISSE, non elastiche. Prima era un flex con il titolo in
       * `flex-1` e il badge a larghezza intrinseca: «Ottimo» e «Sostiene
       * sviluppo» misurano diverso, la differenza veniva assorbita dal titolo,
       * e valore e barra slittavano di riga in riga. Sette indicatori che non
       * si incolonnano sono sette letture, non un confronto.
       *
       * Le tracce devono essere ASSOLUTE: ogni riga e' una griglia a se', e
       * `minmax()` si dimensionerebbe sul contenuto della singola riga,
       * riportando il disallineamento. 11rem sulla traccia del giudizio e'
       * misurato sull'etichetta piu' lunga del motore, «Non genera ricchezza».
       *
       * Sotto md la barra sparisce e restano tre elementi su due colonne: il
       * giudizio va a capo a sinistra, sotto il titolo.
       */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_7rem_5rem_11rem]">
        <h3 className="min-w-0 text-sm font-semibold">
          {meta.titolo}
          <span className="ml-2 text-xs font-normal text-muted-foreground">{meta.sottotitolo}</span>
        </h3>

        <span className="text-right whitespace-nowrap">
          <Cifra valore={<NumeroAnimato testo={valore} />} dimensione="sm" />
          {cambiato && (
            <span className="nums block font-mono text-[11px] text-muted-foreground">
              da {delta!.valorePrecedente}
            </span>
          )}
        </span>

        {/* Scala di posizione: ridondante col badge, mai unico canale */}
        <span
          className="hidden h-1 w-20 shrink-0 self-center rounded-full bg-muted md:block"
          aria-hidden
        >
          <span
            className="block h-full rounded-full motion-safe:transition-all motion-safe:duration-300"
            style={{
              width: `${Math.max(0, Math.min(100, percentuale))}%`,
              backgroundColor: colore,
            }}
          />
        </span>

        {/* Allineato a sinistra nella sua traccia: cosi' i pallini di giudizio
            formano una colonna verticale che si scorre con l'occhio. */}
        <JudgmentBadge tone={giudizio.tone}>{giudizio.label}</JudgmentBadge>
      </div>

      {/* Il consiglio e' gia' scritto all'imperativo («Capitalizza: alza
          barriere…»): si legge come consiglio senza doverlo etichettare, e
          «Cosa puoi fare:» ripetuto sette volte era solo rumore. */}
      <p className="mt-2 max-w-[72ch] text-sm text-foreground/80">{giudizio.azione}</p>

      {/*
       * Apertura con <details>, non con useState.
       *
       * Era l'unico stato di questo componente, e per uno stato solo l'intera
       * riga doveva essere un componente client: sette righe per pagina,
       * idratate per aprire un paragrafo. Con <details> l'interazione la fa il
       * browser, il componente diventa server e non porta JavaScript.
       *
       * L'accessibilita' non ci perde: <summary> e' gia' un bersaglio
       * focalizzabile con `aria-expanded` gestito dal browser, che e' piu' di
       * quanto facesse il bottone precedente.
       */}
      <details className="group">
        <summary className="mt-2 flex min-h-11 cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:min-h-8 [&::-webkit-details-marker]:hidden">
          Cosa significa
          <ChevronDown
            className="size-3.5 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="mt-2.5 max-w-[72ch] space-y-2 text-xs leading-relaxed text-foreground/80">
          <p className="nums inline-block rounded bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
            {meta.formula}
          </p>
          <p>{meta.descrizione}</p>
          <p className="text-muted-foreground">{giudizio.testo}</p>
          <p className="nums font-mono text-[11px] text-muted-foreground">
            {meta.extra(analisi, dati)}
          </p>
        </div>
      </details>
    </div>
  );
}
