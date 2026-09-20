"use client";

import NumberFlow from "@number-flow/react";

/**
 * Punteggio di sintesi che CONTA quando cambia, cifra per cifra.
 *
 * Serve nella simulazione: si muove una leva e il punteggio passa da 97 a 94.
 * Una dissolvenza direbbe «qualcosa e' cambiato»; il conteggio fa leggere di
 * quanto, che e' l'unica cosa che interessa mentre si sta simulando
 * (PRODUCT.md, principio 1: il numero e' il protagonista).
 *
 * Perche' solo qui e non anche sulle righe indicatore: quelle espongono valori
 * gia' FORMATTATI («10,67%», «n.d.», «∞», «1,05 anni»), e NumberFlow vuole un
 * numero piu' le opzioni Intl. Riscrivere i sette accessori significherebbe
 * creare una seconda strada per produrre lo stesso valore mostrato, che e'
 * esattamente la famiglia di guasti di G-29. Il punteggio invece e' un intero
 * puro fra 0 e 100, senza rami: qui il conteggio non puo' divergere da niente.
 *
 * CSP: NumberFlow non inietta alcuno <script>, solo uno <style> dentro lo
 * shadow DOM, che `style-src 'unsafe-inline'` copre. Verificato sul pacchetto
 * prima di sceglierlo.
 *
 * `prefers-reduced-motion` e' rispettato dalla libreria stessa
 * (`respectMotionPreference` vale true di default): la regola globale in
 * globals.css azzera le animazioni CSS ma non toccherebbe queste, che sono
 * WAAPI.
 */
export function PunteggioAnimato({ valore }: { valore: number }) {
  return <NumberFlow value={valore} locales="it-IT" />;
}
