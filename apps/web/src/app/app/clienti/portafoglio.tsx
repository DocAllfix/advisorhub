"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { archiviaCliente, ripristinaCliente } from "@/lib/clienti/actions";
import type { ClienteLista } from "@/lib/clienti/queries";
import { etichettaDimensione } from "@/lib/clienti/schema";

import { ClienteForm, type ClienteModificabile } from "./cliente-form";

function formatData(d: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

/** Azioni di riga: apri scheda, modifica (Sheet non-modale), archivia. */
function MenuRiga({
  cliente,
  onApri,
  onModifica,
  onArchivia,
}: {
  cliente: ClienteLista;
  onApri: (c: ClienteLista) => void;
  onModifica: (c: ClienteLista) => void;
  onArchivia: (c: ClienteLista) => void;
}) {
  return (
    <div className="relative z-10 text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Azioni per ${cliente.ragioneSociale}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onApri(cliente)}>Apri scheda</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onModifica(cliente)}>Modifica</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onArchivia(cliente)}>
            Archivia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Portafoglio({ clienti }: { clienti: ClienteLista[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [formAperto, setFormAperto] = useState(false);
  const [inModifica, setInModifica] = useState<ClienteModificabile | null>(null);

  function apriNuovo() {
    setInModifica(null);
    setFormAperto(true);
  }
  function apriModifica(c: ClienteLista) {
    setInModifica(c);
    setFormAperto(true);
  }

  async function archivia(c: ClienteLista) {
    const res = await archiviaCliente(c.id);
    if (!res.ok) {
      toast.error(res.errore);
      return;
    }
    router.refresh();
    toast.success(`${c.ragioneSociale} archiviato`, {
      action: {
        label: "Annulla",
        onClick: async () => {
          await ripristinaCliente(c.id);
          router.refresh();
        },
      },
    });
  }

  const columns: ColumnDef<ClienteLista>[] = [
    {
      accessorKey: "ragioneSociale",
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1.5 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cliente
          <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      ),
      // Stretched link: la riga intera è un link accessibile (una sola tab-stop),
      // senza onClick sulla riga (evita il "click-through" dal menu azioni).
      cell: ({ row }) => (
        <Link
          href={`/app/clienti/${row.original.id}`}
          className="font-medium after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:outline-none"
        >
          {row.original.ragioneSociale}
        </Link>
      ),
    },
    {
      accessorKey: "dimensione",
      header: "Dimensione",
      cell: ({ row }) =>
        row.original.dimensione ? (
          etichettaDimensione[row.original.dimensione as keyof typeof etichettaDimensione]
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "codiceAteco",
      header: "ATECO",
      cell: ({ row }) =>
        row.original.codiceAteco ? (
          <span className="font-mono nums text-sm">{row.original.codiceAteco}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "salute",
      header: "Salute",
      cell: ({ row }) => {
        const score = row.original.score;
        if (score === null) {
          return <span className="text-sm text-muted-foreground">Da analizzare</span>;
        }
        const s = sinteticoDaScore(score);
        return (
          <span className="relative z-10 inline-flex items-center gap-2">
            <JudgmentBadge tone={s.tone}>{s.label}</JudgmentBadge>
            <span className="font-mono nums text-xs text-muted-foreground">{score}/100</span>
          </span>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Aggiornato",
      cell: ({ row }) => (
        <span className="nums text-sm text-muted-foreground">
          {formatData(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "azioni",
      header: () => <span className="sr-only">Azioni</span>,
      cell: ({ row }) => (
        <MenuRiga
          cliente={row.original}
          onApri={(c) => router.push(`/app/clienti/${c.id}`)}
          onModifica={apriModifica}
          onArchivia={archivia}
        />
      ),
    },
  ];

  const table = useReactTable({
    data: clienti,
    columns,
    state: { sorting, globalFilter: filtro },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltro,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const nessunCliente = clienti.length === 0;
  const nessunRisultato = !nessunCliente && table.getRowModel().rows.length === 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Clienti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Il portafoglio dello studio. Apri una scheda per analizzarne i bilanci.
          </p>
        </header>
        <Button onClick={apriNuovo}>
          <Plus className="size-4" />
          Nuovo cliente
        </Button>
      </div>

      {nessunCliente ? (
        <div className="mt-8">
          <EmptyState
            icon={Plus}
            titolo="Nessun cliente nel portafoglio"
            descrizione="Aggiungi la prima azienda per iniziare a monitorarne la salute economico-finanziaria."
            azione={<Button onClick={apriNuovo}>Aggiungi il primo cliente</Button>}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center">
            <div className="relative w-full max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Cerca nel portafoglio…"
                className="pl-9"
                aria-label="Cerca nel portafoglio"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {nessunRisultato ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nessun cliente per «{filtro}».
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="relative cursor-pointer">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <ClienteForm
        aperto={formAperto}
        onCambioApertura={setFormAperto}
        cliente={inModifica}
        onSalvato={() => router.refresh()}
      />
    </div>
  );
}
