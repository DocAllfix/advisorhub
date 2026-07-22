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
import { Cifra } from "@/components/ui/cifra";
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

const coloreTono: Record<string, string> = {
  eccellente: "var(--primary)",
  buono: "var(--success)",
  attenzione: "var(--warning)",
  critico: "var(--danger)",
  nd: "var(--muted-foreground)",
};

function formatData(d: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

/** Intestazione di colonna ordinabile, resa come micro-etichetta. */
function Intestazione({
  etichetta,
  onOrdina,
}: {
  etichetta: string;
  onOrdina?: () => void;
}) {
  if (!onOrdina) {
    return (
      <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">
        {etichetta}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onOrdina}
      className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {etichetta}
      <ArrowUpDown className="size-3" aria-hidden />
    </button>
  );
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
        <Intestazione
          etichetta="Cliente"
          onOrdina={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
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
      header: () => <Intestazione etichetta="Dimensione" />,
      cell: ({ row }) =>
        row.original.dimensione ? (
          <span className="text-sm text-muted-foreground">
            {etichettaDimensione[row.original.dimensione as keyof typeof etichettaDimensione]}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "codiceAteco",
      header: () => <Intestazione etichetta="ATECO" />,
      cell: ({ row }) =>
        row.original.codiceAteco ? (
          <span className="nums font-mono text-sm text-muted-foreground">
            {row.original.codiceAteco}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "salute",
      header: ({ column }) => (
        <Intestazione
          etichetta="Salute"
          onOrdina={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      accessorFn: (r) => r.score ?? -1,
      cell: ({ row }) => {
        const score = row.original.score;
        if (score === null) {
          return <span className="text-sm text-muted-foreground">Da analizzare</span>;
        }
        const s = sinteticoDaScore(score);
        return (
          <span className="relative z-10 inline-flex items-center gap-3">
            <Cifra
              valore={score}
              dimensione="sm"
              className="w-8 text-right text-lg"
              style={{ color: coloreTono[s.tone] }}
            />
            <span className="hidden h-1 w-16 shrink-0 rounded-full bg-muted lg:block" aria-hidden>
              <span
                className="block h-full rounded-full"
                style={{ width: `${score}%`, backgroundColor: coloreTono[s.tone] }}
              />
            </span>
            <JudgmentBadge tone={s.tone}>{s.label}</JudgmentBadge>
          </span>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: () => <Intestazione etichetta="Aggiornato" />,
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

  const daAnalizzare = clienti.filter((c) => c.score === null).length;
  const inAllerta = clienti.filter((c) => c.score !== null && c.score < 55).length;

  // Riepilogo in una riga: la Panoramica resta il posto delle metriche, qui
  // serve solo sapere su cosa si sta lavorando.
  const riepilogo = [
    `${clienti.length} ${clienti.length === 1 ? "azienda seguita" : "aziende seguite"}`,
    daAnalizzare > 0 ? `${daAnalizzare} da analizzare` : null,
    inAllerta > 0 ? `${inAllerta} in allerta` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Clienti</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {nessunCliente
              ? "Il portafoglio dello studio. Apri una scheda per analizzarne i bilanci."
              : riepilogo}
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
          {/* Ricerca a filo: un campo, non una scatola dentro una scatola */}
          <div className="mt-7 max-w-xs">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Cerca nel portafoglio…"
                aria-label="Cerca nel portafoglio"
                className="h-9 rounded-none border-0 border-b border-hairline bg-transparent pr-0 pl-6 focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="border-hairline hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="h-auto pb-2.5">
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
                  <TableRow className="border-hairline">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nessun cliente per «{filtro}».
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="relative cursor-pointer border-hairline hover:bg-muted/40"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3.5">
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
