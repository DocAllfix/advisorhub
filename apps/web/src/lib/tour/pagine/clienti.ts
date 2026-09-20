import type { DriveStep } from "driver.js";

import { creaTour } from "../crea-tour";

/**
 * Il primo elemento che corrisponde E si vede.
 *
 * Il portafoglio ha due rese degli stessi dati: la tabella da 768px in su,
 * l'elenco sotto. Entrambe portano gli stessi `data-tour`, ma una delle due e'
 * sempre `display: none`, e un selettore semplice prende la prima nel DOM,
 * che a seconda della larghezza e' quella nascosta. Il passo finirebbe su un
 * riquadro vuoto.
 */
function visibile(selettore: string): () => Element {
  return () =>
    Array.from(document.querySelectorAll(selettore)).find((el) => el.getClientRects().length > 0) ??
    document.querySelector(selettore) ??
    document.body;
}

/** Tour del portafoglio: le viste, la ricerca e la lettura della salute. */
export function tourClienti(demo: boolean) {
  const passi: DriveStep[] = [
    {
      element: '[data-tour="viste"]',
      popover: {
        title: "Tre modi di guardare il portafoglio",
        description:
          "«Attivi» sono i clienti che segui. «In allerta» isola chi è sotto la soglia di attenzione, ed è la vista da cui partire il lunedì mattina. «Archiviati» conserva chi hai messo da parte: nulla va perso, si ripristina quando vuoi.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ricerca"]',
      popover: {
        title: "Cerca nel portafoglio",
        description:
          "Filtra per ragione sociale mentre digiti. Per saltare a un cliente da qualunque pagina puoi anche premere Ctrl+K.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: visibile('[data-tour="colonna-salute"]'),
      popover: {
        title: "La salute a colpo d'occhio",
        description:
          "Punteggio, barra di posizione e giudizio testuale. Il colore non è mai l'unico segnale: accanto c'è sempre l'etichetta, così la lettura resta chiara anche stampata o per chi distingue male i colori.",
        side: "left",
        align: "start",
      },
    },
    {
      element: visibile('[data-tour="riga-cliente"]'),
      popover: {
        title: "Apri un cliente",
        description:
          "Clicca la riga per la scheda, con i suoi bilanci e l'analisi. Il menu a destra apre le azioni: modifica dell'anagrafica e archiviazione.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  if (!demo) {
    passi.push({
      element: '[data-tour="nuovo-cliente"]',
      popover: {
        title: "Aggiungi un'azienda",
        description:
          "Servono solo la ragione sociale e, se vuoi, codice ATECO e dimensione: sono i dati che rendono più contestuale il giudizio.",
        side: "left",
        align: "end",
      },
    });
  }

  const tour = creaTour("clienti", passi);
  tour.drive();
  return tour;
}
