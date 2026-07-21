import { formatNumero } from "@advisorhub/engine";
import { AlertTriangle, ArrowRight, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { panoramicaStudio } from "@/lib/analisi/panoramica";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";

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
  const p = await panoramicaStudio();

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
