import { driver as creaDriver, type Config, type Driver, type DriveStep } from "driver.js";

import { segnaTourCompletato } from "./config";

/**
 * Costruzione dei tour: l'unico modulo che importa driver.js.
 *
 * Si carica solo quando un tour parte (import dinamico dal registro e dalla
 * pagina di analisi): la maggior parte delle visite non ne avvia nessuno.
 */

/** Toglie al div fittizio di driver.js gli attributi ARIA che non puo' avere. */
function nascondiFittizio() {
  const fittizio = document.getElementById("driver-dummy-element");
  if (!fittizio) return;
  fittizio.removeAttribute("aria-haspopup");
  fittizio.removeAttribute("aria-expanded");
  fittizio.removeAttribute("aria-controls");
  fittizio.setAttribute("aria-hidden", "true");
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
  popoverClass: "tour-finbeacon",
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
export function creaTour(idPagina: string, passi: DriveStep[], extra?: Partial<Config>): Driver {
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
    /*
     * Toppa di accessibilita' su driver.js.
     *
     * Per i passi senza bersaglio la libreria crea `#driver-dummy-element`, un
     * div 0x0 con `aria-haspopup`, `aria-expanded` e `aria-controls` ma senza
     * `role`. `aria-expanded` non e' ammesso su un elemento generico: e' una
     * violazione WCAG 2.1 A (`aria-allowed-attr`), e la incontra OGNI utente al
     * primo accesso, perche' il benvenuto e' un passo centrato.
     *
     * L'elemento e' invisibile e non raggiungibile da tastiera: non ha niente
     * da dire a una tecnologia assistiva. Lo si nasconde e gli si tolgono gli
     * attributi, invece di inventargli un ruolo che non ha. Il popover resta
     * annunciato per conto suo.
     *
     * La trovava Lighthouse e non l'axe delle nostre verifiche, perche' queste
     * silenziano il tour via localStorage: un controllo che salta il primo
     * accesso non vede cio' che vede un utente nuovo.
     *
     * DUE agganci, non uno. La libreria scrive gli attributi alla fine della
     * funzione di evidenziazione; `onHighlighted` arriva a transizione finita,
     * ma il popover compare A META' (via `onPopoverRender`): da solo,
     * `onHighlighted` lasciava una finestra con il benvenuto gia' visibile e
     * gli attributi ancora li'. Senza animazione l'ordine si inverte, e il
     * popover si disegna prima degli attributi: allora serve l'altro.
     */
    onPopoverRender: (popover, opzioni) => {
      nascondiFittizio();
      extra?.onPopoverRender?.(popover, opzioni);
    },
    onHighlighted: (elemento, passo, opzioni) => {
      nascondiFittizio();
      extra?.onHighlighted?.(elemento, passo, opzioni);
    },
  });
  return tour;
}
