import { fasciaSalute, FASCE_SALUTE } from "@advisorhub/engine";
import { describe, expect, it } from "vitest";

import { PORTAFOGLIO_ESEMPIO } from "./portafoglio-esempio";

/**
 * Il portafoglio d'esempio mostra una fascia di salute per cliente: se un giorno
 * il motore sposta un confine e due clienti finiscono nella stessa fascia, il
 * cruscotto in pagina smette di raccontare quello che dice. Deve fallire qui.
 */
describe("portafoglio di esempio", () => {
  it("copre ogni fascia di salute, una volta sola", () => {
    const fasce = PORTAFOGLIO_ESEMPIO.map((c) => fasciaSalute(c.analisi.score));
    expect(new Set(fasce).size).toBe(FASCE_SALUTE.length);
  });

  it("è ordinato come nel cruscotto: prima chi ha più bisogno", () => {
    const punteggi = PORTAFOGLIO_ESEMPIO.map((c) => c.analisi.score);
    expect(punteggi).toEqual([...punteggi].sort((a, b) => a - b));
  });

  it("contiene il cliente dell'hero, con lo stesso punteggio", () => {
    const ardesia = PORTAFOGLIO_ESEMPIO.find((c) => c.nome === "Meccanica Ardesia S.r.l.");
    expect(ardesia?.analisi.score).toBe(71);
  });
});
