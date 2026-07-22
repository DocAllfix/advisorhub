import type { DriveStep } from "driver.js";

import { creaTour } from "../config";

/** Tour della scheda cliente: la salute corrente e lo storico dei bilanci. */
export function tourSchedaCliente(demo: boolean) {
  const passi: DriveStep[] = [
    {
      element: '[data-tour="salute-cliente"]',
      popover: {
        title: "La salute di questo cliente",
        description:
          "Punteggio e giudizio dell'esercizio più recente, con l'azione prioritaria. Da qui si entra nell'analisi completa.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="tabella-esercizi"]',
      popover: {
        title: "Gli esercizi caricati",
        description:
          "Un anno per riga, con le grandezze principali. La colonna DSCR 6M dice se quell'esercizio ha anche i dati previsionali di tesoreria. Clicca l'anno per rivederne i dati.",
        side: "top",
        align: "start",
      },
    },
    {
      element: '[data-tour="esporta-csv"]',
      popover: {
        title: "Porta via i dati",
        description:
          "Esporta gli esercizi in CSV, con le stesse colonne accettate dall'import: utile per lavorarci in foglio di calcolo o per spostarli.",
        side: "bottom",
        align: "end",
      },
    },
  ];

  if (!demo) {
    passi.push({
      element: '[data-tour="nuovo-esercizio"]',
      popover: {
        title: "Aggiungi un bilancio",
        description:
          "Inserisci le dieci grandezze a mano oppure importa un CSV. I quattro dati di tesoreria a 6 mesi sono facoltativi: servono al DSCR prospettico richiesto dal Codice della crisi.",
        side: "bottom",
        align: "end",
      },
    });
  }

  const tour = creaTour("scheda-cliente", passi);
  tour.drive();
  return tour;
}
