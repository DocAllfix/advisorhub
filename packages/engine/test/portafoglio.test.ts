import { describe, expect, it } from "vitest";

import { sintetizzaPortafoglio, type StatoPortafoglio } from "../src/portafoglio";

const base: StatoPortafoglio = {
  totaleClienti: 10,
  conAnalisi: 10,
  punteggioMedio: 70,
  inAllerta: 0,
  dscrSottoSoglia: 0,
  dscr6mSottoSoglia: 0,
};

const con = (p: Partial<StatoPortafoglio>) => sintetizzaPortafoglio({ ...base, ...p });

describe("sintetizzaPortafoglio: stati senza dati", () => {
  it("studio senza clienti invita a inserirne uno", () => {
    const s = con({ totaleClienti: 0, conAnalisi: 0, punteggioMedio: null });
    expect(s.titolo).toBe("Nessun cliente in portafoglio");
    expect(s.tono).toBe("nd");
    expect(s.frase).toContain("prima azienda");
  });

  it("clienti in anagrafica ma nessuna analisi", () => {
    const s = con({ totaleClienti: 4, conAnalisi: 0, punteggioMedio: null });
    expect(s.titolo).toBe("Portafoglio da analizzare");
    expect(s.tono).toBe("nd");
    expect(s.frase).toContain("4 clienti in anagrafica");
  });

  it("un solo cliente non analizzato usa il singolare", () => {
    const s = con({ totaleClienti: 1, conAnalisi: 0, punteggioMedio: null });
    expect(s.frase).toContain("1 cliente in anagrafica");
  });
});

describe("sintetizzaPortafoglio: nessuna criticità", () => {
  it("non inventa allarmi e lo dice esplicitamente", () => {
    const s = con({ punteggioMedio: 80 });
    expect(s.frase).toBe(
      "Il portafoglio è complessivamente sano: nessuna posizione sotto le soglie di allerta.",
    );
    expect(s.tono).toBe("buono");
  });

  it("portafoglio eccellente ha tono eccellente", () => {
    const s = con({ punteggioMedio: 92 });
    expect(s.titolo).toBe("Portafoglio in eccellenza");
    expect(s.tono).toBe("eccellente");
  });
});

describe("sintetizzaPortafoglio: criticità", () => {
  it("nomina i clienti in allerta al singolare", () => {
    const s = con({ punteggioMedio: 70, inAllerta: 1 });
    expect(s.frase).toBe("Il portafoglio regge, ma 1 cliente sotto la soglia di attenzione.");
    expect(s.tono).toBe("attenzione");
  });

  it("elenca più criticità in ordine di gravità", () => {
    const s = con({ punteggioMedio: 70, inAllerta: 3, dscrSottoSoglia: 2, dscr6mSottoSoglia: 1 });
    expect(s.frase).toBe(
      "Il portafoglio regge, ma 3 clienti sotto la soglia di attenzione, 2 con DSCR sotto 1,2 e 1 in tensione sul prospettico a 6 mesi.",
    );
  });

  it("il prospettico 6M sotto soglia porta il tono a critico", () => {
    expect(con({ punteggioMedio: 85, dscr6mSottoSoglia: 1 }).tono).toBe("critico");
  });

  it("un punteggio medio sotto 30 è critico anche senza altre segnalazioni", () => {
    const s = con({ punteggioMedio: 25 });
    expect(s.titolo).toBe("Portafoglio in tensione");
    expect(s.tono).toBe("critico");
  });

  it("il solo DSCR sotto soglia resta attenzione", () => {
    expect(con({ punteggioMedio: 80, dscrSottoSoglia: 1 }).tono).toBe("attenzione");
  });
});

describe("sintetizzaPortafoglio: fasce del titolo", () => {
  const casi: [number, string][] = [
    [10, "Portafoglio in tensione"],
    [40, "Portafoglio fragile"],
    [60, "Portafoglio solido"],
    [80, "Portafoglio sano"],
    [95, "Portafoglio in eccellenza"],
  ];
  for (const [medio, titolo] of casi) {
    it(`media ${medio} produce «${titolo}»`, () => {
      expect(con({ punteggioMedio: medio }).titolo).toBe(titolo);
    });
  }
});
