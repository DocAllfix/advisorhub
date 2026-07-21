import { describe, expect, it } from "vitest";

import { calcolaIndicatori } from "../src/indicatori";
import type { DatiBilancio } from "../src/types";

const base: DatiBilancio = {
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

describe("calcolaIndicatori: formule", () => {
  const i = calcolaIndicatori(base);

  it("ROS = RO / Valore Produzione × 100", () => {
    expect(i.ros).toBeCloseTo((350_000 / 3_000_000) * 100, 12);
  });
  it("Turnover = Fatturato / Capitale Investito", () => {
    expect(i.turnover).toBeCloseTo(2_800_000 / 2_500_000, 12);
  });
  it("IC = 1 / Turnover", () => {
    expect(i.ic).toBeCloseTo(2_500_000 / 2_800_000, 12);
  });
  it("ROI = RO / Capitale Investito × 100", () => {
    expect(i.roi).toBeCloseTo((350_000 / 2_500_000) * 100, 12);
  });
  it("ROE = Utile Netto / Patrimonio Netto × 100", () => {
    expect(i.roe).toBeCloseTo((180_000 / 800_000) * 100, 12);
  });
  it("GI = PFN / EBITDA", () => {
    expect(i.gi).toBeCloseTo(1_200_000 / 550_000, 12);
  });
  it("invGi = EBITDA / PFN × 100", () => {
    expect(i.invGi).toBeCloseTo((550_000 / 1_200_000) * 100, 12);
  });
  it("DSCR = Flusso Cassa / Servizio Debito", () => {
    expect(i.dscr).toBeCloseTo(420_000 / 300_000, 12);
  });
});

describe("calcolaIndicatori: casi limite", () => {
  it("valProd 0 → ROS null", () => {
    expect(calcolaIndicatori({ ...base, valProd: 0 }).ros).toBeNull();
  });
  it("capInvest 0 → Turnover, IC e ROI null", () => {
    const i = calcolaIndicatori({ ...base, capInvest: 0 });
    expect(i.turnover).toBeNull();
    expect(i.ic).toBeNull();
    expect(i.roi).toBeNull();
  });
  it("fatturato 0 con capitale > 0 → Turnover 0, IC null", () => {
    const i = calcolaIndicatori({ ...base, fatturato: 0 });
    expect(i.turnover).toBe(0);
    expect(i.ic).toBeNull();
  });
  it("patrNetto 0 → ROE null", () => {
    expect(calcolaIndicatori({ ...base, patrNetto: 0 }).roe).toBeNull();
  });
  it("ebitda 0: GI 99 se PFN>0, 0 se PFN=0, null se PFN<0", () => {
    expect(calcolaIndicatori({ ...base, ebitda: 0 }).gi).toBe(99);
    expect(calcolaIndicatori({ ...base, ebitda: 0, pfn: 0 }).gi).toBe(0);
    expect(calcolaIndicatori({ ...base, ebitda: 0, pfn: -1 }).gi).toBeNull();
  });
  it("pfn 0 → invGi 0", () => {
    expect(calcolaIndicatori({ ...base, pfn: 0 }).invGi).toBe(0);
  });
  it("servizioDebito 0: DSCR 99 se flusso>0, 0 se flusso=0, null se flusso<0", () => {
    expect(calcolaIndicatori({ ...base, servizioDebito: 0 }).dscr).toBe(99);
    expect(calcolaIndicatori({ ...base, servizioDebito: 0, flussoCassa: 0 }).dscr).toBe(0);
    expect(calcolaIndicatori({ ...base, servizioDebito: 0, flussoCassa: -1 }).dscr).toBeNull();
  });
  it("RO negativo → ROS e ROI negativi, nessun crash", () => {
    const i = calcolaIndicatori({ ...base, ro: -100_000 });
    expect(i.ros).toBeLessThan(0);
    expect(i.roi).toBeLessThan(0);
  });
});
