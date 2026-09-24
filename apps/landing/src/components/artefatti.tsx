import { analizza, formatEuro, formatNumero } from "@finbeacon/engine";

import {
  ANALISI_ESEMPIO,
  BILANCIO_ESEMPIO,
  CLIENTE_ESEMPIO,
  ESERCIZIO_ESEMPIO,
  PREVISIONALE_ESEMPIO,
  STUDIO_ESEMPIO,
} from "@/lib/esempio";
import { sinteticoDaScore } from "@/lib/fasce";
import { righeIndicatori } from "@/lib/indicatori";
import { PORTAFOGLIO_ESEMPIO } from "@/lib/portafoglio-esempio";

import { SchedaDscr } from "./deck";
import { Giudizio, SEGNO_TONO, TESTO_TONO } from "./giudizio";

/**
 * Gli ARTEFATTI del giro guidato: un pezzo di prodotto per ogni funzione, resi
 * dal server con i numeri del motore. Nessuno è una fotografia dell'interfaccia:
 * sono ricostruiti con gli stessi token, quindi restano nitidi e leggeri.
 *
 * Tutti decorativi (`aria-hidden` nel contenitore che li ospita): il testo che
 * li descrive sta nella voce del giro, e il lettore di schermo legge quello.
 */

function Riquadro({
  titolo,
  nota,
  children,
}: {
  titolo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[0.8rem] border border-bordo bg-superficie p-5 shadow-[0_1.5rem_3rem_-2rem_oklch(0.22_0.012_250/0.35)] sm:p-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-filetto pb-3">
        <p className="etichetta text-testo-attenuato">{titolo}</p>
        {nota && <p className="text-xs text-testo-attenuato">{nota}</p>}
      </div>
      {children}
    </div>
  );
}

