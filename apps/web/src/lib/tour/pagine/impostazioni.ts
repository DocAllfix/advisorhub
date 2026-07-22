import type { DriveStep } from "driver.js";

import { creaTour } from "../config";

/** Tour delle impostazioni dello studio. */
export function tourImpostazioni(demo: boolean) {
  const passi: DriveStep[] = [
    {
      element: '[data-tour="persone-studio"]',
      popover: {
        title: "Le persone dello studio",
        description:
          "Chi ha accesso e con quale ruolo: il titolare gestisce tutto, i collaboratori lavorano sul portafoglio. Ognuno vede solo i clienti di questo studio.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  if (demo) {
    passi.unshift({
      element: '[data-tour="banner-demo"]',
      popover: {
        title: "Cosa è disattivato",
        description:
          "Nella versione dimostrativa la rinomina dello studio, gli inviti e la gestione delle persone sono in sola lettura: puoi vederli, non modificarli.",
        side: "bottom",
        align: "start",
      },
    });
  } else {
    passi.push({
      element: '[data-tour="invito"]',
      popover: {
        title: "Invita un collaboratore",
        description:
          "Inserisci l'email e genera l'invito: comparirà qui sotto con un link da copiare e inviare. Chi lo accetta entra in questo studio.",
        side: "top",
        align: "start",
      },
    });
  }

  const tour = creaTour("impostazioni", passi);
  tour.drive();
  return tour;
}
