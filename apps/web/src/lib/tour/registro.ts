import type { Driver } from "driver.js";

import { azzeraTour } from "./config";

export interface VoceRegistro {
  /** Identificativo usato per ricordare che è già stato visto. */
  id: string;
  /** Percorso a cui si applica. L'ordine conta: vince il primo che combacia. */
  percorso: RegExp;
  /** Nome leggibile, usato nel suggerimento del pulsante "?". */
  etichetta: string;
  /**
   * Avvia il tour; riceve se lo studio è dimostrativo.
   *
   * Asincrono: il modulo del tour, e con lui driver.js, si scarica solo qui.
   * Il registro sta nella barra in alto di ogni pagina, e prima lo importava
   * staticamente, portando la libreria su ogni pagina anche quando nessun
   * tour partiva.
   */
  avvia: (demo: boolean) => Promise<Driver>;
}

/**
 * Registro dei tour. **L'ordine è significativo**: i percorsi più specifici
 * vanno prima dei più generici, altrimenti `/app/clienti/<id>` verrebbe
 * catturato dall'elenco clienti.
 */
export const REGISTRO: VoceRegistro[] = [
  {
    id: "analisi",
    percorso: /^\/app\/clienti\/[^/]+\/analisi/,
    etichetta: "Analisi",
    avvia: (demo) => import("./pagine/analisi").then((t) => t.tourAnalisi(demo)),
  },
  {
    id: "scheda-cliente",
    percorso: /^\/app\/clienti\/[^/]+$/,
    etichetta: "Scheda cliente",
    avvia: (demo) => import("./pagine/scheda-cliente").then((t) => t.tourSchedaCliente(demo)),
  },
  {
    id: "clienti",
    percorso: /^\/app\/clienti\/?$/,
    etichetta: "Portafoglio clienti",
    avvia: (demo) => import("./pagine/clienti").then((t) => t.tourClienti(demo)),
  },
  {
    id: "scadenze",
    percorso: /^\/app\/scadenze/,
    etichetta: "Scadenze",
    avvia: (demo) => import("./pagine/scadenze").then((t) => t.tourScadenze(demo)),
  },
  {
    id: "impostazioni",
    percorso: /^\/app\/impostazioni/,
    etichetta: "Impostazioni",
    avvia: (demo) => import("./pagine/impostazioni").then((t) => t.tourImpostazioni(demo)),
  },
  {
    id: "panoramica",
    percorso: /^\/app\/?$/,
    etichetta: "Panoramica",
    avvia: (demo) => import("./pagine/panoramica").then((t) => t.tourPanoramica(demo)),
  },
];

export function tourPerPercorso(percorso: string): VoceRegistro | null {
  return REGISTRO.find((v) => v.percorso.test(percorso)) ?? null;
}

/** Rilancia il tour della pagina anche se già visto: è il pulsante "?". */
export function rilanciaTour(percorso: string, demo: boolean): boolean {
  const voce = tourPerPercorso(percorso);
  if (!voce) return false;
  azzeraTour(voce.id);
  void voce.avvia(demo);
  return true;
}
