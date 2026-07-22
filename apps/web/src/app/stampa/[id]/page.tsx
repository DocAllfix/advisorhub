import {
  analizza,
  formatEuro,
  formatNumero,
  type Analisi,
  type DatiBilancio,
  type DatiPrevisionali6M,
  type Tono,
} from "@advisorhub/engine";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { JudgmentBadge } from "@/components/ui/judgment-badge";
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

const coloreTono: Record<Tono, string> = {
  eccellente: "var(--primary)",
  buono: "var(--success)",
  attenzione: "var(--warning)",
  critico: "var(--danger)",
  nd: "var(--muted-foreground)",
};

/** Anello di progresso, come nelle card del report del committente. */
function Anello({
  percentuale,
  colore,
  dimensione = 52,
  spessore = 5,
}: {
  percentuale: number;
  colore: string;
  dimensione?: number;
  spessore?: number;
}) {
  const r = (dimensione - spessore) / 2;
  const c = 2 * Math.PI * r;
  const quota = (Math.max(0, Math.min(100, percentuale)) / 100) * c;
  return (
    <svg width={dimensione} height={dimensione} className="-rotate-90 shrink-0">
      <circle
        cx={dimensione / 2}
        cy={dimensione / 2}
        r={r}
        stroke="var(--muted)"
        strokeWidth={spessore}
        fill="none"
      />
      <circle
        cx={dimensione / 2}
        cy={dimensione / 2}
        r={r}
        stroke={colore}
        strokeWidth={spessore}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${quota} ${c}`}
      />
    </svg>
  );
}

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
  const a: Analisi = analizza(dati, previsionale ?? undefined);

  const studio = await auth.api.getFullOrganization({ headers: await headers() }).catch(() => null);
  const dataOggi = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const coloreScore =
    a.score < 35
      ? "var(--danger)"
      : a.score < 60
        ? "var(--warning)"
        : a.score < 85
          ? "var(--success)"
          : "var(--primary)";

  const chip = [
    { k: "ROS", g: a.giudizi.ros },
    { k: "TURN", g: a.giudizi.turnover },
    { k: "ROI", g: a.giudizi.roi },
    { k: "ROI-I", g: a.giudizi.roiI },
    { k: "ROE", g: a.giudizi.roe },
    { k: "GI", g: a.giudizi.gi },
    { k: "DSCR", g: a.giudizi.dscr },
  ];

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
    <div className="forza-chiaro min-h-screen bg-background text-foreground">
      <BarraStampa clienteId={cliente.id} esercizioId={e.id} />

      <main className="report mx-auto max-w-4xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
        {/* ---------- Pagina 1: intestazione, sintesi, dati ---------- */}
        <section className="pagina">
          <header className="flex items-start justify-between gap-6 border-b-2 border-primary/30 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/15 font-bold text-primary">
                {(studio?.name ?? "S").slice(0, 1)}
              </span>
              <div>
                <p className="text-sm font-semibold">{studio?.name ?? "Studio"}</p>
                <p className="text-xs text-muted-foreground">Analisi economico-finanziaria</p>
              </div>
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

          {/* Sintesi con anello, come nel report del committente */}
          <div className="blocco mt-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex items-center gap-5 sm:w-1/2">
                <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
                  <Anello
                    percentuale={a.score}
                    colore={coloreScore}
                    dimensione={108}
                    spessore={9}
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <div className="nums font-mono text-3xl font-bold leading-none">
                        {a.score}
                      </div>
                      <div className="text-[10px] tracking-widest uppercase text-muted-foreground">
                        /100
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
                    Valutazione di sintesi
                  </p>
                  <h2 className="mt-0.5 text-lg font-semibold">{a.sintesi.titolo}</h2>
                  <p className="mt-1 text-xs text-foreground/70">{a.sintesi.descrizione}</p>
                </div>
              </div>

              <div className="sm:w-1/2 sm:border-l sm:border-border sm:pl-5">
                <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
                  Cosa guardare adesso
                </p>
                <ul className="mt-1.5 space-y-1 text-xs">
                  <li>
                    <b>Marginalità:</b> {a.giudizi.ros.testo}
                  </li>
                  <li>
                    <b>Efficienza:</b> {a.giudizi.turnover.testo}
                  </li>
                  <li>
                    <b>Sostenibilità:</b> {a.giudizi.gi.testo}
                  </li>
                  <li>
                    <b>DSCR:</b> {a.giudizi.dscr.testo}
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
              {chip.map((c) => (
                <JudgmentBadge key={c.k} tone={c.g.tone}>
                  {c.k}: {c.g.label}
                </JudgmentBadge>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">
              <span className="font-semibold">Azione prioritaria: </span>
              {a.azionePrioritaria}
            </p>
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

        {/* ---------- Pagina 2+: card indicatori come la dashboard ---------- */}
        <section className="pagina">
          <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
            Indicatori
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {INDICATORI.map((meta) => {
              const g = a.giudizi[meta.chiave];
              return (
                <div
                  key={meta.chiave}
                  className="blocco rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{meta.titolo}</h3>
                        <JudgmentBadge tone={g.tone}>{g.label}</JudgmentBadge>
                      </div>
                      <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                        {meta.sottotitolo}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <Anello percentuale={meta.percentuale(a, dati)} colore={coloreTono[g.tone]} />
                      <span className="nums absolute inset-0 grid place-items-center font-mono text-[10px] text-muted-foreground">
                        {Math.round(meta.percentuale(a, dati))}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 inline-block rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {meta.formula}
                  </p>
                  <p className="nums mt-1.5 font-mono text-2xl font-bold tracking-tight">
                    {meta.valore(a, dati)}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/70">
                    {meta.descrizione}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{meta.extra(a, dati)}</p>
                  <p className="mt-1.5 text-[11px]">
                    <b>Cosa puoi fare:</b> {g.azione}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="blocco mt-3 rounded-xl border-2 border-primary/25 bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold">DSCR Prospettico 6M</h2>
                  <JudgmentBadge tone={a.giudizi.dscrPro.tone}>
                    {a.giudizi.dscrPro.label}
                  </JudgmentBadge>
                </div>
                <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                  Continuità aziendale · CNDCEC, art. 3 CCII
                </p>
              </div>
              {a.indicatori.dscrProspettico !== null && (
                <div className="relative shrink-0">
                  <Anello
                    percentuale={Math.min(100, (a.indicatori.dscrProspettico / 1.5) * 100)}
                    colore={coloreTono[a.giudizi.dscrPro.tone]}
                  />
                </div>
              )}
            </div>
            <p className="mt-2 inline-block rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              (Liquidità + Entrate 6M − Uscite 6M) / Debito 6M — soglia CNDCEC 1,1
            </p>
            {a.indicatori.dscrProspettico === null ? (
              <p className="mt-2 text-sm text-muted-foreground">{a.giudizi.dscrPro.testo}</p>
            ) : (
              <>
                <p className="nums mt-1.5 font-mono text-2xl font-bold">
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
                <p className="mt-1.5 text-[11px]">
                  <b>Cosa puoi fare:</b> {a.giudizi.dscrPro.azione}
                </p>
              </>
            )}
          </div>
        </section>

        {/* ---------- Pagina 3: letture e note ---------- */}
        <section className="pagina-ultima">
          <div className="grid grid-cols-2 gap-3">
            <div className="blocco rounded-xl border border-success/30 bg-success-subtle p-4">
              <h2 className="text-[11px] font-semibold tracking-wide uppercase text-success-foreground">
                Punti di forza
              </h2>
              <ul className="mt-1.5 space-y-1 text-sm">
                {a.puntiForza.map((v, i) => (
                  <li key={i}>• {v.txt}</li>
                ))}
              </ul>
            </div>
            <div className="blocco rounded-xl border border-warning/40 bg-warning-subtle p-4">
              <h2 className="text-[11px] font-semibold tracking-wide uppercase text-warning-foreground">
                Aree di attenzione
              </h2>
              <ul className="mt-1.5 space-y-1 text-sm">
                {a.areeAttenzione.map((v, i) => (
                  <li key={i}>• {v.txt}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="blocco mt-4 rounded-xl border border-border bg-card p-4">
            <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
              Analisi estesa
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed">{a.analisiEstesa}</p>
          </div>

          <div className="blocco mt-4 rounded-xl border border-border bg-card p-4">
            <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
              Soglie di riferimento
            </h2>
            <p className="nums mt-1.5 text-[11px] text-muted-foreground">
              ROS &gt; 10% ottimo · Turnover &gt; 1 ottimo · ROI &gt; 8% ottimo · ROE 5-15% buono ·
              GI &lt; 2 anni ottimo · DSCR &gt; 1,5 ottimo · DSCR 6M &gt; 1,1 (CNDCEC)
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              <b>Nota metodo:</b> il Turnover è calcolato sul fatturato mentre il ROS sul valore
              della produzione, quindi ROI ≈ ROS × Turnover è un&apos;approssimazione. Leggi gli
              indicatori in relazione a settore, dimensione e ciclo.
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
