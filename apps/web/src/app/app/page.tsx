import { formatNumero, sintetizzaPortafoglio, type Tono } from "@advisorhub/engine";
import { ArrowRight, CalendarClock, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Cifra } from "@/components/ui/cifra";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { MicroEtichetta } from "@/components/ui/micro-etichetta";
import { Scena } from "@/components/ui/scena";
import { panoramicaStudio, type FasciaSalute } from "@/lib/analisi/panoramica";
import { sinteticoDaScore } from "@/lib/analisi/sintesi-breve";
import { toniGrafica, toniTesto } from "@/lib/analisi/toni";
import { cn } from "@/lib/utils";
import { contatoreScadenze } from "@/lib/scadenze/queries";

/*
 * Le fasce prendono il colore dalla stessa scala dei badge: scriverli a mano
 * qui faceva sì che "Eccellenti" fosse ottanio in legenda e verde nel badge
 * della riga sottostante, sulla stessa schermata.
 */
const FASCE: { chiave: FasciaSalute; label: string; tono: Tono }[] = [
  { chiave: "eccellente", label: "Eccellenti", tono: "eccellente" },
  { chiave: "sana", label: "Sane", tono: "buono" },
  { chiave: "migliorabile", label: "Migliorabili", tono: "buono" },
  { chiave: "fragile", label: "Fragili", tono: "attenzione" },
  { chiave: "ristrutturare", label: "Da ristrutturare", tono: "critico" },
];

/** Una grandezza della striscia di stato: separata da filetti, non incassettata. */
function Grandezza({
  etichetta,
  valore,
  colore,
}: {
  etichetta: string;
  valore: string;
  colore?: string;
}) {
  return (
    <div className="sm:px-7 sm:first:pl-0 sm:last:pr-0">
      <Cifra valore={valore} dimensione="sm" style={colore ? { color: colore } : undefined} />
      <MicroEtichetta className="mt-1.5">{etichetta}</MicroEtichetta>
    </div>
  );
}

