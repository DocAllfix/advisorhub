import type { Driver } from "driver.js";

import { azzeraTour } from "./config";
import { tourAnalisi } from "./pagine/analisi";
import { tourClienti } from "./pagine/clienti";
import { tourImpostazioni } from "./pagine/impostazioni";
import { tourPanoramica } from "./pagine/panoramica";
import { tourScadenze } from "./pagine/scadenze";
import { tourSchedaCliente } from "./pagine/scheda-cliente";

export interface VoceRegistro {
  /** Identificativo usato per ricordare che è già stato visto. */
  id: string;
  /** Percorso a cui si applica. L'ordine conta: vince il primo che combacia. */
  percorso: RegExp;
  /** Nome leggibile, usato nel suggerimento del pulsante "?". */
  etichetta: string;
  /** Avvia il tour; riceve se lo studio è dimostrativo. */
  avvia: (demo: boolean) => Driver;
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
    avvia: tourAnalisi,
  },
  {
    id: "scheda-cliente",
    percorso: /^\/app\/clienti\/[^/]+$/,
    etichetta: "Scheda cliente",
    avvia: tourSchedaCliente,
  },
  {
    id: "clienti",
    percorso: /^\/app\/clienti\/?$/,
    etichetta: "Portafoglio clienti",
    avvia: tourClienti,
  },
  {
    id: "scadenze",
    percorso: /^\/app\/scadenze/,
    etichetta: "Scadenze",
    avvia: tourScadenze,
  },
  {
    id: "impostazioni",
    percorso: /^\/app\/impostazioni/,
    etichetta: "Impostazioni",
    avvia: tourImpostazioni,
  },
  {
    id: "panoramica",
    percorso: /^\/app\/?$/,
    etichetta: "Panoramica",
    avvia: tourPanoramica,
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
  voce.avvia(demo);
  return true;
}
