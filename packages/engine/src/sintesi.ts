import { formatEuro, formatNumero as N } from "./numeri";
import type { DatiBilancio, Giudizio, Indicatori, Sintesi, VoceElenco } from "./types";

type Giudizi = {
  ros: Giudizio;
  turnover: Giudizio;
  roi: Giudizio;
  roiI: Giudizio;
  roe: Giudizio;
  gi: Giudizio;
  dscr: Giudizio;
  dscrPro: Giudizio;
};

/**
 * Media arrotondata dei 7 score storici (ROS, Turnover, ROI, ROI-I, ROE, GI, DSCR).
 * Il DSCR prospettico 6M non concorre alla media (come nel prototipo v3c2):
 * ha una lettura autonoma di continuità aziendale.
 */
export function calcolaScore(g: Giudizi): number {
  return Math.round(
    (g.ros.score +
      g.turnover.score +
      g.roi.score +
      g.roiI.score +
      g.roe.score +
      g.gi.score +
      g.dscr.score) /
      7,
  );
}

/**
 * Fasce di salute: le soglie stanno QUI e in nessun altro posto.
 *
 * Erano riscritte anche in apps/web/src/lib/analisi/panoramica.ts, e due copie
 * degli stessi numeri divergono al primo che si tocca — con la dashboard che
 * mostra una fascia e il report un'altra, senza che niente fallisca.
 */
export type FasciaSalute = "ristrutturare" | "fragile" | "migliorabile" | "sana" | "eccellente";

export const FASCE_SALUTE: readonly { chiave: FasciaSalute; sotto: number }[] = [
  { chiave: "ristrutturare", sotto: 30 },
  { chiave: "fragile", sotto: 55 },
  { chiave: "migliorabile", sotto: 75 },
  { chiave: "sana", sotto: 90 },
  { chiave: "eccellente", sotto: Infinity },
] as const;

/** Fascia di salute di un punteggio 0-100. */
export function fasciaSalute(score: number): FasciaSalute {
  return (FASCE_SALUTE.find((f) => score < f.sotto) ?? FASCE_SALUTE[FASCE_SALUTE.length - 1]!)
    .chiave;
}

export function calcolaSintesi(score: number): Sintesi {
  if (score < 30) {
    return {
      titolo: "Ristrutturazione necessaria",
      descrizione:
        "Indicatori in tensione. Priorità: marginalità e sostenibilità del debito. Servono azioni correttive immediate su pricing, costi fissi e capitale circolante.",
    };
  }
  if (score < 55) {
    return {
      titolo: "Equilibrio fragile",
      descrizione:
        "Azienda che sta in piedi ma non crea valore sufficiente. Lavora su efficienza operativa e rotazione del capitale per liberare cassa.",
    };
  }
  if (score < 75) {
    return {
      titolo: "Solida, migliorabile",
      descrizione:
        "Buone basi industriali. Puoi spingere su crescita selettiva e ottimizzazione finanziaria per alzare ROI e ROE.",
    };
  }
  if (score < 90) {
    return {
      titolo: "Azienda sana e bancabile",
      descrizione:
        "Profilo equilibrato tra redditività e struttura finanziaria. Ideale per sostenere investimenti e trattare condizioni bancarie migliori.",
    };
  }
  return {
    titolo: "Eccellenza gestionale",
    descrizione:
      "Performance top. Mantieni disciplina su capitale investito e presidia il rischio di eccesso di leva o sotto-investimento.",
  };
}

export function calcolaAzionePrioritaria(score: number): string {
  if (score < 35) return "Riduci immediatamente PFN e costi fissi, rinegozia affidamenti.";
  if (score < 60) return "Ottimizza capitale circolante e pricing per alzare ROS di 2-3 punti.";
  if (score < 80)
    return "Seleziona investimenti con ROI maggiore dell'attuale e allunga il debito.";
  return "Consolida processi, prepara budget per crescita controllata.";
}

