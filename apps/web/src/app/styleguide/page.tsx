import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToastDemo } from "@/components/styleguide/toast-demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Styleguide — advisorhub",
  robots: { index: false, follow: false },
};

const tokens = [
  { name: "background", cls: "bg-background border" },
  { name: "card", cls: "bg-card border" },
  { name: "sidebar", cls: "bg-sidebar border" },
  { name: "muted", cls: "bg-muted" },
  { name: "border", cls: "bg-border" },
  { name: "primary", cls: "bg-primary" },
  { name: "accent", cls: "bg-accent" },
  { name: "success", cls: "bg-success" },
  { name: "warning", cls: "bg-warning" },
  { name: "danger", cls: "bg-danger" },
];

const typeScale = [
  { label: "Display KPI", cls: "text-3xl font-semibold tracking-tight nums", sample: "14,00%" },
  {
    label: "Titolo pagina (24px)",
    cls: "text-2xl font-semibold tracking-tight",
    sample: "Portafoglio clienti",
  },
  {
    label: "Titolo sezione (20px)",
    cls: "text-xl font-semibold",
    sample: "Indicatori di bilancio",
  },
  {
    label: "Corpo (16px)",
    cls: "text-base",
    sample: "Il DSCR misura la capacità di coprire il servizio del debito con i flussi generati.",
  },
  {
    label: "Secondario (14px)",
    cls: "text-sm text-muted-foreground",
    sample: "Ultimo esercizio caricato: 2025",
  },
  {
    label: "Etichetta (12px)",
    cls: "text-xs font-medium tracking-wide uppercase text-muted-foreground",
    sample: "Reddito operativo",
  },
];

const rows = [
  {
    cliente: "Mario Rossi Spa",
    roi: "14,00%",
    dscr: "1,40",
    score: 91,
    tone: "eccellente",
    giudizio: "Ottimo",
  },
  {
    cliente: "Luca Bianchi Spa",
    roi: "2,54%",
    dscr: "0,86",
    score: 49,
    tone: "critico",
    giudizio: "Critico",
  },
  {
    cliente: "Verdi S.r.l.",
    roi: "6,10%",
    dscr: "1,25",
    score: 68,
    tone: "buono",
    giudizio: "Buono",
  },
] as const;

export default function StyleguidePage() {
  // Vetrina dei componenti: utile in sviluppo, ma su un'istanza cliente sarebbe
  // una pagina pubblica non protetta dal middleware (che copre solo /app).
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header>
        <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
          advisorhub — fase 1
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Styleguide</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Token e componenti del design system. Ogni interattivo espone gli stati default, hover,
          focus (Tab), disabled, loading ed error.
        </p>
      </header>

      <section aria-labelledby="sg-colori" className="mt-12">
        <h2 id="sg-colori" className="text-xl font-semibold">
          Colore
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tokens.map((t) => (
            <div key={t.name}>
              <div className={`h-12 rounded-md ${t.cls}`} />
              <p className="mt-1.5 font-mono text-xs text-muted-foreground">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="sg-tipo" className="mt-12">
        <h2 id="sg-tipo" className="text-xl font-semibold">
          Tipografia
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          IBM Plex Sans per l&apos;interfaccia, IBM Plex Mono con cifre tabulari per i dati.
        </p>
        <dl className="mt-4 space-y-4">
          {typeScale.map((t) => (
            <div key={t.label} className="grid gap-1 sm:grid-cols-[220px_1fr] sm:items-baseline">
              <dt className="text-xs text-muted-foreground">{t.label}</dt>
              <dd className={t.cls}>{t.sample}</dd>
            </div>
          ))}
          <div className="grid gap-1 sm:grid-cols-[220px_1fr] sm:items-baseline">
            <dt className="text-xs text-muted-foreground">Dati (mono, tabular)</dt>
            <dd className="font-mono nums text-sm">1.234.567 € · 550.000 € · −120.000 €</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="sg-bottoni" className="mt-12">
        <h2 id="sg-bottoni" className="text-xl font-semibold">
          Bottoni
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secondario</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Distruttivo</Button>
          <Button disabled>Disabilitato</Button>
        </div>
      </section>

      <section aria-labelledby="sg-form" className="mt-12">
        <h2 id="sg-form" className="text-xl font-semibold">
          Form
        </h2>
        <div className="mt-4 grid max-w-md gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="sg-nome">Ragione sociale</Label>
            <Input id="sg-nome" placeholder="Es. Rossi S.r.l." />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sg-err">Fatturato (errore)</Label>
            <Input id="sg-err" aria-invalid defaultValue="abc" aria-describedby="sg-err-msg" />
            <p id="sg-err-msg" className="text-xs text-danger-foreground">
              Inserisci un importo valido, es. 2.800.000
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sg-dis">Campo disabilitato</Label>
            <Input id="sg-dis" disabled placeholder="Non modificabile" />
          </div>
        </div>
      </section>

      <section aria-labelledby="sg-badge" className="mt-12">
        <h2 id="sg-badge" className="text-xl font-semibold">
          Giudizi KPI
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pallino + etichetta: il colore non è mai l&apos;unico canale.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <JudgmentBadge tone="eccellente">Ottimo</JudgmentBadge>
          <JudgmentBadge tone="buono">Buono</JudgmentBadge>
          <JudgmentBadge tone="attenzione">Attenzione</JudgmentBadge>
          <JudgmentBadge tone="critico">Critico</JudgmentBadge>
          <JudgmentBadge tone="nd">n.d.</JudgmentBadge>
        </div>
      </section>

      <section aria-labelledby="sg-tabella" className="mt-12">
        <h2 id="sg-tabella" className="text-xl font-semibold">
          Tabella dati
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">DSCR</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Giudizio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.cliente}>
                  <TableCell className="font-medium">{r.cliente}</TableCell>
                  <TableCell className="text-right font-mono nums">{r.roi}</TableCell>
                  <TableCell className="text-right font-mono nums">{r.dscr}</TableCell>
                  <TableCell className="text-right font-mono nums">{r.score}</TableCell>
                  <TableCell>
                    <JudgmentBadge tone={r.tone}>{r.giudizio}</JudgmentBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section aria-labelledby="sg-card" className="mt-12">
        <h2 id="sg-card" className="text-xl font-semibold">
          Card e caricamento
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                  DSCR
                </span>
                <JudgmentBadge tone="buono">Buono</JudgmentBadge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono nums text-3xl font-semibold tracking-tight">1,40</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Copre il servizio del debito con margine di sicurezza (soglia bancaria 1,2).
              </p>
            </CardContent>
          </Card>
          <Card aria-busy="true">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="sg-toast" className="mt-12">
        <h2 id="sg-toast" className="text-xl font-semibold">
          Feedback
        </h2>
        <div className="mt-4">
          <ToastDemo />
        </div>
      </section>
    </main>
  );
}
