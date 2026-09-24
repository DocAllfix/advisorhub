import type { DriveStep } from "driver.js";

import { creaTour } from "../crea-tour";

/**
 * Tour della Panoramica: è anche il benvenuto, quindi il primo passo non
 * evidenzia nulla e si limita a dire dove si è arrivati.
 */
export function tourPanoramica(demo: boolean) {
  const passi: DriveStep[] = [
    {
      popover: {
        title: "Benvenuto in FinBeacon",
        description:
          "In un minuto ti mostro come si legge la salute del portafoglio e come si arriva al report da consegnare al cliente. Puoi uscire quando vuoi con Esc, e ritrovare questa guida dal punto interrogativo in alto.",
      },
    },
    {
      element: '[data-tour="scena"]',
      popover: {
        title: "Il punteggio dello studio",
        description:
          "L'anello è la media dei punteggi dei clienti analizzati. Accanto non trovi solo il numero: una frase interpreta il dato e dice se il portafoglio regge o dove sta scivolando.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="grandezze"]',
      popover: {
        title: "I numeri da presidiare",
        description:
          "Clienti seguiti, quanti sono sotto la soglia di attenzione, quanti hanno il DSCR sotto 1,2 e quante scadenze sono aperte. In ambra e in rosso solo ciò che richiede una mossa.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="distribuzione"]',
      popover: {
        title: "Come è distribuito il portafoglio",
        description:
          "La barra mostra quanti clienti stanno in ciascuna fascia di salute, dall'eccellenza alla ristrutturazione. È il colpo d'occhio sullo stato complessivo dello studio.",
        side: "top",
        align: "start",
      },
    },
    {
      element: '[data-tour="da-rivedere"]',
      popover: {
        title: "Da rivedere per primi",
        description:
          "I clienti ordinati dal punteggio più basso: è la lista su cui agire. Clicca una riga per aprire direttamente la sua analisi.",
        side: "top",
        align: "start",
      },
    },
    {
      element: '[data-tour="nav"]',
      popover: {
        title: "Come ci si muove",
        description:
          "Da qui raggiungi il portafoglio clienti, le scadenze e le impostazioni dello studio. In alto a destra la ricerca rapida: premi Ctrl+K da qualunque punto per saltare a un cliente.",
        side: "right",
        align: "start",
      },
    },
  ];

  if (demo) {
    passi.push({
      popover: {
        title: "Stai usando la versione dimostrativa",
        description:
          "Puoi consultare tutto, usare il simulatore e scaricare il report dei due clienti di esempio. Non puoi invece aggiungere clienti o modificarne i dati: dove è disattivato, l'app te lo dice esplicitamente.",
      },
    });
  }

  const tour = creaTour("panoramica", passi);
  tour.drive();
  return tour;
}
