"use client";

import { HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { benvenutoMostrato, segnaBenvenutoMostrato, tourCompletato } from "@/lib/tour/config";
import { rilanciaTour, tourPerPercorso } from "@/lib/tour/registro";

import "@/lib/tour/tour.css";

/**
 * Punto interrogativo in alto: rilancia la guida della pagina corrente.
 * Compare solo dove un tour esiste, così non fa rumore dove non serve.
 *
 * Si occupa anche dell'avvio automatico: alla primissima visita porta la
 * guida da sé, una volta sola per browser e solo sulla Panoramica. Sulle
 * altre pagine resta a disposizione senza imporsi.
 */
export function Guida({ demo }: { demo: boolean }) {
  const percorso = usePathname();
  const voce = tourPerPercorso(percorso);

  // Il tour legge il DOM, quindi esiste solo dopo l'idratazione: sul server
  // e al primo disegno questo vale false, senza scrivere stato in un effetto.
  const pronto = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!pronto || !voce) return;
    if (voce.id !== "panoramica") return;
    if (benvenutoMostrato() || tourCompletato(voce.id)) return;

    // Un attimo di respiro: i dati sono già resi lato server, ma questo
    // lascia assestare il primo disegno prima di puntare gli elementi.
    const attesa = window.setTimeout(() => {
      segnaBenvenutoMostrato();
      void voce.avvia(demo);
    }, 700);
    return () => window.clearTimeout(attesa);
  }, [pronto, voce, demo]);

  if (!pronto || !voce) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 shrink-0 text-muted-foreground hover:text-foreground sm:size-9"
      onClick={() => rilanciaTour(percorso, demo)}
      aria-label={`Rivedi la guida: ${voce.etichetta}`}
      title={`Rivedi la guida: ${voce.etichetta}`}
    >
      <HelpCircle className="size-4.5" aria-hidden />
    </Button>
  );
}
