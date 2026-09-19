import { describe, expect, it } from "vitest";

import { calcolaSintesi, FASCE_SALUTE, fasciaSalute } from "../src/sintesi";

/**
 * Le fasce di salute erano scritte in QUATTRO posti: qui nel motore, e poi
 * riscritte a mano in panoramica.ts, sintesi-breve.ts e portafoglio.tsx.
 * Quattro copie degli stessi numeri divergono al primo che si tocca, e la
 * divergenza è silenziosa: la dashboard mostrerebbe una fascia e il report
 * un'altra, senza che niente fallisca.
 *
 * Ora la fonte è una sola. Questi test la tengono tale.
 */
describe("fasce di salute", () => {
  it("colloca i punteggi nella fascia attesa", () => {
    expect(fasciaSalute(0)).toBe("ristrutturare");
    expect(fasciaSalute(29)).toBe("ristrutturare");
    expect(fasciaSalute(30)).toBe("fragile");
    expect(fasciaSalute(54)).toBe("fragile");
    expect(fasciaSalute(55)).toBe("migliorabile");
    expect(fasciaSalute(74)).toBe("migliorabile");
    expect(fasciaSalute(75)).toBe("sana");
    expect(fasciaSalute(89)).toBe("sana");
    expect(fasciaSalute(90)).toBe("eccellente");
    expect(fasciaSalute(100)).toBe("eccellente");
  });

  it("copre ogni punteggio da 0 a 100 senza buchi né sovrapposizioni", () => {
    for (let s = 0; s <= 100; s++) {
      const f = fasciaSalute(s);
      expect(
        FASCE_SALUTE.some((x) => x.chiave === f),
        `punteggio ${s} senza fascia`,
      ).toBe(true);
    }
  });

  it("le fasce sono ordinate e monotone", () => {
    const soglie = FASCE_SALUTE.map((f) => f.sotto);
    expect([...soglie].sort((a, b) => a - b)).toEqual(soglie);
    expect(soglie[soglie.length - 1]).toBe(Infinity);
  });

  /**
   * L'invariante che conta davvero: la fascia e il testo di sintesi devono
   * cambiare NELLO STESSO PUNTO. Se qualcuno spostasse una soglia in un solo
   * posto, il portafoglio direbbe "Fragile" e il report "Solida, migliorabile"
   * per lo stesso cliente.
   */
  it("la fascia cambia esattamente dove cambia il testo di sintesi", () => {
    for (let s = 1; s <= 100; s++) {
      const fascia = fasciaSalute(s) !== fasciaSalute(s - 1);
      const titolo = calcolaSintesi(s).titolo !== calcolaSintesi(s - 1).titolo;
      expect(fascia, `a ${s} la fascia e il titolo non sono d'accordo`).toBe(titolo);
    }
  });
});
