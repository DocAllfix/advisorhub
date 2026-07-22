import { driver as creaDriver, type Config, type Driver, type DriveStep } from "driver.js";

/**
 * Configurazione dei tour guidati.
 *
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

export const CONFIG_BASE: Partial<Config> = {
  showProgress: true,
  allowClose: true,
  smoothScroll: true,
  // Durante il tour l'elemento evidenziato non è cliccabile: evita che
  // l'utente apra un pannello mentre la guida sta parlando d'altro.
  disableActiveInteraction: true,
  stagePadding: 6,
  stageRadius: 10,
  popoverClass: "tour-advisorhub",
  overlayColor: "oklch(0.12 0.012 250)",
  overlayOpacity: 0.6,
  nextBtnText: "Avanti",
  prevBtnText: "Indietro",
  doneBtnText: "Ho capito",
  progressText: "{{current}} di {{total}}",
};

/**
 * Costruisce un tour.
 *
 * Attenzione ai pulsanti: in driver.js registrare `onNextClick`,
 * `onPrevClick` o `onCloseClick` **sostituisce** il comportamento predefinito.
 * Se non si richiama esplicitamente `moveNext()` / `movePrevious()` /
 * `destroy()`, i pulsanti smettono di funzionare. È il difetto in cui si
 * inciampa più spesso, e qui è gestito: ogni callback fa avanzare il tour, e
 * sull'ultimo passo "Avanti" diventa la chiusura.
 */
export function creaTour(
  idPagina: string,
  passi: DriveStep[],
  extra?: Partial<Config>,
): Driver {
  /*
   * Chiusura in un punto solo. Serve perché `destroy()` scavalca di proposito
   * `onDestroyStarted` (evita il ciclo infinito), quindi affidare a
   * quell'hook il "segna come visto" lo perderebbe proprio sulle chiusure
   * volontarie: la X e il pulsante finale. Le due vie di uscita sono:
   *   - Esc e clic sul velo  → passano da onDestroyStarted
   *   - X e "Ho capito"      → passano dai rispettivi callback
   * Entrambe finiscono qui.
   */
  const chiudi = () => {
    segnaTourCompletato(idPagina);
    tour.destroy();
  };

  const tour = creaDriver({
    ...CONFIG_BASE,
    ...extra,
    steps: passi,
    // Registrare questi callback sostituisce l'avanzamento predefinito: se non
    // si richiama moveNext/movePrevious i pulsanti smettono di funzionare.
    onNextClick: () => {
      if (tour.isLastStep()) chiudi();
      else tour.moveNext();
    },
    onPrevClick: () => tour.movePrevious(),
    onCloseClick: chiudi,
    onDestroyStarted: chiudi,
  });
  return tour;
}
