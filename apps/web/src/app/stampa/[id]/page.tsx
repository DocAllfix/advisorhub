import {
  analizza,
  formatEuro,
  formatNumero,
  type DatiBilancio,
  type DatiPrevisionali6M,
} from "@advisorhub/engine";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { INDICATORI } from "@/lib/analisi/indicatori-meta";
import { getCliente } from "@/lib/clienti/queries";
import { etichettaDimensione } from "@/lib/clienti/schema";
import { listEsercizi } from "@/lib/esercizi/queries";

import { BarraStampa } from "./barra-stampa";

type Riga = Awaited<ReturnType<typeof listEsercizi>>[number];

const datiDa = (e: Riga): DatiBilancio => ({
  valProd: e.valProd,
  fatturato: e.fatturato,
  ro: e.ro,
  capInvest: e.capInvest,
  patrNetto: e.patrNetto,
  utileNetto: e.utileNetto,
  ebitda: e.ebitda,
  pfn: e.pfn,
  servizioDebito: e.servizioDebito,
  flussoCassa: e.flussoCassa,
});

const previsionaleDa = (e: Riga): DatiPrevisionali6M | null =>
  e.liquiditaIniziale !== null && e.entrate6m !== null && e.uscite6m !== null && e.debito6m !== null
    ? {
        liquiditaIniziale: e.liquiditaIniziale,
        entrate6m: e.entrate6m,
        uscite6m: e.uscite6m,
        debito6m: e.debito6m,
      }
    : null;