export default async function PanoramicaPage() {
  const [p, scad] = await Promise.all([panoramicaStudio(), contatoreScadenze()]);

  const sintesi = sintetizzaPortafoglio({
    totaleClienti: p.totaleClienti,
    conAnalisi: p.conAnalisi,
    punteggioMedio: p.punteggioMedio,
    inAllerta: p.inAllerta,
    dscrSottoSoglia: p.dscrSottoSoglia,
    dscr6mSottoSoglia: p.dscr6mSottoSoglia,
  });

  const daAnalizzare = p.totaleClienti - p.conAnalisi;
  const scadenzeAperte = scad.scadute + scad.inArrivo;

  // Studio senza clienti: la scena resta senza anello e diventa un invito
  if (p.totaleClienti === 0) {
    return (
      <Scena
        etichetta={p.nomeStudio}
        punteggio={null}
        titolo={sintesi.titolo}
        frase={sintesi.frase}
        azione={
          <Button asChild>
            <Link href="/app/clienti">
              <Plus className="size-4" />
              Aggiungi il primo cliente
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-9">
      <Scena
        etichetta={p.nomeStudio}
        punteggio={p.punteggioMedio}
        suffisso="su 100"
        tono={p.punteggioMedio === null ? "nd" : sinteticoDaScore(p.punteggioMedio).tone}
        titolo={sintesi.titolo}
        frase={sintesi.frase}
        trend={p.trend}
        delta={
          p.deltaOmogeneo
            ? {
                valore: p.deltaOmogeneo.valore,
                annoPrec: p.deltaOmogeneo.annoPrec,
                nota: `a parità di ${p.deltaOmogeneo.clienti === 1 ? "cliente" : `${p.deltaOmogeneo.clienti} clienti`}`,
              }
            : null
        }
        nota={
          daAnalizzare > 0
            ? `${daAnalizzare} ${daAnalizzare === 1 ? "cliente" : "clienti"} ancora da analizzare`
            : undefined
        }
        azione={
          p.conAnalisi === 0 ? (
            <Button asChild>
              <Link href="/app/clienti">Carica il primo esercizio</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-hairline py-6 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-hairline">
        <Grandezza etichetta="Clienti seguiti" valore={String(p.totaleClienti)} />
        <Grandezza
          etichetta="In allerta"
          valore={String(p.inAllerta)}
          colore={p.inAllerta > 0 ? "var(--warning-foreground)" : undefined}
        />
        <Grandezza
          etichetta="DSCR sotto soglia"
          valore={String(p.dscrSottoSoglia)}
          colore={p.dscrSottoSoglia > 0 ? "var(--danger-foreground)" : undefined}
        />
        {/* Avere scadenze aperte e normale: in rosso va solo cio che e gia scaduto */}
        <Grandezza
          etichetta="Scadenze aperte"
          valore={String(scadenzeAperte)}
          colore={scad.scadute > 0 ? "var(--warning-foreground)" : undefined}
        />
      </div>

      {scadenzeAperte > 0 && (
        <Link
          href="/app/scadenze"
          className="-my-2 flex items-center gap-3 rounded-md py-3 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <CalendarClock
            className={scad.scadute > 0 ? "size-4 shrink-0 text-danger" : "size-4 shrink-0 text-warning"}
            aria-hidden
          />
          <p className="flex-1 text-sm">
            {scad.scadute > 0 && (
              <span className="font-semibold text-danger-foreground">
                {scad.scadute} {scad.scadute === 1 ? "scadenza scaduta" : "scadenze scadute"}
              </span>
            )}
            {scad.scadute > 0 && scad.inArrivo > 0 && (
              <span className="text-muted-foreground"> · </span>
            )}
            {scad.inArrivo > 0 && (
              <span className="text-muted-foreground">{scad.inArrivo} in arrivo a 30 giorni</span>
            )}
          </p>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      )}

      {p.conAnalisi > 0 && (
        <section>
          <MicroEtichetta come="h2">Distribuzione della salute</MicroEtichetta>
          <div className="mt-3 flex h-1.5 w-full gap-0.5" aria-hidden>
            {FASCE.filter((f) => p.distribuzione[f.chiave] > 0).map((f) => (
              <div
                key={f.chiave}
                className="h-full rounded-full"
                style={{
                  width: `${(p.distribuzione[f.chiave] / p.conAnalisi) * 100}%`,
                  backgroundColor: toniGrafica[f.tono],
                }}
              />
            ))}
          </div>
          <ul className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2">
            {FASCE.map((f) => {
              const n = p.distribuzione[f.chiave];
              // Le classi a zero restano leggibili ma non competono con le piene
              return (
                <li
                  key={f.chiave}
                  className={cn("flex items-center gap-2 text-sm", n === 0 && "opacity-45")}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: toniGrafica[f.tono] }}
                    aria-hidden
                  />
                  <span className="nums font-mono font-semibold">{n}</span>
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {p.righe.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <MicroEtichetta come="h2">Da rivedere per primi</MicroEtichetta>
            <Link
              href="/app/clienti"
              className="flex min-h-11 items-center text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:min-h-0"
            >
              Tutto il portafoglio
            </Link>
          </div>

          <ul className="mt-3 border-t border-hairline">
            {p.righe.slice(0, 8).map((r) => {
              const s = sinteticoDaScore(r.score ?? 0);
              const dscrBasso = r.dscr !== null && r.dscr < 1.2;
              const dscr6mBasso = r.dscrProspettico !== null && r.dscrProspettico < 1.1;
              return (
                <li key={r.clienteId} className="border-b border-hairline">
                  <Link
                    href={`/app/clienti/${r.clienteId}/analisi`}
                    className="flex items-center gap-4 py-3.5 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Cifra
                      valore={r.score}
                      dimensione="sm"
                      className="w-11 shrink-0 text-right"
                      style={{ color: toniTesto[s.tone] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{r.ragioneSociale}</span>
                      <span className="block text-xs text-muted-foreground">
                        Esercizio {r.anno ?? "—"}
                      </span>
                    </span>
                    <span className="hidden h-1 w-24 shrink-0 rounded-full bg-muted md:block" aria-hidden>
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, r.score ?? 0))}%`,
                          backgroundColor: toniGrafica[s.tone],
                        }}
                      />
                    </span>
                    <JudgmentBadge tone={s.tone}>{s.label}</JudgmentBadge>
                    <span className="nums hidden w-36 shrink-0 text-right font-mono text-xs text-muted-foreground lg:block">
                      {dscrBasso && `DSCR ${formatNumero(r.dscr!, 2)}`}
                      {dscrBasso && dscr6mBasso && " · "}
                      {dscr6mBasso && `6M ${formatNumero(r.dscrProspettico!, 2)}`}
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
