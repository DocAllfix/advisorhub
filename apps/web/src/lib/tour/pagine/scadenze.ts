import type { DriveStep } from "driver.js";

import { creaTour } from "../config";

/** Tour dello scadenzario. */
export function tourScadenze(demo: boolean) {
  const passi: DriveStep[] = [
    {
      element: '[data-tour="filtri-scadenze"]',
      popover: {
        title: "Da fare, completate, tutte",
        description:
          "Il numero accanto a ogni filtro dice quante scadenze contiene. Di norma resti su «Da fare»: è l'elenco di ciò che resta aperto.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="elenco-scadenze"]',
      popover: {
        title: "Ordinate per data, con il loro stato",
        description:
          "«Scaduta da N giorni» in rosso, «Oggi» e le prossime in ambra, il resto in grigio. Ogni voce può essere legata a un cliente o essere generale dello studio.",
        side: "top",
        align: "start",
      },
    },
  ];

  if (!demo) {
    passi.push(
      {
        element: '[data-tour="completa-scadenza"]',
        popover: {
          title: "Segna come fatta",
          description:
            "Un clic sul cerchio la completa e la toglie dall'elenco. La ritrovi sempre nel filtro «Completate», e da lì puoi riaprirla.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nuova-scadenza"]',
        popover: {
          title: "Aggiungi un adempimento",
          description:
            "Titolo, data e categoria (bilancio, IVA, imposte, contributi...). Collegandola a un cliente la ritrovi nel suo contesto; lasciandola libera resta una scadenza dello studio.",
          side: "left",
          align: "end",
        },
      },
    );
  }

  const tour = creaTour("scadenze", passi);
  tour.drive();
  return tour;
}
