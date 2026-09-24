import { describe, expect, it } from "vitest";

import { ANALISI_ESEMPIO, SERIE_DSCR6M, SOGLIA_DSCR6M } from "./esempio";
import { tracciaSoglia } from "./soglia";

/**
 * Il racconto dell'hero regge solo se i dati lo reggono: il cliente di esempio
 * deve partire sopra la soglia CCII e finirci sotto. Se un giorno il motore
 * cambia calcolo o soglia e il racconto smette di essere vero, deve fallire qui
 * e non passare inosservato in una pagina pubblica.
 */
describe("cliente di esempio", () => {
  it("la serie parte sopra la soglia CCII e finisce sotto", () => {
    expect(SERIE_DSCR6M[0]!.dscr6m).toBeGreaterThan(SOGLIA_DSCR6M);
    expect(SERIE_DSCR6M.at(-1)!.dscr6m).toBeLessThan(SOGLIA_DSCR6M);
  });

  it("l'ultima rilevazione è quella che il Deck mostra", () => {
    expect(ANALISI_ESEMPIO.indicatori.dscrProspettico).toBeCloseTo(SERIE_DSCR6M.at(-1)!.dscr6m, 10);
  });

  it("il giudizio sul DSCR prospettico è un'allerta, non un 'tutto bene'", () => {
    expect(["critico", "attenzione"]).toContain(ANALISI_ESEMPIO.giudizi.dscrPro.tone);
  });
});

describe("tracciaSoglia", () => {
  it("il punto di luce cade sull'interpolazione del segmento che attraversa", () => {
    // 1,2 → 1,0 attraversa 1,1 a metà del secondo segmento
    const t = tracciaSoglia([1.3, 1.2, 1.0], 1.1, 200, 100);
    expect(t.attraversamento).not.toBeNull();
    expect(t.attraversamento!.x).toBeCloseTo(150, 6);
    expect(t.attraversamento!.y).toBeCloseTo(t.ySoglia, 6);
  });

  it("nessun punto se la serie non scende mai sotto la soglia", () => {
    expect(tracciaSoglia([1.3, 1.25, 1.2], 1.1, 200, 100).attraversamento).toBeNull();
  });

  it("la soglia cade sempre dentro il disegno, anche lontana dalla serie", () => {
    const t = tracciaSoglia([3, 3.2, 3.1], 1.1, 200, 100);
    expect(t.ySoglia).toBeGreaterThan(0);
    expect(t.ySoglia).toBeLessThan(100);
  });
});
