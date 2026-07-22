"use client";

import { CalendarClock, Check, MoreHorizontal, Plus, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { MESSAGGIO_DEMO } from "@/lib/demo";
import { completaScadenza, eliminaScadenza } from "@/lib/scadenze/actions";
import type { ScadenzaLista } from "@/lib/scadenze/queries";
import { etichettaCategoria } from "@/lib/scadenze/schema";

import { ScadenzaForm, type ScadenzaModificabile } from "./scadenza-form";

type Filtro = "da-fare" | "completate" | "tutte";

const oggiISO = () => new Date().toISOString().slice(0, 10);

function formatData(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(iso + "T00:00:00"),
  );
}

function giorniA(iso: string): number {
  const oggi = new Date(oggiISO() + "T00:00:00").getTime();
  const d = new Date(iso + "T00:00:00").getTime();
  return Math.round((d - oggi) / 86_400_000);
}

function StatoScadenza({ s }: { s: ScadenzaLista }) {
  if (s.completata) return <JudgmentBadge tone="buono">Completata</JudgmentBadge>;
  const g = giorniA(s.data);
  if (g < 0) return <JudgmentBadge tone="critico">Scaduta da {Math.abs(g)} g</JudgmentBadge>;
  if (g === 0) return <JudgmentBadge tone="attenzione">Oggi</JudgmentBadge>;
  if (g <= 7) return <JudgmentBadge tone="attenzione">Tra {g} g</JudgmentBadge>;
  return <JudgmentBadge tone="nd">Tra {g} g</JudgmentBadge>;
}

export function Scadenzario({
  scadenze,
  clienti,
  demo,
}: {
  scadenze: ScadenzaLista[];
  clienti: { id: string; ragioneSociale: string }[];
  demo: boolean;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("da-fare");
  const [formAperto, setFormAperto] = useState(false);
  const [inModifica, setInModifica] = useState<ScadenzaModificabile | null>(null);

  const visibili = useMemo(() => {
    if (filtro === "tutte") return scadenze;
    if (filtro === "completate") return scadenze.filter((s) => s.completata);
    return scadenze.filter((s) => !s.completata);
  }, [scadenze, filtro]);

  function apriNuova() {
    if (demo) return toast.error(MESSAGGIO_DEMO);
    setInModifica(null);
    setFormAperto(true);
  }
  function apriModifica(s: ScadenzaLista) {
    if (demo) return toast.error(MESSAGGIO_DEMO);
    setInModifica({
      id: s.id,
      titolo: s.titolo,
      data: s.data,
      categoria: s.categoria,
      clienteId: s.clienteId,
      note: s.note,
    });
    setFormAperto(true);
  }

  async function completa(s: ScadenzaLista) {
    const res = await completaScadenza(s.id, !s.completata);
    if (!res.ok) return toast.error(res.errore);
    router.refresh();
    toast.success(s.completata ? "Segnata da fare" : "Scadenza completata");
  }
  async function elimina(s: ScadenzaLista) {
    const res = await eliminaScadenza(s.id);
    if (!res.ok) return toast.error(res.errore);
    router.refresh();
    toast.success("Scadenza eliminata");
  }

  const conteggi = {
    "da-fare": scadenze.filter((s) => !s.completata).length,
    completate: scadenze.filter((s) => s.completata).length,
    tutte: scadenze.length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Scadenze</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adempimenti e promemoria dello studio, per cliente o generali.
          </p>
        </header>
        <Button onClick={apriNuova} data-tour="nuova-scadenza">
          <Plus className="size-4" />
          Nuova scadenza
        </Button>
      </div>

      {scadenze.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CalendarClock}
            titolo="Nessuna scadenza"
            descrizione="Aggiungi adempimenti e promemoria: li vedrai qui ordinati per data, con lo stato di ciascuno."
            azione={<Button onClick={apriNuova}>Aggiungi la prima scadenza</Button>}
          />
        </div>
      ) : (
        <>
          <div data-tour="filtri-scadenze" className="mt-6 flex gap-1.5">
            {(["da-fare", "completate", "tutte"] as Filtro[]).map((f) => (
              <Button
                key={f}
                variant={filtro === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltro(f)}
              >
                {f === "da-fare" ? "Da fare" : f === "completate" ? "Completate" : "Tutte"}
                <span className="ml-1 opacity-70">{conteggi[f]}</span>
              </Button>
            ))}
          </div>

          {visibili.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Nessuna scadenza in questa vista.
            </p>
          ) : (
            <ul data-tour="elenco-scadenze" className="mt-4 border-t border-hairline">
              {visibili.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 border-b border-hairline py-3.5 transition-colors hover:bg-muted/40">
                  <button
                    type="button"
                    data-tour={i === 0 ? "completa-scadenza" : undefined}
                    onClick={() => completa(s)}
                    aria-label={s.completata ? "Segna da fare" : "Segna completata"}
                    className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
                      s.completata
                        ? "border-success bg-success text-success-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {s.completata && <Check className="size-3.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${s.completata ? "text-muted-foreground line-through" : ""}`}
                    >
                      {s.titolo}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatData(s.data)}
                      {s.cliente ? ` · ${s.cliente}` : " · Studio"}
                    </p>
                  </div>

                  <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
                    {etichettaCategoria[s.categoria as keyof typeof etichettaCategoria] ?? s.categoria}
                  </span>
                  <StatoScadenza s={s} />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={`Azioni per ${s.titolo}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => completa(s)}>
                        {s.completata ? (
                          <>
                            <Undo2 className="size-4" />
                            Segna da fare
                          </>
                        ) : (
                          <>
                            <Check className="size-4" />
                            Segna completata
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => apriModifica(s)}>Modifica</DropdownMenuItem>
                      {s.clienteId && (
                        <DropdownMenuItem asChild>
                          <Link href={`/app/clienti/${s.clienteId}`}>Apri cliente</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onSelect={() => elimina(s)}>
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ScadenzaForm
        aperto={formAperto}
        onCambioApertura={setFormAperto}
        scadenza={inModifica}
        clienti={clienti}
        onSalvata={() => router.refresh()}
      />
    </div>
  );
}
