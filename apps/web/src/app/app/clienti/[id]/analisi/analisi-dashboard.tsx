"use client";

import {
  analizza,
  type Analisi,
  type DatiBilancio,
  type DatiPrevisionali6M,
} from "@advisorhub/engine";
import { Download, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { MicroEtichetta } from "@/components/ui/micro-etichetta";
import { Scena } from "@/components/ui/scena";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDICATORI, type ChiaveIndicatore } from "@/lib/analisi/indicatori-meta";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";
import { toniGrafica } from "@/lib/analisi/toni";
import { cn } from "@/lib/utils";

import { LetturaContestuale } from "./lettura-contestuale";
import { PannelloDscr6M } from "./pannello-dscr6m";
import { RigaIndicatore } from "./riga-indicatore";
import { Simulatore } from "./simulatore";
import { TrendEsercizi, type PuntoSerie } from "./trend-esercizi";

/**
 * Gli indicatori raggruppati per quello che misurano davvero: quanto rende la
 * gestione, quanto lavora il capitale, se il debito è sostenibile. Il gruppo
 * porta informazione, non è un contenitore decorativo.
 */
const FAMIGLIE: { titolo: string; chiavi: ChiaveIndicatore[] }[] = [
  { titolo: "Redditività", chiavi: ["ros", "roi", "roiI", "roe"] },
  { titolo: "Efficienza del capitale", chiavi: ["turnover"] },
  { titolo: "Sostenibilità del debito", chiavi: ["gi", "dscr"] },
];

const metaDi = (chiave: ChiaveIndicatore) => INDICATORI.find((m) => m.chiave === chiave)!;

