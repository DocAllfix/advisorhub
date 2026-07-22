import type { DriveStep } from "driver.js";

import { creaTour } from "../config";

/**
 * Tour dell'Analisi: è la schermata che vende il prodotto, quindi i passi
 * spiegano non solo dove sono le cose ma perché sono lette così.
 */
export function tourAnalisi(_demo: boolean) {
  const passi: DriveStep[] = [
    {
      element: '[data-tour="scena"]',
      popover: {
        title: "Il verdetto sull'esercizio",
        description:
          "Punteggio da 0 a 100, giudizio di sintesi e la frase che lo spiega. Se il cliente ha più esercizi vedi anche la variazione rispetto all'anno precedente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="azione-prioritaria"]',
      popover: {
        title: "Cosa fare per primo",
        description:
          "L'azione con l'impatto maggiore, più quattro letture rapide: marginalità, efficienza del capitale, sostenibilità del debito e DSCR. È il paragrafo da dire al cliente appena si siede.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="famiglia-indicatori"]',
      popover: {
        title: "Gli indicatori, raggruppati",
        description:
          "Non un elenco piatto ma tre famiglie: quanto rende la gestione, quanto lavora il capitale, se il debito è sostenibile. Valori e barre sono incolonnati per confrontarli senza rileggere le etichette.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="riga-indicatore"]',
      popover: {
        title: "Valore, soglia e consiglio",
        description:
          "Ogni indicatore mostra il suo valore e, sotto, cosa puoi fare. «Cosa significa» apre la formula e la spiegazione estesa: utile quando il cliente chiede da dove esce il numero.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="dscr-6m"]',
      popover: {
        title: "Continuità aziendale",
        description:
          "Il DSCR prospettico a 6 mesi secondo le linee guida CNDCEC, art. 3 del Codice della crisi. È l'unico riquadro incorniciato della pagina, perché è il dato che documenta il monitoraggio, non un indicatore fra gli altri.",
        side: "top",
        align: "start",
      },
    },
    {
      element: '[data-tour="trend"]',
      popover: {
        title: "Andamento tra esercizi",
        description:
          "Un grafico per grandezza, mai due scale sullo stesso asse. Con «Mostra tabella» passi ai numeri esatti, comodi da leggere o da citare.",
        side: "top",
        align: "start",
      },
    },
    {
      element: '[data-tour="simula"]',
      popover: {
        title: "Il simulatore",
        description:
          "Apre 14 cursori per rispondere alla domanda che conta: «se rinegoziamo il debito, il DSCR torna sopra soglia?». Indicatori e punteggio si ricalcolano subito, e i dati salvati non vengono toccati.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="scarica-pdf"]',
      popover: {
        title: "Il report da consegnare",
        description:
          "Scarica il PDF con tutto quello che vedi qui, impaginato come un documento: verdetto, indicatori con le loro soglie, continuità aziendale e dati di bilancio. È l'artefatto che dai al cliente o alla banca.",
        side: "bottom",
        align: "end",
      },
    },
  ];

  const tour = creaTour("analisi", passi);
  tour.drive();
  return tour;
}

/**
 * Tour del simulatore, lanciato a parte quando i cursori sono a schermo:
 * spiegarli mentre sono chiusi non avrebbe senso.
 */
export function tourSimulatore() {
  const passi: DriveStep[] = [
    {
      element: '[data-tour="simulatore"]',
      popover: {
        title: "I 14 valori simulabili",
        description:
          "Sono divisi in quattro gruppi con le stesse categorie del form di inserimento: conto economico, struttura patrimoniale, struttura finanziaria e previsionale a 6 mesi.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="cursore"]',
      popover: {
        title: "Cursore o tastiera",
        description:
          "Trascina per esplorare, oppure scrivi la cifra esatta nel campo accanto. Gli estremi sono calcolati sul valore vero del cliente, così ogni spostamento conta. Sotto resta sempre indicato il valore salvato.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="dscr-sim"]',
      popover: {
        title: "Il DSCR sempre sott'occhio",
        description:
          "I quattro cursori previsionali comandano il DSCR a 6 mesi: il valore aggiornato è qui accanto, così non devi scorrere la pagina per vedere l'effetto.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="ripristina"]',
      popover: {
        title: "Si torna sempre indietro",
        description:
          "«Ripristina» riporta ai valori salvati, «Esci dalla simulazione» chiude i cursori. Nulla di quello che provi qui viene scritto sui dati del cliente.",
        side: "bottom",
        align: "end",
      },
    },
  ];

  const tour = creaTour("simulatore", passi);
  tour.drive();
  return tour;
}
