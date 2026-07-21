"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Barra di comando della pagina di stampa: non compare nel PDF. */
export function BarraStampa({
  clienteId,
  esercizioId,
}: {
  clienteId: string;
  esercizioId: string;
}) {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/clienti/${clienteId}/analisi?esercizio=${esercizioId}`}>
            <ArrowLeft className="size-4" />
            Torna all&apos;analisi
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Dalla finestra di stampa scegli <strong>Salva come PDF</strong> per scaricarlo.
          </p>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Stampa / Scarica PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
