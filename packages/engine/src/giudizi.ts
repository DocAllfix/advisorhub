import type { DatiBilancio, Giudizio, Indicatori } from "./types";

/**
 * Soglie e giudizi qualitativi, porting fedele del prototipo
 * (testi bonificati dagli errori di codifica dell'originale).
 */

export function giudicaRos(ros: number | null): Giudizio {
  if (ros === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "Valore Produzione a 0: imposta un valore per calcolare la marginalità.",
      azione: "Imposta Valore Produzione >0 per calcolare.",
    };
  }
  if (ros < 2) {
    return {
      label: "Critico",
      tone: "critico",
      score: 15,
      testo: "Marginalità insufficiente, la produzione non copre bene i costi caratteristici.",
      azione: "Rivedi listini, taglia costi fissi non core, negozia materie prime.",
    };
  }
  if (ros < 5) {
    return {
      label: "Sufficiente",
      tone: "attenzione",
      score: 50,
      testo: "Marginalità accettabile ma vulnerabile a variazioni di prezzo/costo.",
      azione: "Ottimizza mix prodotti e sconti, riduci sprechi industriali.",
    };
  }
  if (ros < 10) {
    return {
      label: "Buono",
      tone: "buono",
      score: 80,
      testo: "Buon controllo dei costi operativi rispetto al valore prodotto.",
      azione: "Mantieni disciplina, proteggi marginalità con contratti indicizzati.",
    };
  }
  return {
    label: "Ottimo",
    tone: "eccellente",
    score: 100,
    testo: "Eccellente redditività delle vendite, potere di pricing difeso.",
    azione: "Capitalizza: alza barriere, investi in brand e qualità.",
  };
}

export function giudicaTurnover(turnover: number | null): Giudizio {
  if (turnover === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "Capitale Investito a 0: imposta un valore per calcolare rotazione ed efficienza.",
      azione: "Capitale Investito a 0, imposta un valore.",
    };
  }
  if (turnover < 0.5) {
    return {
      label: "Capitale intenso",
      tone: "critico",
      score: 20,
      testo: "Servono molti asset per generare fatturato. Verifica rotazione magazzino e crediti.",
      azione: "Riduci stock, accelera incassi, valuta asset non strategici.",
    };
  }
  if (turnover < 1) {
    return {
      label: "Buono",
      tone: "buono",
      score: 70,
      testo: "Efficienza dell'attivo discreta.",
      azione: "Migliora CCN e utilizzo impianti.",
    };
  }
  if (turnover < 2) {
    return {
      label: "Ottimo",
      tone: "eccellente",
      score: 90,
      testo: "Capitale che lavora bene, modello snello.",
      azione: "Spingi su crescita senza appesantire attivo.",
    };
  }
  return {
    label: "Eccellente",
    tone: "eccellente",
    score: 100,
    testo: "Modello molto efficiente, rischio di sotto-investimento da controllare.",
    azione: "Spingi su crescita senza appesantire attivo.",
  };
}

export function giudicaRoi(roi: number | null): Giudizio {
  if (roi === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "Capitale Investito a 0: impossibile calcolare ROI. Inserisci il capitale investito.",
      azione: "Capitale Investito a 0, ROI non calcolabile.",
    };
  }
  if (roi < 0) {
    return {
      label: "Perdita",
      tone: "critico",
      score: 0,
      testo: "Il capitale investito distrugge valore.",
      azione: "Ferma l'emorragia: taglio costi, focus su clienti profittevoli.",
    };
  }
  if (roi < 4) {
    return {
      label: "Critico",
      tone: "attenzione",
      score: 30,
      testo: "Rendimento inferiore al costo del capitale medio.",
      azione: "Rinegozia fonti, aumenta ROS o turnover.",
    };
  }
  if (roi < 8) {
    return {
      label: "Buono",
      tone: "buono",
      score: 70,
      testo: "Crea valore, copre il costo delle fonti.",
      azione: "Seleziona investimenti con ROI maggiore dell'attuale.",
    };
  }
  return {
    label: "Ottimo",
    tone: "eccellente",
    score: 100,
    testo: "Alta capacità di generare ricchezza sul capitale investito.",
    azione: "Usa l'extra-reddito per innovare e ridurre rischio.",
  };
}

