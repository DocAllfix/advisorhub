"use client";

import type { Analisi, DatiBilancio, DatiPrevisionali6M } from "@advisorhub/engine";
import { Download, SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { MicroEtichetta } from "@/components/ui/micro-etichetta";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tourCompletato } from "@/lib/tour/config";

import type { PuntoSerie } from "./trend-esercizi";

/*
 * La simulazione arriva al primo clic su «Simula», non con la pagina.
 *
 * E' l'unica parte davvero interattiva dell'analisi, e la maggior parte delle
 * visite non la apre mai: caricarla sempre significava portarsi dietro il
 * motore di calcolo e i cursori per niente.
 */
const Simulazione = dynamic(() => import("./simulazione"), { ssr: false });

/**
 * Il contenitore interattivo dell'analisi, e basta.
 *
 * Riceve come `children` la vista RESA DAL SERVER e si limita a mostrarla
 * finche' non si simula. E' il punto del refactoring: un componente client
 * puo' ricevere figli gia' resi dal server e renderli senza idratarli, quindi
 * la pagina resta HTML mentre le poche interazioni restano vive.
 *
 * Prima l'intera analisi era un componente client di 327 righe con sei
 * interazioni in tutto, e il browser agganciava anche la prosa.
 */
export function ContenitoreAnalisi({
  clienteId,
  ragioneSociale,
  anno,
  esercizi,
  esercizioSelezionatoId,
  dati,
  previsionale,
  analisi,
  serie,
  children,
}: {
  clienteId: string;
  ragioneSociale: string;
  anno: number;
  esercizi: { id: string; anno: number }[];
  esercizioSelezionatoId: string;
  dati: DatiBilancio;
  previsionale: DatiPrevisionali6M | null;
  analisi: Analisi;
  serie: PuntoSerie[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [inSimulazione, setInSimulazione] = useState(false);

  function avvia() {
    setInSimulazione(true);
    // Il tour dei cursori ha senso solo mentre sono a schermo: parte alla
    // prima apertura, una volta sola. Il ritardo lascia disegnare il pannello.
    if (!tourCompletato("simulatore")) {
      window.setTimeout(
        () => void import("@/lib/tour/pagine/analisi").then((t) => t.tourSimulatore()),
        450,
      );
    }
  }

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
            onClick={() => (inSimulazione ? setInSimulazione(false) : avvia())}
            aria-pressed={inSimulazione}
            data-tour="simula"
          >
            <SlidersHorizontal className="size-4" />
            {inSimulazione ? "Esci dalla simulazione" : "Simula"}
          </Button>
          {/* Il PDF si scarica: nessuna pagina intermedia, nessun dialogo di stampa */}
          {!inSimulazione && (
            <Button asChild data-tour="scarica-pdf">
              <a href={`/api/report/${clienteId}?esercizio=${esercizioSelezionatoId}`} download>
                <Download className="size-4" />
                Scarica PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {inSimulazione ? (
        <Simulazione
          clienteId={clienteId}
          esercizioSelezionatoId={esercizioSelezionatoId}
          dati={dati}
          previsionale={previsionale}
          analisi={analisi}
          serie={serie}
        />
      ) : (
        children
      )}
    </div>
  );
}