/** Analisi estesa rule-based (fino a 8 frasi), porting fedele del prototipo v3c2. */
export function calcolaAnalisiEstesa(ind: Indicatori, dati: DatiBilancio): string {
  const { ros: v, turnover: k, roi: E, roe: T, gi: M, dscr: x } = ind;
  const D = ind.dscrProspettico;
  const disp = ind.disponibile6m;
  const frasi: string[] = [];

  if (dati.valProd === 0 || dati.capInvest === 0 || dati.patrNetto === 0) {
    frasi.push(
      "Alcuni input fondamentali sono a 0 €: i relativi indicatori risultano n.d. Completa Valore Produzione, Capitale Investito e Patrimonio Netto per una lettura completa.",
    );
  }

  if (v !== null && k !== null) {
    if (v < 3 && k > 1.2) {
      frasi.push(
        `L'azienda mostra un'efficienza commerciale elevata (Turnover ${N(k, 2)}x) ma una redditività operativa contenuta (ROS ${N(v, 2)}%). Significa che vendi molto rispetto al capitale impiegato, ma con margini sottili: il pricing o i costi variabili vanno ricalibrati.`,
      );
    } else if (v > 8 && k < 0.6) {
      frasi.push(
        `Marginalità eccellente (ROS ${N(v, 2)}%) a fronte di un capitale molto intenso (Turnover ${N(k, 2)}x). Il modello è profittevole ma capital-heavy: ogni punto di rotazione in più libera cassa significativa.`,
      );
    } else if (v >= 5 && k >= 1) {
      frasi.push(
        `Combinazione equilibrata tra marginalità (ROS ${N(v, 2)}%) e rotazione (Turnover ${N(k, 2)}x). Il ROI ne beneficia e indica un uso efficace delle risorse industriali.`,
      );
    } else {
      frasi.push(
        `ROS al ${N(v, 2)}% e Turnover a ${N(k, 2)}x definiscono il ROI: ${E !== null ? N(E, 2) + "%" : "n.d."}. Lavorare sul fattore più debole produce l'impatto maggiore.`,
      );
    }
  }

  if (E !== null && T !== null) {
    if (E > 0 && T > E + 4) {
      frasi.push(
        `ROE (${N(T, 2)}%) superiore al ROI (${N(E, 2)}%) segnala leva finanziaria positiva: il debito sta amplificando il rendimento dei soci, da monitorare con il GI.`,
      );
    } else if (E < 4) {
      frasi.push(
        "ROI sotto il 4% indica che il capitale rende meno del suo costo medio. Senza intervento su ROS o rotazione, la crescita richiede capitale esterno.",
      );
    } else {
      frasi.push(
        `ROI al ${N(E, 2)}% e ROE al ${N(T, 2)}% mostrano coerenza tra gestione industriale e remunerazione del rischio imprenditoriale.`,
      );
    }
  }

  // Correzione rispetto al prototipo: con EBITDA ≤ 0 il GI numerico (negativo)
  // finiva nella frase "indebitamento molto sostenibile"; qui prevale la segnalazione.
  if (dati.ebitda <= 0) {
    frasi.push(
      "EBITDA non positivo: la capacità di servizio del debito è compromessa, il GI non è significativo. Ripristinare marginalità operativa è prerequisito a qualsiasi rifinanziamento.",
    );
  } else if (M !== null) {
    if (M < 2) {
      frasi.push(
        `Indebitamento molto sostenibile (GI ${N(M, 2)} anni): hai spazio per investimenti a leva buona, meglio a tasso fisso e durata allineata al piano industriale.`,
      );
    } else if (M < 3.5) {
      frasi.push(
        `GI a ${N(M, 2)} anni in fascia bancabile. Mantieni questa traiettoria allungando scadenze e presidiando il circolante.`,
      );
    } else {
      frasi.push(
        `GI a ${N(M, 2)} anni in area di attenzione: priorità a generazione di cassa, riduzione PFN e negoziazione con istituti.`,
      );
    }
  }

  if (x !== null) {
    if (x < 1) {
      frasi.push(
        `DSCR a ${N(x, 2)}: sotto l'unità, i flussi non coprono il servizio del debito. Criticità finanziaria immediata richiesta dalle banche ai sensi dell'art. 3 CCII.`,
      );
    } else if (x < 1.2) {
      frasi.push(
        `DSCR a ${N(x, 2)}: sotto soglia bancabile 1.2, in area di tensione. Serve miglioramento del flusso o allungamento del debito.`,
      );
    } else if (x < 1.5) {
      frasi.push(
        `DSCR a ${N(x, 2)}: bancabile con buon margine, rispetta soglia 1.2 richiesta per equilibrio prospettico.`,
      );
    } else {
      frasi.push(
        `DSCR a ${N(x, 2)}: ottimo, ampia capacità di copertura del servizio del debito, spazio per leva aggiuntiva sostenibile.`,
      );
    }
  }

  if (D !== null) {
    if (D < 1) {
      frasi.push(
        `DSCR Prospettico 6M a ${N(D, 2)} con disponibilità ${disp !== null ? formatEuro(disp) : "n.d."}: sotto 1, indizio di crisi prospettica ex art. 3 CCII e linee guida CNDCEC, richiede piano di tesoreria immediato.`,
      );
    } else if (D < 1.1) {
      frasi.push(
        `DSCR Prospettico 6M a ${N(D, 2)} in fascia attenzione 1.0-1.1: copertura fragile nei prossimi 6 mesi, presidia incassi e scadenze.`,
      );
    } else if (D < 1.3) {
      frasi.push(
        `DSCR Prospettico 6M a ${N(D, 2)} adeguato: rispetta soglia CNDCEC >1.1 per continuità a 6 mesi.`,
      );
    } else {
      frasi.push(
        `DSCR Prospettico 6M a ${D >= 99 ? "∞" : N(D, 2)} ottimo: ampia capacità prospettica di servizio debito a 6 mesi, nessun segnale di crisi.`,
      );
    }
  }

  frasi.push(
    "Leggi questi numeri in relazione a settore, dimensione e ciclo: un ROS del 5% può essere ottimo in distribuzione e critico in software, così come un Turnover <1 può essere normale in manifatturiero capital intensive.",
  );

  return frasi.slice(0, 8).join(" ");
}

