"use client";

import {
  analizza,
  type Analisi,
  type DatiBilancio,
  type DatiPrevisionali6M,
} from "@finbeacon/engine";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { toniGrafica } from "@/lib/analisi/toni";

import { Simulatore } from "./simulatore";
import type { PuntoSerie } from "./trend-esercizi";
import { VistaAnalisi } from "./vista-analisi";

/**
 * L'analisi mentre si simula: l'unica parte davvero interattiva della pagina.
 *
 * Vive in un file suo perche' si carica SOLO al primo clic su «Simula»
 * (import dinamico dal contenitore). Con lei arrivano il motore di calcolo e i
 * cursori, che la maggior parte delle visite non apre mai.
 *
 * Il disegno non e' duplicato: rende la stessa `VistaAnalisi` che rende il
 * server, con i valori simulati al posto di quelli salvati. Due copie dello
 * stesso disegno divergerebbero al primo ritocco (GUASTI G-29).
 */
export default function Simulazione({
  clienteId,
  esercizioSelezionatoId,
  dati,
  previsionale,
  analisi,
  serie,
}: {
  clienteId: string;
  esercizioSelezionatoId: string;
  dati: DatiBilancio;
  previsionale: DatiPrevisionali6M | null;
  analisi: Analisi;
  serie: PuntoSerie[];
}) {
  // Se l'esercizio non ha previsionali salvati si parte da zero: così il DSCR
  // prospettico si può comunque simulare, come faceva il prototipo a 14 cursori.
  const previsionaleBase: DatiPrevisionali6M = previsionale ?? {
    liquiditaIniziale: 0,
    entrate6m: 0,
    uscite6m: 0,
    debito6m: 0,
  };

  const [datiCorrenti, setDati] = useState<DatiBilancio>({ ...dati });
  const [previsionaleCorrente, setPrevisionale] = useState<DatiPrevisionali6M>({
    ...previsionaleBase,
  });

  // Ricalcolo locale con lo stesso motore del server: nessun salvataggio.
  const analisiCorrente = useMemo(
    () => analizza(datiCorrenti, previsionaleCorrente),
    [datiCorrenti, previsionaleCorrente],
  );

  function ripristina() {
    setDati({ ...dati });
    setPrevisionale({ ...previsionaleBase });
  }

  return (
    <VistaAnalisi
      clienteId={clienteId}
      esercizioSelezionatoId={esercizioSelezionatoId}
      analisi={analisiCorrente}
      dati={datiCorrenti}
      serie={serie}
      trend={[]}
      delta={null}
      inSimulazione
      salvati={{ analisi, dati }}
      avviso={
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3"
        >
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">Stai simulando.</span> I dati salvati non vengono
            modificati.
          </p>
          <Button variant="outline" size="sm" onClick={ripristina} data-tour="ripristina">
            <RotateCcw className="size-4" />
            Ripristina
          </Button>
        </div>
      }
      simulatore={
        <aside className="scorri-sobrio lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <Simulatore
            dati={datiCorrenti}
            datiSalvati={dati}
            previsionale={previsionaleCorrente}
            previsionaleSalvato={previsionale}
            dscrProspettico={{
              valore: analisiCorrente.indicatori.dscrProspettico,
              label: analisiCorrente.giudizi.dscrPro.label,
              colore: toniGrafica[analisiCorrente.giudizi.dscrPro.tone],
            }}
            onCambio={(campo, valore) => setDati((p) => ({ ...p, [campo]: valore }))}
            onCambioPrevisionale={(campo, valore) =>
              setPrevisionale((p) => ({ ...p, [campo]: valore }))
            }
          />
        </aside>
      }
    />
  );
}
