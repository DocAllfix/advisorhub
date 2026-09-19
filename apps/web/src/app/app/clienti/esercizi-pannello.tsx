"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { formatEuro } from "@advisorhub/engine";
import { Download, FileBarChart, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MESSAGGIO_DEMO } from "@/lib/demo";
import { eliminaEsercizio, esportaEserciziCsv } from "@/lib/esercizi/actions";

export type EsercizioRiga = {
  id: string;
  anno: number;
  valProd: number;
  fatturato: number;
  ebitda: number;
  pfn: number;
  haPrevisionale: boolean;
};

export function EserciziPannello({
  clienteId,
  esercizi,
  demo,
}: {
  clienteId: string;
  esercizi: EsercizioRiga[];
  demo: boolean;
}) {
  const router = useRouter();
  const [esportando, setEsportando] = useState(false);
  // Caricare o eliminare un bilancio riscrive la tabella: la riga nuova entra
  // invece di apparire, e si vede dove si e' inserita nello storico.
  const [rifEsercizi] = useAutoAnimate<HTMLTableSectionElement>();

  // "Nuovo esercizio" e "Modifica" portano a un form che in demo mostra un
  // avviso: le intercetto qui per dare subito il messaggio, senza far navigare.
  function bloccaSeDemo(vai: () => void) {
    return (ev: { preventDefault: () => void }) => {
      if (demo) {
        ev.preventDefault();
        toast.error(MESSAGGIO_DEMO);
        return;
      }
      vai();
    };
  }

  async function esporta() {
    setEsportando(true);
    const res = await esportaEserciziCsv(clienteId);
    setEsportando(false);
    if (!res.ok) {
      toast.error(res.errore);
      return;
    }
    const blob = new Blob(["﻿" + res.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.nomeFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV esportato");
  }

  async function elimina(e: EsercizioRiga) {
    const res = await eliminaEsercizio(e.id);
    if (!res.ok) {
      toast.error(res.errore);
      return;
    }
    router.refresh();
    toast.success(`Esercizio ${e.anno} eliminato`);
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">
          Esercizi
        </h2>
        <div className="flex gap-2">
          {/* "Apri analisi" vive nell'intestazione della scheda, accanto alla salute */}
          {esercizi.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={esporta}
              disabled={esportando}
              data-tour="esporta-csv"
            >
              <Download className="size-4" />
              {esportando ? "Esporto…" : "Esporta CSV"}
            </Button>
          )}
          <Button size="sm" asChild data-tour="nuovo-esercizio">
            <Link
              href={`/app/clienti/${clienteId}/esercizi/nuovo`}
              onClick={bloccaSeDemo(() => {})}
            >
              <Plus className="size-4" />
              Nuovo esercizio
            </Link>
          </Button>
        </div>
      </div>

      {esercizi.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={FileBarChart}
            titolo="Nessun esercizio caricato"
            descrizione="Carica i dati di bilancio di un esercizio per calcolare indicatori, giudizi e DSCR prospettico."
            azione={
              <Button asChild>
                <Link href={`/app/clienti/${clienteId}/esercizi/nuovo`}>Aggiungi un esercizio</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div data-tour="tabella-esercizi" className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-hairline hover:bg-transparent">
                {["Anno", "Valore produzione", "Fatturato", "EBITDA", "PFN", "DSCR 6M"].map(
                  (t, i) => (
                    <TableHead
                      key={t}
                      className={`h-auto pb-2.5 text-[11px] font-medium tracking-[0.14em] uppercase ${i > 0 && i < 5 ? "text-right" : ""}`}
                    >
                      {t}
                    </TableHead>
                  ),
                )}
                <TableHead className="h-auto pb-2.5">
                  <span className="sr-only">Azioni</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody ref={rifEsercizi}>
              {esercizi.map((e) => (
                <TableRow key={e.id} className="relative border-hairline hover:bg-muted/40">
                  <TableCell>
                    <Link
                      href={`/app/clienti/${clienteId}/esercizi/${e.id}/modifica`}
                      className="font-medium after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:outline-none"
                    >
                      {e.anno}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono nums text-sm">
                    {formatEuro(e.valProd)}
                  </TableCell>
                  <TableCell className="text-right font-mono nums text-sm">
                    {formatEuro(e.fatturato)}
                  </TableCell>
                  <TableCell className="text-right font-mono nums text-sm">
                    {formatEuro(e.ebitda)}
                  </TableCell>
                  <TableCell className="text-right font-mono nums text-sm">
                    {formatEuro(e.pfn)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.haPrevisionale ? "Sì" : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="relative z-10 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Azioni per l'esercizio ${e.anno}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(`/app/clienti/${clienteId}/analisi?esercizio=${e.id}`)
                            }
                          >
                            Apri analisi
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(`/app/clienti/${clienteId}/esercizi/${e.id}/modifica`)
                            }
                          >
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => elimina(e)}>
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
