/**
 * Memoria dei tour guidati: cosa e' gia' stato visto.
 *
 * Questo modulo NON importa driver.js. Lo usano la barra in alto e la pagina di
 * analisi a ogni caricamento, per sapere se far partire la guida; se portasse
 * con se' la libreria, la si scaricherebbe su ogni pagina anche quando nessun
 * tour parte. La costruzione vera sta in `crea-tour.ts`, caricato solo quando
 * un tour si avvia.
 *
 * Il tono dei tour segue PRODUCT.md: "calma operativa". *
 * Il tono segue PRODUCT.md: "calma operativa". Chi usa advisorhub sta
 * lavorando, non giocando: nessun rimbalzo, nessuna esuberanza. Un velo
 * leggero che de-enfatizza il resto e un anello attorno all'elemento di cui
 * si sta parlando.
 *
 * La memoria di "già visto" sta nel browser, non sul database. È la scelta
 * giusta per due motivi: le credenziali dimostrative sono condivise fra più
 * commercialisti, quindi sul database il primo consumerebbe il tour per tutti;
 * e chi cambia computer è meglio che riveda la guida piuttosto che non
 * rivederla mai.
 */

const PREFISSO_TOUR = "advisorhub:tour:";
const CHIAVE_BENVENUTO = "advisorhub:tour:benvenuto";

export function tourCompletato(idPagina: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREFISSO_TOUR + idPagina) === "1";
  } catch {
    // Navigazione in incognito con storage negato: il tour riparte, non è grave
    return false;
  }
}

export function segnaTourCompletato(idPagina: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFISSO_TOUR + idPagina, "1");
  } catch {
    /* storage non disponibile: si prosegue senza memoria */
  }
}

export function azzeraTour(idPagina: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFISSO_TOUR + idPagina);
  } catch {
    /* niente da azzerare */
  }
}

/** Il benvenuto parte una volta sola per browser, non una per pagina. */
export function benvenutoMostrato(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHIAVE_BENVENUTO) === "1";
  } catch {
    return false;
  }
}

export function segnaBenvenutoMostrato(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHIAVE_BENVENUTO, "1");
  } catch {
    /* storage non disponibile */
  }
}

/** Azzera tutto: usato dal menu "Rivedi la guida". */
export function azzeraTuttiITour(): void {
  if (typeof window === "undefined") return;
  try {
    const daRimuovere: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const chiave = window.localStorage.key(i);
      if (chiave?.startsWith(PREFISSO_TOUR)) daRimuovere.push(chiave);
    }
    daRimuovere.forEach((c) => window.localStorage.removeItem(c));
  } catch {
    /* storage non disponibile */
  }
}