export default async function StampaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ esercizio?: string }>;
}) {
  const { id } = await params;
  const { esercizio: esercizioParam } = await searchParams;

  const cliente = await getCliente(id);
  if (!cliente) notFound();
  const esercizi = await listEsercizi(id);
  if (esercizi.length === 0) notFound();

  const e = esercizi.find((x) => x.id === esercizioParam) ?? esercizi[0]!;
  const dati = datiDa(e);
  const previsionale = previsionaleDa(e);
  const a = analizza(dati, previsionale ?? undefined);

  const studio = await auth.api.getFullOrganization({ headers: await headers() }).catch(() => null);

  const dataOggi = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const grandezze: [string, number][] = [
    ["Valore della produzione", dati.valProd],
    ["Fatturato", dati.fatturato],
    ["Reddito operativo", dati.ro],
    ["EBITDA / MOL", dati.ebitda],
    ["Utile netto", dati.utileNetto],
    ["Capitale investito", dati.capInvest],
    ["Patrimonio netto", dati.patrNetto],
    ["PFN", dati.pfn],
    ["Servizio del debito", dati.servizioDebito],
    ["Flusso di cassa operativo", dati.flussoCassa],
  ];

  return (
    // Il report resta sempre su fondo chiaro, anche con l'app in tema scuro:
    // è un documento destinato alla carta e al cliente.
    <div className="forza-chiaro min-h-screen bg-background text-foreground">
      <BarraStampa clienteId={cliente.id} esercizioId={e.id} />

      <main className="report mx-auto max-w-[820px] px-6 py-8 print:max-w-none print:px-0 print:py-0">
        {/* ---------- Pagina 1: intestazione e sintesi ---------- */}
        <section className="pagina">
          <header className="flex items-start justify-between gap-6 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold">{studio?.name ?? "Studio"}</p>
              <p className="text-xs text-muted-foreground">Analisi economico-finanziaria</p>
            </div>
            <p className="nums text-xs text-muted-foreground">{dataOggi}</p>
          </header>

          <div className="mt-6">
            <h1 className="text-2xl font-bold tracking-tight">{cliente.ragioneSociale}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Esercizio {e.anno}
              {cliente.dimensione
                ? ` · ${etichettaDimensione[cliente.dimensione as keyof typeof etichettaDimensione]}`
                : ""}
              {cliente.codiceAteco ? ` · ATECO ${cliente.codiceAteco}` : ""}
            </p>
          </div>

          <div className="blocco mt-6 rounded-lg border border-border p-4">
            <div className="flex items-start gap-5">
              <div className="shrink-0 text-center">
                <div className="nums text-4xl font-bold leading-none">{a.score}</div>
                <div className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  /100
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
                  Valutazione di sintesi
                </p>
                <h2 className="mt-0.5 text-lg font-semibold">{a.sintesi.titolo}</h2>
                <p className="mt-1 text-sm text-foreground/80">{a.sintesi.descrizione}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
                Cosa guardare adesso
              </p>
              <ul className="mt-1.5 space-y-1 text-sm">
                <li>
                  <b>Marginalità:</b> {a.giudizi.ros.testo}
                </li>
                <li>
                  <b>Efficienza del capitale:</b> {a.giudizi.turnover.testo}
                </li>
                <li>
                  <b>Sostenibilità del debito:</b> {a.giudizi.gi.testo}
                </li>
                <li>
                  <b>DSCR:</b> {a.giudizi.dscr.testo}
                </li>
              </ul>
              <p className="mt-3 text-sm">
                <b>Azione prioritaria:</b> {a.azionePrioritaria}
              </p>
            </div>
          </div>

          <div className="blocco mt-5">
            <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
              Dati di bilancio
            </h2>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {grandezze.map(([etichetta, valore], i) => (
                  <tr key={etichetta} className={i % 2 ? "bg-muted/40" : ""}>
                    <td className="py-1 pl-2">{etichetta}</td>
                    <td className="nums py-1 pr-2 text-right font-mono">{formatEuro(valore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- Pagina 2: indicatori e DSCR 6M ---------- */}
        <section className="pagina">
          <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
            Indicatori
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {INDICATORI.map((meta) => {
              const g = a.giudizi[meta.chiave];
              return (
                <div key={meta.chiave} className="blocco rounded-lg border border-border p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{meta.titolo}</span>
                    <span className="text-[11px] font-medium">{g.label}</span>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">{meta.formula}</p>
                  <p className="nums mt-1 font-mono text-xl font-bold">{meta.valore(a, dati)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{meta.extra(a, dati)}</p>
                  <p className="mt-1.5 text-[11px]">
                    <b>Cosa puoi fare:</b> {g.azione}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="blocco mt-4 rounded-lg border border-border p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">DSCR Prospettico 6M</h2>
              <span className="text-[11px] font-medium">{a.giudizi.dscrPro.label}</span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              (Liquidità iniziale + Entrate 6M − Uscite 6M) / Debito da servire 6M — soglia CNDCEC
              1,1
            </p>
            {a.indicatori.dscrProspettico === null ? (
              <p className="mt-2 text-sm text-muted-foreground">{a.giudizi.dscrPro.testo}</p>
            ) : (
              <>
                <p className="nums mt-1 font-mono text-xl font-bold">
                  {a.indicatori.dscrProspettico >= 99
                    ? "∞"
                    : formatNumero(a.indicatori.dscrProspettico, 2)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Disponibilità 6M{" "}
                  {a.indicatori.disponibile6m !== null
                    ? formatEuro(a.indicatori.disponibile6m)
                    : "n.d."}
                </p>
                <p className="mt-1.5 text-sm">{a.giudizi.dscrPro.testo}</p>
                <p className="mt-1 text-[11px]">
                  <b>Cosa puoi fare:</b> {a.giudizi.dscrPro.azione}
                </p>
              </>
            )}
          </div>
        </section>

        {/* ---------- Pagina 3: letture e note ---------- */}
        <section className="pagina-ultima">
          <div className="grid grid-cols-2 gap-3">
            <div className="blocco rounded-lg border border-border p-3">
              <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
                Punti di forza
              </h2>
              <ul className="mt-1.5 space-y-1 text-sm">
                {a.puntiForza.map((v, i) => (
                  <li key={i}>• {v.txt}</li>
                ))}
              </ul>
            </div>
            <div className="blocco rounded-lg border border-border p-3">
              <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
                Aree di attenzione
              </h2>
              <ul className="mt-1.5 space-y-1 text-sm">
                {a.areeAttenzione.map((v, i) => (
                  <li key={i}>• {v.txt}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="blocco mt-4">
            <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
              Analisi estesa
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed">{a.analisiEstesa}</p>
          </div>

          <div className="blocco mt-4 rounded-lg border border-border p-3">
            <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
              Soglie di riferimento
            </h2>
            <p className="nums mt-1.5 text-[11px] text-muted-foreground">
              ROS &gt; 10% ottimo · Turnover &gt; 1 ottimo · ROI &gt; 8% ottimo · ROE 5-15% buono ·
              GI &lt; 2 anni ottimo · DSCR &gt; 1,5 ottimo · DSCR 6M &gt; 1,1 (CNDCEC)
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Leggi gli indicatori in relazione a settore, dimensione e ciclo: un ROS del 5% può
              essere ottimo in distribuzione e critico nel software, così come un Turnover sotto 1
              può essere normale nel manifatturiero capital intensive.
            </p>
          </div>

          <footer className="mt-6 border-t border-border pt-3 text-[10px] text-muted-foreground">
            <p>
              {studio?.name ?? "Studio"} · {cliente.ragioneSociale} · Esercizio {e.anno} ·{" "}
              {dataOggi}
            </p>
            <p className="mt-1">
              Analisi gestionale, non costituisce giudizio legale o fiscale. Elaborata su dati
              forniti dal cliente.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
