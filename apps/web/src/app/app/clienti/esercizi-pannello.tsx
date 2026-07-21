"use client";

import { formatEuro } from "@advisorhub/engine";
import { BarChart3, Download, FileBarChart, MoreHorizontal, Plus } from "lucide-react";
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
}: {
  clienteId: string;
  esercizi: EsercizioRiga[];
}) {
  const router = useRouter();
  const [esportando, setEsportando] = useState(false);

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
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Esercizi
        </h2>
        <div className="flex gap-2">
          {esercizi.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={esporta} disabled={esportando}>
                <Download className="size-4" />
                {esportando ? "Esporto…" : "Esporta CSV"}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/clienti/${clienteId}/analisi`}>
                  <BarChart3 className="size-4" />
                  Apri analisi
                </Link>
              </Button>
            </>
          )}
          <Button size="sm" asChild>
            <Link href={`/app/clienti/${clienteId}/esercizi/nuovo`}>
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
        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anno</TableHead>
                <TableHead className="text-right">Valore produzione</TableHead>
                <TableHead className="text-right">Fatturato</TableHead>
                <TableHead className="text-right">EBITDA</TableHead>
                <TableHead className="text-right">PFN</TableHead>
                <TableHead>DSCR 6M</TableHead>
                <TableHead>
                  <span className="sr-only">Azioni</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {esercizi.map((e) => (
                <TableRow key={e.id} className="relative">
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