/** 1. Il portafoglio, come nel cruscotto: prima chi ha più bisogno. */
export function ArtefattoPortafoglio() {
  return (
    <Riquadro titolo="Da rivedere per primi" nota={`${PORTAFOGLIO_ESEMPIO.length} clienti`}>
      <ul>
        {PORTAFOGLIO_ESEMPIO.map((c) => {
          const s = sinteticoDaScore(c.analisi.score);
          const { dscr, dscrProspettico } = c.analisi.indicatori;
          return (
            <li
              key={c.nome}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-filetto py-3 last:border-b-0 sm:grid-cols-[2.25rem_minmax(0,1fr)_4rem_8.5rem]"
            >
              <span
                className={`cifre text-right text-[1.0625rem] font-semibold ${TESTO_TONO[s.tone]}`}
              >
                {c.analisi.score}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.nome}</span>
                <span className="block truncate text-xs text-testo-attenuato">
                  Esercizio {c.esercizio}
                  {(c.dscrSotto || c.dscr6mSotto) && (
                    <span className="cifre">
                      {" · "}
                      {c.dscrSotto && dscr !== null && `DSCR ${formatNumero(dscr, 2)}`}
                      {c.dscrSotto && c.dscr6mSotto && " · "}
                      {c.dscr6mSotto && dscrProspettico !== null && (
                        <span className="text-critico-testo">
                          6M {formatNumero(dscrProspettico, 2)}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </span>
              <span className="hidden h-1 rounded-full bg-tonale sm:block">
                <span
                  className={`block h-full rounded-full ${SEGNO_TONO[s.tone]}`}
                  style={{ width: `${Math.max(0, Math.min(100, c.analisi.score))}%` }}
                />
              </span>
              <span className="text-xs">
                <Giudizio tono={s.tone}>{s.label}</Giudizio>
              </span>
            </li>
          );
        })}
      </ul>
    </Riquadro>
  );
}

/** 2. Due righe dell'analisi: valore, riferimento, giudizio e il consiglio. */
export function ArtefattoIndicatori() {
  const righe = righeIndicatori(ANALISI_ESEMPIO, ["ros", "gi", "dscr"]);
  return (
    <Riquadro titolo={CLIENTE_ESEMPIO} nota={`Esercizio ${ESERCIZIO_ESEMPIO}`}>
      <ul>
        {righe.map((r) => (
          <li key={r.chiave} className="border-b border-filetto py-3.5 last:border-b-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
              <span className="min-w-0">
                <span className="text-sm font-semibold">{r.titolo}</span>
                <span className="block truncate text-xs text-testo-attenuato">{r.soglia}</span>
              </span>
              <span className="cifre text-sm">{r.valore}</span>
              <span className="text-xs">
                <Giudizio tono={r.giudizio.tone}>{r.giudizio.label}</Giudizio>
              </span>
            </div>
            <p className="mt-2 text-[0.8125rem] leading-snug text-testo-attenuato">
              {r.giudizio.azione}
            </p>
          </li>
        ))}
      </ul>
    </Riquadro>
  );
}

/** 3. La scheda del DSCR prospettico, la stessa dell'hero. */
export function ArtefattoDscr() {
  return (
    <div className="@container" style={{ fontSize: "min(11px, 3.1cqw)" }}>
      <SchedaDscr ombra />
    </div>
  );
}

/** 4. Il simulatore: una leva, prima e dopo. Calcolato dal motore, non raccontato. */
export function ArtefattoSimulatore() {
  const leva = 40_000;
  const prima = ANALISI_ESEMPIO;
  const dopo = analizza(BILANCIO_ESEMPIO, {
    ...PREVISIONALE_ESEMPIO,
    liquiditaIniziale: PREVISIONALE_ESEMPIO.liquiditaIniziale + leva,
  });
  const riga = (etichetta: string, a: typeof prima) => (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-filetto py-3.5 last:border-b-0">
      <span className="etichetta text-testo-attenuato">{etichetta}</span>
      <span className={`cifre text-2xl font-semibold ${TESTO_TONO[a.giudizi.dscrPro.tone]}`}>
        {formatNumero(a.indicatori.dscrProspettico!, 2)}
      </span>
      <span className="text-xs">
        <Giudizio tono={a.giudizi.dscrPro.tone}>{a.giudizi.dscrPro.label}</Giudizio>
      </span>
    </div>
  );
  return (
    <Riquadro titolo="Simulatore · DSCR prospettico" nota={CLIENTE_ESEMPIO}>
      <div className="mt-4 rounded-[0.5rem] bg-tonale px-4 py-3 text-sm">
        Liquidità iniziale <span className="cifre font-semibold">+{formatEuro(leva)}</span>
      </div>
      <div className="mt-2">
        {riga("Prima", prima)}
        {riga("Dopo", dopo)}
      </div>
      <p className="mt-3 text-xs leading-snug text-testo-attenuato">
        Il punteggio annuale resta {dopo.score}: il DSCR a sei mesi guarda la cassa, non il bilancio
        chiuso.
      </p>
    </Riquadro>
  );
}

/** 5. La copertina del report, come esce dal generatore. */
export function ArtefattoReport() {
  const s = sinteticoDaScore(ANALISI_ESEMPIO.score);
  return (
    <div className="carta mx-auto flex aspect-[1/1.3] max-w-[20rem] flex-col rounded-[0.5rem] border border-bordo bg-superficie p-6 shadow-[0_1.5rem_3rem_-1.5rem_oklch(0.22_0.012_250/0.4)]">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-[0.25rem] bg-testo text-[0.625rem] font-semibold text-superficie">
          {STUDIO_ESEMPIO.slice(0, 1)}
        </span>
        <span className="text-xs font-semibold">{STUDIO_ESEMPIO}</span>
      </div>
      <div className="mt-8 border-t border-filetto pt-4">
        <p className="etichetta text-testo-attenuato">Analisi economico-finanziaria</p>
        <p className="mt-2 text-xl leading-tight font-semibold">{CLIENTE_ESEMPIO}</p>
        <p className="mt-1 text-xs text-testo-attenuato">Esercizio {ESERCIZIO_ESEMPIO}</p>
      </div>
      <div className="mt-auto border-t border-filetto pt-4">
        <p className="etichetta text-testo-attenuato">Punteggio di sintesi</p>
        <p className={`cifre mt-1 text-4xl leading-none font-semibold ${TESTO_TONO[s.tone]}`}>
          {ANALISI_ESEMPIO.score}
        </p>
        <p className="mt-1 text-xs text-testo-attenuato">{ANALISI_ESEMPIO.sintesi.titolo}</p>
      </div>
    </div>
  );
}

/**
 * 6. Le scadenze del portafoglio. Date fisse di esempio, non relative a oggi:
 * uno stato come «scaduta» scritto in una pagina statica invecchierebbe da solo.
 */
const SCADENZE = [
  {
    data: "30 set 2026",
    cliente: "Tessitura Val Lemme S.r.l.",
    cosa: "Aggiornare il piano di tesoreria",
  },
  { data: "15 ott 2026", cliente: CLIENTE_ESEMPIO, cosa: "Ripetere il DSCR prospettico" },
  {
    data: "31 ott 2026",
    cliente: "Logistica Portonovo S.r.l.",
    cosa: "Acquisire la situazione al 30 settembre",
  },
  {
    data: "30 nov 2026",
    cliente: "Frantoio Colle Aperto S.r.l.",
    cosa: "Verifica periodica degli indicatori",
  },
] as const;

export function ArtefattoScadenze() {
  return (
    <Riquadro titolo="Scadenze" nota="prossime">
      <ul>
        {SCADENZE.map((s, i) => (
          <li
            key={s.cosa}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-filetto py-3.5 last:border-b-0"
          >
            <span className={`cifre text-sm ${i === 0 ? "font-semibold" : "text-testo-attenuato"}`}>
              {s.data}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{s.cosa}</span>
              <span className="block truncate text-xs text-testo-attenuato">{s.cliente}</span>
            </span>
          </li>
        ))}
      </ul>
    </Riquadro>
  );
}
