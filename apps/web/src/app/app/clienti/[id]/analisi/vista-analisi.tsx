import type { Analisi, DatiBilancio } from "@finbeacon/engine";
import type { ReactNode } from "react";

import { MicroEtichetta } from "@/components/ui/micro-etichetta";
import { Scena, type DeltaScena, type PuntoScena } from "@/components/ui/scena";
import { INDICATORI, type ChiaveIndicatore } from "@/lib/analisi/indicatori-meta";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";
import { cn } from "@/lib/utils";

import { LetturaContestuale } from "./lettura-contestuale";
import { PannelloDscr6M } from "./pannello-dscr6m";
import { RigaIndicatore } from "./riga-indicatore";
import { TrendEsercizi, type PuntoSerie } from "./trend-esercizi";

/**
 * Il corpo dell'analisi, PRESENTAZIONALE: nessun hook, nessun gestore.
 *
 * Non porta la direttiva `"use client"`, quindi quando la rende il server
 * resta HTML e non viene idratata. E' il motivo per cui esiste come file a
 * parte: prima tutto questo viveva dentro un componente client di 327 righe
 * con SEI sole interazioni, e il browser agganciava la scena, le sette righe
 * indicatore, la prosa e la legenda per non farci mai nulla. Misurato:
 * 4.325 ms di valutazione script sulla pagina di analisi, contro i 926 della
 * panoramica.
 *
 * Lo stesso componente lo rende anche il client durante la SIMULAZIONE, con i
 * valori simulati al posto di quelli salvati. Una sola definizione del
 * disegno, due sorgenti di dati: se fossero due copie divergerebbero al primo
 * ritocco, ed e' la famiglia di guasti di G-29.
 */

/** Gli indicatori raggruppati per quello che misurano davvero. */
const FAMIGLIE: { titolo: string; chiavi: ChiaveIndicatore[] }[] = [
  { titolo: "Redditività", chiavi: ["ros", "roi", "roiI", "roe"] },
  { titolo: "Efficienza del capitale", chiavi: ["turnover"] },
  { titolo: "Sostenibilità del debito", chiavi: ["gi", "dscr"] },
];

const metaDi = (chiave: ChiaveIndicatore) => INDICATORI.find((m) => m.chiave === chiave)!;

export function VistaAnalisi({
  clienteId,
  esercizioSelezionatoId,
  analisi,
  dati,
  serie,
  trend,
  delta,
  inSimulazione = false,
  salvati,
  avviso,
  simulatore,
}: {
  clienteId: string;
  esercizioSelezionatoId: string;
  /** Analisi da mostrare: salvata, oppure simulata. */
  analisi: Analisi;
  dati: DatiBilancio;
  serie: PuntoSerie[];
  trend: PuntoScena[];
  delta: DeltaScena | null;
  inSimulazione?: boolean;
  /** Valori salvati, per mostrare il «da ...» accanto a quelli simulati. */
  salvati?: { analisi: Analisi; dati: DatiBilancio } | null;
  /** Avviso «stai simulando», iniettato dal contenitore client. */
  avviso?: ReactNode;
  /** Pannello dei cursori, iniettato dal contenitore client. */
  simulatore?: ReactNode;
}) {
  const letture = [
    { etichetta: "Marginalità", testo: analisi.giudizi.ros.testo },
    { etichetta: "Efficienza del capitale", testo: analisi.giudizi.turnover.testo },
    { etichetta: "Sostenibilità del debito", testo: analisi.giudizi.gi.testo },
    { etichetta: "DSCR", testo: analisi.giudizi.dscr.testo },
  ];

  return (
    <>
      <Scena
        punteggio={analisi.score}
        suffisso="su 100"
        tono={sinteticoDaScore(analisi.score).tone}
        titolo={analisi.sintesi.titolo}
        frase={analisi.sintesi.descrizione}
        trend={inSimulazione ? [] : trend}
        delta={delta}
        nota={inSimulazione ? "valori simulati, non salvati" : undefined}
      />

      <section data-tour="azione-prioritaria" className="border-y border-hairline py-5">
        <MicroEtichetta come="h2">Azione prioritaria</MicroEtichetta>
        <p className="mt-2 text-base font-medium">{analisi.azionePrioritaria}</p>
        <dl className="mt-4 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
          {letture.map((l) => (
            <div key={l.etichetta} className="text-sm">
              <dt className="inline font-medium">{l.etichetta}: </dt>
              <dd className="inline text-foreground/75">{l.testo}</dd>
            </div>
          ))}
        </dl>
      </section>

      {avviso}

      {/* La colonna del simulatore esiste solo mentre si simula: riservarla sempre
          restringerebbe gli indicatori per una colonna vuota. */}
      <div className={cn("grid grid-cols-1 gap-8", inSimulazione && "lg:grid-cols-[1fr_320px]")}>
        <div className="flex flex-col gap-8">
          {FAMIGLIE.map((famiglia, i) => (
            <section key={famiglia.titolo} data-tour={i === 0 ? "famiglia-indicatori" : undefined}>
              <MicroEtichetta come="h2">{famiglia.titolo}</MicroEtichetta>
              <div className="mt-2 border-t border-hairline">
                {famiglia.chiavi.map((chiave, j) => {
                  const meta = metaDi(chiave);
                  return (
                    <RigaIndicatore
                      key={chiave}
                      marcaTour={i === 0 && j === 0}
                      meta={meta}
                      giudizio={analisi.giudizi[chiave]}
                      analisi={analisi}
                      dati={dati}
                      delta={
                        salvati
                          ? { valorePrecedente: meta.valore(salvati.analisi, salvati.dati) }
                          : null
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        {simulatore}
      </div>

      {/* Il DSCR prospettico resta l'unico blocco incorniciato: è il dato di
          continuità aziendale richiesto dall'art. 3 CCII, non un indicatore fra gli altri. */}
      <div data-tour="dscr-6m">
        <PannelloDscr6M
          analisi={analisi}
          clienteId={clienteId}
          esercizioId={esercizioSelezionatoId}
        />
      </div>

      {!inSimulazione && (
        <div data-tour="trend">
          <TrendEsercizi serie={serie} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
        <section>
          <MicroEtichetta come="h2">Punti di forza</MicroEtichetta>
          <ul className="mt-2 border-t border-hairline">
            {analisi.puntiForza.map((v, i) => (
              <li key={i} className="flex gap-2.5 border-b border-hairline py-2.5 text-sm">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                <span>{v.txt}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <MicroEtichetta come="h2">Aree di attenzione</MicroEtichetta>
          <ul className="mt-2 border-t border-hairline">
            {analisi.areeAttenzione.map((v, i) => (
              <li key={i} className="flex gap-2.5 border-b border-hairline py-2.5 text-sm">
                {/* Un'assenza di criticita non va segnata col colore del problema */}
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    v.k === "OK" ? "bg-muted-foreground" : "bg-warning",
                  )}
                />
                <span>{v.txt}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <MicroEtichetta come="h2">Analisi estesa</MicroEtichetta>
        <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-foreground/85">
          {analisi.analisiEstesa}
        </p>
      </section>

      <LetturaContestuale />

      <p className="mx-auto max-w-[72ch] text-center text-xs text-muted-foreground">
        Analisi gestionale, non costituisce giudizio legale o fiscale. Usa dati coerenti.
      </p>
    </>
  );
}