/** Lettura "industriale" del ROI (stesso valore, soglie di sviluppo autonome). */
export function giudicaRoiIndustriale(roi: number | null): Giudizio {
  if (roi === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "Capitale Investito a 0: ROI-I non calcolabile.",
      azione: "Capitale Investito a 0, imposta un valore.",
    };
  }
  if (roi < 0) {
    return {
      label: "Perde valore",
      tone: "critico",
      score: 0,
      testo:
        "Struttura industriale in perdita: necessità di ristrutturazione o apporto di capitale.",
      azione: "Piano industriale di risanamento, controllo di gestione settimanale.",
    };
  }
  if (roi < 5) {
    return {
      label: "Non genera ricchezza",
      tone: "attenzione",
      score: 40,
      testo: "Non abbastanza per sostenere sviluppo autonomo.",
      azione: "Non genera ricchezza: migliora produttività e pricing.",
    };
  }
  return {
    label: "Sostiene sviluppo",
    tone: "buono",
    score: 90,
    testo: "Genera risorse sufficienti per autofinanziare la crescita.",
    azione: "Può autofinanziare la crescita: pianifica investimenti.",
  };
}

export function giudicaRoe(roe: number | null): Giudizio {
  if (roe === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "Patrimonio Netto a 0: imposta il patrimonio per calcolare ROE.",
      azione: "Patrimonio Netto a 0, ROE non calcolabile.",
    };
  }
  if (roe < 0) {
    return {
      label: "Critico",
      tone: "critico",
      score: 0,
      testo: "Il patrimonio viene eroso, rischio patrimoniale.",
      azione: "Ricostituisci patrimonio, verifica continuità aziendale.",
    };
  }
  if (roe < 5) {
    return {
      label: "Basso",
      tone: "attenzione",
      score: 40,
      testo: "Remunerazione del socio sotto mercato.",
      azione: "Migliora leva operativa, riduci oneri finanziari.",
    };
  }
  if (roe < 15) {
    return {
      label: "Buono",
      tone: "buono",
      score: 75,
      testo: "Equilibrio tra rischio imprenditoriale e rendimento.",
      azione: "Ottimo equilibrio, valuta dividendi vs investimenti.",
    };
  }
  return {
    label: "Ottimo",
    tone: "eccellente",
    score: 100,
    testo: "Ottima leva imprenditoriale, verifica sostenibilità nel tempo.",
    azione: "Alto ROE: verifica se dovuto a leva eccessiva.",
  };
}

export function giudicaGi(gi: number | null, dati: Pick<DatiBilancio, "ebitda">): Giudizio {
  if (dati.ebitda <= 0) {
    return {
      label: "Critico",
      tone: "critico",
      score: 0,
      testo: "MOL negativo, incapace di servire il debito. Intervento urgente.",
      azione: "Urgente: piano di rientro, moratoria, cessione asset non core.",
    };
  }
  if (gi === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "EBITDA a 0: imposta EBITDA per calcolare la sostenibilità del debito.",
      azione: "Imposta EBITDA per calcolare.",
    };
  }
  if (gi < 2) {
    return {
      label: "Ottimo",
      tone: "eccellente",
      score: 100,
      testo: "Debito facilmente sostenibile, spazio per investimenti.",
      azione: "Hai spazio per leva buona: investi a tassi fissati.",
    };
  }
  if (gi < 3.5) {
    return {
      label: "Buono",
      tone: "buono",
      score: 80,
      testo: "Indebitamento sotto controllo, bancabilità buona.",
      azione: "Mantieni, allunga scadenze.",
    };
  }
  if (gi < 5) {
    return {
      label: "Attenziona",
      tone: "attenzione",
      score: 50,
      testo: "Soglia di attenzione, negozia scadenze e ottimizza CCN.",
      azione: "Riduci PFN, migliora incassi, posticipa capex non urgenti.",
    };
  }
  return {
    label: "Critico",
    tone: "critico",
    score: 20,
    testo: "Leva eccessiva, rifinanziare e ridurre PFN è prioritario.",
    azione: "Urgente: piano di rientro, moratoria, cessione asset non core.",
  };
}