/** Fino a 3 punti di forza, porting fedele del prototipo. */
export function calcolaPuntiForza(ind: Indicatori, g: Giudizi): VoceElenco[] {
  const out: VoceElenco[] = [];
  if (ind.ros !== null && ind.ros >= 8)
    out.push({ k: "ROS", txt: `ROS ${N(ind.ros, 2)}% eccellente, pricing difeso` });
  if (ind.turnover !== null && ind.turnover >= 1)
    out.push({ k: "TURN", txt: `Turnover ${N(ind.turnover, 2)}x, capitale che lavora bene` });
  if (ind.roi !== null && ind.roi >= 8)
    out.push({ k: "ROI", txt: `ROI ${N(ind.roi, 2)}% crea valore sopra WACC` });
  if (ind.roe !== null && ind.roe >= 10)
    out.push({ k: "ROE", txt: `ROE ${N(ind.roe, 2)}% remunera bene il rischio` });
  if (ind.gi !== null && ind.gi < 3)
    out.push({ k: "GI", txt: `GI ${N(ind.gi, 2)} anni, debito sostenibile` });
  if (ind.dscr !== null && ind.dscr >= 1.5)
    out.push({ k: "DSCR", txt: `DSCR ${N(ind.dscr, 2)} ottimo, copertura solida` });
  else if (ind.dscr !== null && ind.dscr >= 1.2)
    out.push({ k: "DSCR", txt: `DSCR ${N(ind.dscr, 2)} bancabile, equilibrio prospettico` });
  if (ind.dscrProspettico !== null && ind.dscrProspettico >= 1.3)
    out.push({
      k: "DSCR6M",
      txt: `DSCR 6M ${ind.dscrProspettico >= 99 ? "∞" : N(ind.dscrProspettico, 2)} ottimo, continuità CNDCEC ok`,
    });
  else if (ind.dscrProspettico !== null && ind.dscrProspettico >= 1.1)
    out.push({ k: "DSCR6M", txt: `DSCR 6M ${N(ind.dscrProspettico, 2)} adeguato` });
  if (ind.ic !== null && ind.ic < 1)
    out.push({
      k: "IC",
      txt: `IC ${N(ind.ic, 2)} € capitale per 1€ fatturato, modello snello`,
    });

  if (out.length < 3) {
    if (g.ros.label === "Buono" || g.ros.label === "Ottimo")
      out.push({ k: "ROS", txt: `Marginalità ${g.ros.label.toLowerCase()} stabile` });
    if (g.turnover.label === "Buono" || g.turnover.label === "Ottimo")
      out.push({ k: "TURN", txt: `Rotazione ${g.turnover.label.toLowerCase()} del capitale` });
    if (g.roi.label === "Buono" || g.roi.label === "Ottimo")
      out.push({
        k: "ROI",
        txt: `Rendimento capitale investito ${g.roi.label.toLowerCase()}`,
      });
    if (g.dscr.label === "Buono" || g.dscr.label === "Ottimo")
      out.push({ k: "DSCR", txt: `Capacità rimborso ${g.dscr.label.toLowerCase()}` });
  }
  return out.slice(0, 3);
}

