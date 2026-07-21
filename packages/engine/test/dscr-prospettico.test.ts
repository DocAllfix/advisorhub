import { describe, expect, it } from "vitest";

import { analizza } from "../src/analizza";
import { giudicaDscrProspettico } from "../src/giudizi";
import { calcolaIndicatori } from "../src/indicatori";
import type { DatiBilancio, DatiPrevisionali6M } from "../src/types";

const bilancio: DatiBilancio = {
  valProd: 3_000_000,
  fatturato: 2_800_000,
  ro: 350_000,
  capInvest: 2_500_000,
  patrNetto: 800_000,
  utileNetto: 180_000,
  ebitda: 550_000,
  pfn: 1_200_000,
  servizioDebito: 300_000,
  flussoCassa: 420_000,
};

/** Default del prototipo v3c2 */
const previsionale: DatiPrevisionali6M = {
  liquiditaIniziale: 150_000,
  entrate6m: 1_200_000,
  uscite6m: 950_000,
  debito6m: 180_000,
};

describe("DSCR prospettico 6M: formula (prototipo v3c2)", () => {
  it("Disponibile 6M = Liquidità + Entrate − Uscite", () => {
    const i = calcolaIndicatori(bilancio, previsionale);
    expect(i.disponibile6m).toBe(400_000);
  });
  it("DSCR 6M = Disponibile / Debito 6M", () => {
    const i = calcolaIndicatori(bilancio, previsionale);
    expect(i.dscrProspettico).toBeCloseTo(400_000 / 180_000, 12);
  });
  it("senza dati previsionali → null", () => {
    const i = calcolaIndicatori(bilancio);
    expect(i.disponibile6m).toBeNull();
    expect(i.dscrProspettico).toBeNull();
  });
  it("Debito 6M a 0: 99 se disponibilità positiva, 0 altrimenti", () => {
    expect(calcolaIndicatori(bilancio, { ...previsionale, debito6m: 0 }).dscrProspettico).toBe(99);
    expect(
      calcolaIndicatori(bilancio, {
        ...previsionale,
        debito6m: 0,
        entrate6m: 800_000,
      }).dscrProspettico,
    ).toBe(0);
    expect(
      calcolaIndicatori(bilancio, {
        ...previsionale,
        debito6m: 0,
        entrate6m: 0,
        liquiditaIniziale: 0,
      }).dscrProspettico,
    ).toBe(0);
  });
});

describe("DSCR prospettico 6M: soglie CNDCEC", () => {
  it.each([
    [null, "n.d.", 0, "nd"],
    [-0.01, "Critico", 0, "critico"],
    [0.99, "Critico", 10, "critico"],
    [1, "Attenzione", 45, "attenzione"],
    [1.09, "Attenzione", 45, "attenzione"],
    [1.1, "Adeguato", 75, "buono"],
    [1.29, "Adeguato", 75, "buono"],
    [1.3, "Ottimo", 100, "eccellente"],
  ])("dscr6m %s → %s (score %s, tone %s)", (v, label, score, tone) => {
    const g = giudicaDscrProspettico(v as number | null);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
    expect(g.tone).toBe(tone);
  });
});

describe("DSCR prospettico 6M: integrazione nell'analisi", () => {
  it("non concorre allo score di sintesi (resta la media dei 7)", () => {
    const senza = analizza(bilancio);
    const con = analizza(bilancio, previsionale);
    expect(con.score).toBe(senza.score);
    expect(con.score).toBe(91);
  });

  it("scenario default v3c2 → Ottimo, frase nell'analisi estesa", () => {
    const a = analizza(bilancio, previsionale);
    expect(a.giudizi.dscrPro.label).toBe("Ottimo");
    expect(a.analisiEstesa).toContain("DSCR Prospettico 6M a 2,22 ottimo");
  });

  it("scenario critico → area di attenzione e frase art. 3 CCII con disponibilità", () => {
    const a = analizza(bilancio, {
      liquiditaIniziale: 20_000,
      entrate6m: 500_000,
      uscite6m: 450_000,
      debito6m: 180_000,
    });
    expect(a.indicatori.dscrProspettico).toBeCloseTo(70_000 / 180_000, 12);
    expect(a.giudizi.dscrPro.label).toBe("Critico");
    expect(a.analisiEstesa).toContain("richiede piano di tesoreria immediato");
    expect(a.analisiEstesa).toContain("70.000");
    expect(a.areeAttenzione.some((v) => v.k === "DSCR6M")).toBe(true);
  });

  it("fascia attenzione 1.0-1.1 → punto in area attenzione con soglia CNDCEC", () => {
    const a = analizza(bilancio, {
      liquiditaIniziale: 0,
      entrate6m: 1_000_000,
      uscite6m: 811_000,
      debito6m: 180_000,
    });
    expect(a.giudizi.dscrPro.label).toBe("Attenzione");
    expect(a.areeAttenzione.some((v) => v.txt.includes("sotto soglia CNDCEC 1.1"))).toBe(true);
    expect(a.analisiEstesa).toContain("fascia attenzione 1.0-1.1");
  });

  it("fascia adeguato → frase CNDCEC e punto di forza", () => {
    const a = analizza(bilancio, {
      liquiditaIniziale: 0,
      entrate6m: 1_000_000,
      uscite6m: 784_000,
      debito6m: 180_000,
    });
    expect(a.giudizi.dscrPro.label).toBe("Adeguato");
    expect(a.analisiEstesa).toContain("rispetta soglia CNDCEC >1.1");
  });

  it("debito 6M nullo con disponibilità positiva → ∞ nell'analisi estesa", () => {
    const a = analizza(bilancio, { ...previsionale, debito6m: 0 });
    expect(a.analisiEstesa).toContain("DSCR Prospettico 6M a ∞ ottimo");
    expect(a.puntiForza.concat(a.areeAttenzione).some((v) => v.txt.includes("∞"))).toBe(false);
  });
});
