"use client";

import {
  analizza,
  type Analisi,
  type DatiBilancio,
  type DatiPrevisionali6M,
} from "@advisorhub/engine";
import { Printer, RotateCcw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDICATORI } from "@/lib/analisi/indicatori-meta";

import { CardIndicatore } from "./card-indicatore";
import { LetturaContestuale } from "./lettura-contestuale";
import { PannelloDscr6M } from "./pannello-dscr6m";
import { PannelloSintesi } from "./pannello-sintesi";
import { Simulatore } from "./simulatore";
import { TrendEsercizi, type PuntoSerie } from "./trend-esercizi";

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

  const datiCorrenti = simulazione ?? dati;
  // Ricalcolo locale con lo stesso motore del server: nessun salvataggio
  const analisiCorrente = useMemo(
    () => (simulazione ? analizza(simulazione, previsionale ?? undefined) : analisi),
    [simulazione, previsionale, analisi],
  );

  const inSimulazione = simulazione !== null;

  function cambiaValore(campo: keyof DatiBilancio, valore: number) {
    setSimulazione((prec) => ({ ...(prec ?? dati), [campo]: valore }));
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {ragioneSociale}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analisi {anno}</h1>
        </div>
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
            onClick={() => setSimulazione(inSimulazione ? null : { ...dati })}
            aria-pressed={inSimulazione}
          >
            <SlidersHorizontal className="size-4" />
            {inSimulazione ? "Esci dalla simulazione" : "Simula"}
          </Button>
          {!inSimulazione && (
            <Button asChild>
              <Link
                href={`/stampa/${clienteId}?esercizio=${esercizioSelezionatoId}`}
                target="_blank"
                rel="noopener"
              >
                <Printer className="size-4" />
                Stampa / Scarica PDF
              </Link>
            </Button>
          )}
        </div>
      </header>

      {inSimulazione && (
        <div
          role="status"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3"
        >
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">Stai simulando.</span> I dati salvati non vengono
            modificati.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSimulazione({ ...dati })}>
            <RotateCcw className="size-4" />
            Ripristina
          </Button>
        </div>
      )}

      <div className="mt-6">
        <PannelloSintesi analisi={analisiCorrente} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {INDICATORI.map((meta) => (
            <CardIndicatore
              key={meta.chiave}
              meta={meta}
              giudizio={analisiCorrente.giudizi[meta.chiave]}
              analisi={analisiCorrente}
              dati={datiCorrenti}
              delta={inSimulazione ? { valorePrecedente: meta.valore(analisi, dati) } : null}
            />
          ))}
        </div>
        {inSimulazione && (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Simulatore dati={datiCorrenti} datiSalvati={dati} onCambio={cambiaValore} />
          </aside>
        )}
      </div>

      <div className="mt-6">
        <PannelloDscr6M
          analisi={analisiCorrente}
          clienteId={clienteId}
          esercizioId={esercizioSelezionatoId}
        />
      </div>

      {!inSimulazione && (
        <div className="mt-8">
          <TrendEsercizi serie={serie} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-success/30 bg-success-subtle p-4">
          <h2 className="text-xs font-semibold tracking-wide uppercase text-success-foreground">
            Punti di forza
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {analisiCorrente.puntiForza.map((v, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-success">
                  ✓
                </span>
                <span>{v.txt}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-warning/40 bg-warning-subtle p-4">
          <h2 className="text-xs font-semibold tracking-wide uppercase text-warning-foreground">
            Aree di attenzione
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {analisiCorrente.areeAttenzione.map((v, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-warning">
                  !
                </span>
                <span>{v.txt}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          Analisi estesa
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          {analisiCorrente.analisiEstesa}
        </p>
      </section>

      <div className="mt-6">
        <LetturaContestuale />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Analisi gestionale, non costituisce giudizio legale o fiscale. Usa dati coerenti.
      </p>
    </div>
  );
}