export function AnalisiDashboard({
  clienteId,
  ragioneSociale,
  esercizi,
  esercizioSelezionatoId,
  anno,
  dati,
  previsionale,
  analisi,
  serie,
}: {
  clienteId: string;
  ragioneSociale: string;
  esercizi: { id: string; anno: number }[];
  esercizioSelezionatoId: string;
  anno: number;
  dati: DatiBilancio;
  previsionale: DatiPrevisionali6M | null;
  analisi: Analisi;
  serie: PuntoSerie[];
}) {
  const router = useRouter();
  const [simulazione, setSimulazione] = useState<DatiBilancio | null>(null);
  // Se l'esercizio non ha previsionali salvati si parte da zero: così il DSCR
  // prospettico si può comunque simulare, come faceva il prototipo a 14 cursori.
  const previsionaleBase: DatiPrevisionali6M = previsionale ?? {
    liquiditaIniziale: 0,
    entrate6m: 0,
    uscite6m: 0,
    debito6m: 0,
  };
  const [simPrevisionale, setSimPrevisionale] = useState<DatiPrevisionali6M | null>(null);

  const datiCorrenti = simulazione ?? dati;
  const previsionaleCorrente = simPrevisionale ?? previsionale;
  const inSimulazione = simulazione !== null;

  // Ricalcolo locale con lo stesso motore del server: nessun salvataggio
  const analisiCorrente = useMemo(
    () => (inSimulazione ? analizza(datiCorrenti, previsionaleCorrente ?? undefined) : analisi),
    [inSimulazione, datiCorrenti, previsionaleCorrente, analisi],
  );

  // La serie si ferma all'esercizio scelto: mostrare anni successivi a quello
  // in lettura darebbe una variazione che non riguarda il numero a schermo.
  const indiceAnno = serie.findIndex((s) => s.anno === anno);
  const serieFinoAdOra = indiceAnno >= 0 ? serie.slice(0, indiceAnno + 1) : serie;
  const delta =
    !inSimulazione && indiceAnno > 0
      ? {
          valore: serie[indiceAnno]!.score - serie[indiceAnno - 1]!.score,
          annoPrec: serie[indiceAnno - 1]!.anno,
        }
      : null;

  function avviaSimulazione() {
    setSimulazione({ ...dati });
    setSimPrevisionale({ ...previsionaleBase });
  }
  function chiudiSimulazione() {
    setSimulazione(null);
    setSimPrevisionale(null);
  }
  function cambiaValore(campo: keyof DatiBilancio, valore: number) {
    setSimulazione((prec) => ({ ...(prec ?? dati), [campo]: valore }));
  }
  function cambiaPrevisionale(campo: keyof DatiPrevisionali6M, valore: number) {
    setSimPrevisionale((prec) => ({ ...(prec ?? previsionaleBase), [campo]: valore }));
  }

  const letture = [
    { etichetta: "Marginalità", testo: analisiCorrente.giudizi.ros.testo },
    { etichetta: "Efficienza del capitale", testo: analisiCorrente.giudizi.turnover.testo },
    { etichetta: "Sostenibilità del debito", testo: analisiCorrente.giudizi.gi.testo },
    { etichetta: "DSCR", testo: analisiCorrente.giudizi.dscr.testo },
  ];

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MicroEtichetta>
          {ragioneSociale} · Esercizio {anno}
        </MicroEtichetta>
        <div className="flex flex-wrap items-center gap-2">
          {esercizi.length > 1 && (
            <Select
              value={esercizioSelezionatoId}
              onValueChange={(v) => router.push(`/app/clienti/${clienteId}/analisi?esercizio=${v}`)}
            >
              <SelectTrigger aria-label="Esercizio da analizzare" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {esercizi.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    Esercizio {e.anno}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant={inSimulazione ? "default" : "outline"}
            onClick={() => (inSimulazione ? chiudiSimulazione() : avviaSimulazione())}
            aria-pressed={inSimulazione}
          >
            <SlidersHorizontal className="size-4" />
            {inSimulazione ? "Esci dalla simulazione" : "Simula"}
          </Button>
          {/* Il PDF si scarica: nessuna pagina intermedia, nessun dialogo di stampa */}
          {!inSimulazione && (
            <Button asChild>
              <a
                href={`/api/report/${clienteId}?esercizio=${esercizioSelezionatoId}`}
                download
              >
                <Download className="size-4" />
                Scarica PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      <Scena
        punteggio={analisiCorrente.score}
        suffisso="su 100"
        tono={sinteticoDaScore(analisiCorrente.score).tone}
        titolo={analisiCorrente.sintesi.titolo}
        frase={analisiCorrente.sintesi.descrizione}
        trend={inSimulazione ? [] : serieFinoAdOra.map((s) => ({ anno: s.anno, media: s.score }))}
        delta={delta}
        nota={inSimulazione ? "valori simulati, non salvati" : undefined}
      />

      <section className="border-y border-hairline py-5">
        <MicroEtichetta come="h2">Azione prioritaria</MicroEtichetta>
        <p className="mt-2 text-base font-medium">{analisiCorrente.azionePrioritaria}</p>
        <dl className="mt-4 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
          {letture.map((l) => (
            <div key={l.etichetta} className="text-sm">
              <dt className="inline font-medium">{l.etichetta}: </dt>
              <dd className="inline text-foreground/75">{l.testo}</dd>
            </div>
          ))}
        </dl>
      </section>

      {inSimulazione && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3"
        >
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">Stai simulando.</span> I dati salvati non vengono
            modificati.
          </p>
          <Button variant="outline" size="sm" onClick={avviaSimulazione}>
            <RotateCcw className="size-4" />
            Ripristina
          </Button>
        </div>
      )}

      {/* La colonna del simulatore esiste solo mentre si simula: riservarla sempre
          restringerebbe gli indicatori per una colonna vuota. */}
      <div
        className={cn("grid grid-cols-1 gap-8", inSimulazione && "lg:grid-cols-[1fr_320px]")}
      >
        <div className="flex flex-col gap-8">
          {FAMIGLIE.map((famiglia) => (
            <section key={famiglia.titolo}>
              <MicroEtichetta come="h2">{famiglia.titolo}</MicroEtichetta>
              <div className="mt-2 border-t border-hairline">
                {famiglia.chiavi.map((chiave) => {
                  const meta = metaDi(chiave);
                  return (
                    <RigaIndicatore
                      key={chiave}
                      meta={meta}
                      giudizio={analisiCorrente.giudizi[chiave]}
                      analisi={analisiCorrente}
                      dati={datiCorrenti}
                      delta={inSimulazione ? { valorePrecedente: meta.valore(analisi, dati) } : null}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        {inSimulazione && (
          <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
            <Simulatore
              dati={datiCorrenti}
              datiSalvati={dati}
              previsionale={previsionaleCorrente ?? previsionaleBase}
              previsionaleSalvato={previsionale}
              dscrProspettico={{
                valore: analisiCorrente.indicatori.dscrProspettico,
                label: analisiCorrente.giudizi.dscrPro.label,
                colore: toniGrafica[analisiCorrente.giudizi.dscrPro.tone],
              }}
              onCambio={cambiaValore}
              onCambioPrevisionale={cambiaPrevisionale}
            />
          </aside>
        )}
      </div>

      {/* Il DSCR prospettico resta l'unico blocco incorniciato: è il dato di
          continuità aziendale richiesto dall'art. 3 CCII, non un indicatore fra gli altri. */}
      <PannelloDscr6M
        analisi={analisiCorrente}
        clienteId={clienteId}
        esercizioId={esercizioSelezionatoId}
      />

      {!inSimulazione && <TrendEsercizi serie={serie} />}

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
        <section>
          <MicroEtichetta come="h2">Punti di forza</MicroEtichetta>
          <ul className="mt-2 border-t border-hairline">
            {analisiCorrente.puntiForza.map((v, i) => (
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
            {analisiCorrente.areeAttenzione.map((v, i) => (
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
          {analisiCorrente.analisiEstesa}
        </p>
      </section>

      <LetturaContestuale />

      <p className="mx-auto max-w-[72ch] text-center text-xs text-muted-foreground">
        Analisi gestionale, non costituisce giudizio legale o fiscale. Usa dati coerenti.
      </p>
    </div>
  );
}
