import { formatNumero } from "@advisorhub/engine";
import { AlertTriangle, ArrowRight, CalendarClock, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { panoramicaStudio, type FasciaSalute } from "@/lib/analisi/panoramica";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";
import { contatoreScadenze } from "@/lib/scadenze/queries";

const FASCE: { chiave: FasciaSalute; label: string; colore: string }[] = [
  { chiave: "eccellente", label: "Eccellenti", colore: "var(--primary)" },
  { chiave: "sana", label: "Sane", colore: "var(--success)" },
  { chiave: "migliorabile", label: "Migliorabili", colore: "var(--chart-3)" },
  { chiave: "fragile", label: "Fragili", colore: "var(--warning)" },
  { chiave: "ristrutturare", label: "Da ristrutturare", colore: "var(--danger)" },
];

function DistribuzioneSalute({
  distribuzione,
  totale,
}: {
  distribuzione: Record<FasciaSalute, number>;
  totale: number;
}) {
  const presenti = FASCE.filter((f) => distribuzione[f.chiave] > 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
        Distribuzione della salute
      </p>
      {/* Barra segmentata: un colpo d'occhio su come sta il portafoglio */}
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        {presenti.map((f) => (
          <div
            key={f.chiave}
            style={{
              width: `${(distribuzione[f.chiave] / totale) * 100}%`,
              backgroundColor: f.colore,
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {FASCE.map((f) => (
          <li key={f.chiave} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: f.colore }}
              aria-hidden
            />
            <span className="nums font-mono font-semibold">{distribuzione[f.chiave]}</span>
            <span className="truncate text-xs text-muted-foreground">{f.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tessera({
  etichetta,
  valore,
  nota,
  icona: Icona,
  allerta = false,
}: {
  etichetta: string;
  valore: string;
  nota: string;
  icona: typeof Users;
  allerta?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icona
          className={allerta ? "size-4 text-warning" : "size-4 text-muted-foreground"}
          aria-hidden
        />
        <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
          {etichetta}
        </p>
      </div>
      <p className="nums mt-2 font-mono text-3xl font-semibold tracking-tight">{valore}</p>
      <p className="mt-1 text-xs text-muted-foreground">{nota}</p>
    </div>
  );
}

export default async function PanoramicaPage() {
  const [p, scad] = await Promise.all([panoramicaStudio(), contatoreScadenze()]);

  if (p.totaleClienti === 0) {
    return (
      <div>
        <header>
          <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {p.nomeStudio}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Panoramica</h1>
        </header>
        <div className="mt-8">
          <EmptyState
            icon={Users}
            titolo="La panoramica si popola con i tuoi clienti"
            descrizione="Aggiungi la prima azienda per vedere qui punteggi di sintesi, segnali di allerta e le posizioni da presidiare."
            azione={
              <Button asChild>
                <Link href="/app/clienti">
                  <Plus className="size-4" />
                  Aggiungi il primo cliente
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const daAnalizzare = p.totaleClienti - p.conAnalisi;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {p.nomeStudio}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Panoramica</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            La salute del portafoglio in un colpo d&apos;occhio.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/clienti">
            Vai al portafoglio
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tessera
          etichetta="Clienti seguiti"
          valore={String(p.totaleClienti)}
          nota={
            daAnalizzare > 0
              ? `${daAnalizzare} ancora da analizzare`
              : "tutti con almeno un esercizio"
          }
          icona={Users}
        />
        <Tessera
          etichetta="Punteggio medio"
          valore={p.punteggioMedio === null ? "—" : `${p.punteggioMedio}`}
          nota={p.conAnalisi > 0 ? `su ${p.conAnalisi} analizzati` : "nessuna analisi"}
          icona={TrendingUp}
        />
        <Tessera
          etichetta="In allerta"
          valore={String(p.inAllerta)}
          nota="punteggio sotto 55"
          icona={AlertTriangle}
          allerta={p.inAllerta > 0}
        />
        <Tessera
          etichetta="DSCR sotto soglia"
          valore={String(p.dscrSottoSoglia)}
          nota={`${p.dscr6mSottoSoglia} anche sul prospettico 6M`}
          icona={AlertTriangle}
          allerta={p.dscrSottoSoglia > 0}
        />
      </div>

      {(scad.scadute > 0 || scad.inArrivo > 0) && (
        <Link
          href="/app/scadenze"
          className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <CalendarClock
            className={scad.scadute > 0 ? "size-5 text-danger" : "size-5 text-warning"}
            aria-hidden
          />
          <p className="flex-1 text-sm">
            {scad.scadute > 0 && (
              <span className="font-semibold text-danger-foreground">
                {scad.scadute} {scad.scadute === 1 ? "scadenza scaduta" : "scadenze scadute"}
              </span>
            )}
            {scad.scadute > 0 && scad.inArrivo > 0 && <span className="text-muted-foreground"> · </span>}
            {scad.inArrivo > 0 && (
              <span className="text-muted-foreground">{scad.inArrivo} in arrivo a 30 giorni</span>
            )}
          </p>
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      )}

      {p.conAnalisi > 0 && (
        <div className="mt-4">
          <DistribuzioneSalute distribuzione={p.distribuzione} totale={p.conAnalisi} />
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Da rivedere per primi
          </h2>
          <p className="text-xs text-muted-foreground">dal punteggio più basso</p>
        </div>

        {p.righe.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={TrendingUp}
              titolo="Nessun cliente ancora analizzato"
              descrizione="Carica i dati di bilancio di un esercizio per vedere qui i punteggi e le priorità."
              azione={
                <Button asChild>
                  <Link href="/app/clienti">Vai al portafoglio</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {p.righe.slice(0, 8).map((r) => {
              const s = sinteticoDaScore(r.score ?? 0);
              const dscrBasso = r.dscr !== null && r.dscr < 1.2;
              const dscr6mBasso = r.dscrProspettico !== null && r.dscrProspettico < 1.1;
              return (
                <li key={r.clienteId} className="relative">
                  <Link
                    href={`/app/clienti/${r.clienteId}/analisi`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="nums w-10 shrink-0 font-mono text-lg font-semibold">
                      {r.score}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{r.ragioneSociale}</span>
                      <span className="block text-xs text-muted-foreground">
                        Esercizio {r.anno ?? "—"}
                      </span>
                    </span>
                    <JudgmentBadge tone={s.tone}>{s.label}</JudgmentBadge>
                    {dscrBasso && (
                      <JudgmentBadge tone="critico">DSCR {formatNumero(r.dscr!, 2)}</JudgmentBadge>
                    )}
                    {dscr6mBasso && (
                      <JudgmentBadge tone="attenzione">
                        6M {formatNumero(r.dscrProspettico!, 2)}
                      </JudgmentBadge>
                    )}
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