export function giudicaDscr(dscr: number | null): Giudizio {
  if (dscr === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "Servizio Debito a 0 o flusso non definito: imposta valori per calcolare il DSCR.",
      azione: "Servizio Debito a 0, imposta un valore per calcolare.",
    };
  }
  if (dscr < 0) {
    return {
      label: "Critico",
      tone: "critico",
      score: 0,
      testo: "Flusso di cassa negativo, incapace di servire il debito.",
      azione: "Flussi insufficienti: rinegozia rate, allunga debito, migliora incassi.",
    };
  }
  if (dscr < 1) {
    return {
      label: "Critico",
      tone: "critico",
      score: 15,
      testo: "Non copre il servizio del debito, tensione finanziaria immediata.",
      azione: "Flussi insufficienti: rinegozia rate, allunga debito, migliora incassi.",
    };
  }
  if (dscr < 1.2) {
    return {
      label: "Tensione",
      tone: "attenzione",
      score: 45,
      testo: "Copertura insufficiente, soglia bancaria non raggiunta (richiesto >1.2).",
      azione: "Sotto soglia 1.2: ottimizza CCN e costi per alzare il flusso del 15-20%.",
    };
  }
  if (dscr < 1.5) {
    return {
      label: "Buono",
      tone: "buono",
      score: 80,
      testo: "Bancabile, copre il debito con margine di sicurezza.",
      azione: "Bancabile: mantieni buffer, pianifica il servizio debito su 12 mesi rolling.",
    };
  }
  return {
    label: "Ottimo",
    tone: "eccellente",
    score: 100,
    testo: "Solida capacità di rimborso, spazio per ulteriore leva sostenibile.",
    azione: "Ottima copertura: spazio per leva sostenibile, valuta investimenti a debito buono.",
  };
}

/**
 * DSCR prospettico a 6 mesi, soglie CNDCEC (prototipo v3c2).
 * Non concorre allo score di sintesi: ha un pannello di lettura autonomo.
 */
export function giudicaDscrProspettico(dscrPro: number | null): Giudizio {
  if (dscrPro === null) {
    return {
      label: "n.d.",
      tone: "nd",
      score: 0,
      testo: "Debito 6M a 0 o dati non definiti: imposta valori per il DSCR prospettico.",
      azione: "Inserisci liquidità, entrate, uscite e debito a 6 mesi per calcolare.",
    };
  }
  if (dscrPro < 0) {
    return {
      label: "Critico",
      tone: "critico",
      score: 0,
      testo: "Flussi disponibili negativi, non copre, crisi probabile ex art. 3 CCII.",
      azione: "Piano di tesoreria immediato, rinegozia scadenze, informa l'organo di controllo.",
    };
  }
  if (dscrPro < 1) {
    return {
      label: "Critico",
      tone: "critico",
      score: 10,
      testo: "Non copre, crisi probabile ex art. 3 CCII.",
      azione: "Piano di tesoreria immediato, rinegozia scadenze, informa l'organo di controllo.",
    };
  }
  if (dscrPro < 1.1) {
    return {
      label: "Attenzione",
      tone: "attenzione",
      score: 45,
      testo: "Soglia di attenzione, rischio tensione di cassa nei prossimi 6 mesi.",
      azione:
        "Sotto soglia 1.1 CNDCEC: presidia tesoreria e segnala all'organo di controllo se persistente.",
    };
  }
  if (dscrPro < 1.3) {
    return {
      label: "Adeguato",
      tone: "buono",
      score: 75,
      testo: "Adeguato, sostenibilità prospettica rispettata secondo CNDCEC.",
      azione: "Mantieni il monitoraggio di tesoreria a 6 mesi rolling.",
    };
  }
  return {
    label: "Ottimo",
    tone: "eccellente",
    score: 100,
    testo: "Ottimo, ampia copertura prospettica, nessun segnale di crisi.",
    azione: "Nessun segnale di crisi: mantieni la pianificazione a 6 mesi rolling.",
  };
}

export function calcolaGiudizi(ind: Indicatori, dati: DatiBilancio) {
  return {
    ros: giudicaRos(ind.ros),
    turnover: giudicaTurnover(ind.turnover),
    roi: giudicaRoi(ind.roi),
    roiI: giudicaRoiIndustriale(ind.roi),
    roe: giudicaRoe(ind.roe),
    gi: giudicaGi(ind.gi, dati),
    dscr: giudicaDscr(ind.dscr),
    dscrPro: giudicaDscrProspettico(ind.dscrProspettico),
  };
}