/** Fino a 3 aree di attenzione, porting fedele del prototipo. */
export function calcolaAreeAttenzione(ind: Indicatori): VoceElenco[] {
  const out: VoceElenco[] = [];
  if (ind.ros !== null && ind.ros < 5)
    out.push({
      k: "ROS",
      txt:
        ind.ros < 2
          ? `ROS ${N(ind.ros, 2)}% critico, rivedi pricing e costi fissi`
          : `ROS ${N(ind.ros, 2)}% migliorabile, ottimizza mix e sconti`,
    });
  if (ind.turnover !== null && ind.turnover < 0.7)
    out.push({
      k: "TURN",
      txt: `Turnover ${N(ind.turnover, 2)}x basso, accelera incassi e rotazione stock`,
    });
  if (ind.roi !== null && ind.roi < 5)
    out.push({ k: "ROI", txt: `ROI ${N(ind.roi, 2)}% non genera ricchezza autonoma` });
  if (ind.roe !== null && ind.roe < 5)
    out.push({ k: "ROE", txt: `ROE ${N(ind.roe, 2)}% sotto mercato, verifica oneri finanziari` });
  if (ind.gi !== null && ind.gi >= 3.5)
    out.push({ k: "GI", txt: `GI ${N(ind.gi, 2)} anni in attenzione, riduci PFN` });
  if (ind.dscr !== null && ind.dscr < 1)
    out.push({ k: "DSCR", txt: `DSCR ${N(ind.dscr, 2)} critico, non copre servizio debito` });
  else if (ind.dscr !== null && ind.dscr < 1.2)
    out.push({ k: "DSCR", txt: `DSCR ${N(ind.dscr, 2)} sotto soglia 1.2, tensione bancaria` });
  if (ind.dscrProspettico !== null && ind.dscrProspettico < 1)
    out.push({
      k: "DSCR6M",
      txt: `DSCR 6M ${N(ind.dscrProspettico, 2)} critico, non copre - crisi probabile ex art. 3 CCII`,
    });
  else if (ind.dscrProspettico !== null && ind.dscrProspettico < 1.1)
    out.push({
      k: "DSCR6M",
      txt: `DSCR 6M ${N(ind.dscrProspettico, 2)} attenzione, sotto soglia CNDCEC 1.1`,
    });
  if (ind.ros === null) out.push({ k: "ROS", txt: "Valore Produzione a 0, ROS non calcolabile" });
  if (ind.turnover === null || ind.roi === null)
    out.push({ k: "CAP", txt: "Capitale Investito a 0, Turnover e ROI n.d." });
  if (ind.roe === null) out.push({ k: "ROE", txt: "Patrimonio Netto a 0, ROE non calcolabile" });
  if (ind.dscr === null) out.push({ k: "DSCR", txt: "Servizio Debito a 0, DSCR non calcolabile" });

  if (out.length === 0) {
    out.push(
      { k: "OK", txt: "Nessuna criticità evidente sui 7 indicatori + DSCR 6M" },
      { k: "OK", txt: "Mantieni disciplina su capitale circolante" },
      { k: "OK", txt: "Presidia pricing e contratti indicizzati" },
    );
  }
  return out.slice(0, 3);
}
