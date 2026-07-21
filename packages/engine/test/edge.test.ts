import { describe, expect, it } from "vitest";

import { analizza } from "../src/analizza";
import type { DatiBilancio } from "../src/types";

const zero: DatiBilancio = {
  valProd: 0,
  fatturato: 0,
  ro: 0,
  capInvest: 0,
  patrNetto: 0,
  utileNetto: 0,
  ebitda: 0,
  pfn: 0,
  servizioDebito: 0,
  flussoCassa: 0,
};

describe("analizza: azienda tutta a zero", () => {
  const a = analizza(zero);

  it("non solleva e produce uno score valido", () => {
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });
  it("gli indicatori non calcolabili sono null", () => {
    expect(a.indicatori.ros).toBeNull();
    expect(a.indicatori.turnover).toBeNull();
    expect(a.indicatori.roi).toBeNull();
    expect(a.indicatori.roe).toBeNull();
  });
  it("l'analisi estesa segnala gli input mancanti", () => {
    expect(a.analisiEstesa).toContain("Alcuni input fondamentali sono a 0 €");
  });
  it("le aree di attenzione elencano gli indicatori non calcolabili", () => {
    expect(a.areeAttenzione.length).toBe(3);
  });
});

describe("analizza: azienda in perdita profonda", () => {
  const a = analizza({
    valProd: 1_000_000,
    fatturato: 900_000,
    ro: -300_000,
    capInvest: 2_000_000,
    patrNetto: 100_000,
    utileNetto: -250_000,
    ebitda: -100_000,
    pfn: 3_000_000,
    servizioDebito: 500_000,
    flussoCassa: -50_000,
  });

  it("giudizi coerenti con la perdita", () => {
    expect(a.giudizi.roi.label).toBe("Perdita");
    expect(a.giudizi.roiI.label).toBe("Perde valore");
    expect(a.giudizi.roe.label).toBe("Critico");
    expect(a.giudizi.gi.label).toBe("Critico");
    expect(a.giudizi.dscr.label).toBe("Critico");
  });
  it("sintesi in fascia ristrutturazione", () => {
    expect(a.score).toBeLessThan(30);
    expect(a.sintesi.titolo).toBe("Ristrutturazione necessaria");
    expect(a.azionePrioritaria).toContain("Riduci immediatamente PFN");
  });
  it("l'analisi estesa segnala EBITDA non positivo", () => {
    expect(a.analisiEstesa).toContain("EBITDA non positivo");
  });
});

describe("analizza: leva finanziaria positiva", () => {
  it("ROE >> ROI produce la frase sulla leva", () => {
    const a = analizza({
      valProd: 2_000_000,
      fatturato: 2_000_000,
      ro: 120_000,
      capInvest: 2_000_000,
      patrNetto: 200_000,
      utileNetto: 60_000,
      ebitda: 200_000,
      pfn: 100_000,
      servizioDebito: 50_000,
      flussoCassa: 150_000,
    });
    expect(a.indicatori.roe! - a.indicatori.roi!).toBeGreaterThan(4);
    expect(a.analisiEstesa).toContain("leva finanziaria positiva");
  });
});
