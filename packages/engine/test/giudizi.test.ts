import { describe, expect, it } from "vitest";

import {
  giudicaDscr,
  giudicaGi,
  giudicaRoe,
  giudicaRoi,
  giudicaRoiIndustriale,
  giudicaRos,
  giudicaTurnover,
} from "../src/giudizi";

const ebitdaOk = { ebitda: 550_000 };

describe("soglie ROS", () => {
  it.each([
    [null, "n.d.", 0],
    [1.99, "Critico", 15],
    [2, "Sufficiente", 50],
    [4.99, "Sufficiente", 50],
    [5, "Buono", 80],
    [9.99, "Buono", 80],
    [10, "Ottimo", 100],
  ])("ros %s → %s (score %s)", (v, label, score) => {
    const g = giudicaRos(v as number | null);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
  });
});

describe("soglie Turnover", () => {
  it.each([
    [null, "n.d.", 0],
    [0.49, "Capitale intenso", 20],
    [0.5, "Buono", 70],
    [0.99, "Buono", 70],
    [1, "Ottimo", 90],
    [1.99, "Ottimo", 90],
    [2, "Eccellente", 100],
  ])("turnover %s → %s (score %s)", (v, label, score) => {
    const g = giudicaTurnover(v as number | null);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
  });
});

describe("soglie ROI", () => {
  it.each([
    [null, "n.d.", 0, "nd"],
    [-0.01, "Perdita", 0, "critico"],
    [0, "Critico", 30, "attenzione"],
    [3.99, "Critico", 30, "attenzione"],
    [4, "Buono", 70, "buono"],
    [7.99, "Buono", 70, "buono"],
    [8, "Ottimo", 100, "eccellente"],
  ])("roi %s → %s (score %s, tone %s)", (v, label, score, tone) => {
    const g = giudicaRoi(v as number | null);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
    expect(g.tone).toBe(tone);
  });
});

describe("soglie ROI-I (lettura industriale dello stesso valore)", () => {
  it.each([
    [null, "n.d.", 0],
    [-0.01, "Perde valore", 0],
    [4.99, "Non genera ricchezza", 40],
    [5, "Sostiene sviluppo", 90],
  ])("roi %s → %s (score %s)", (v, label, score) => {
    const g = giudicaRoiIndustriale(v as number | null);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
  });
});

describe("soglie ROE", () => {
  it.each([
    [null, "n.d.", 0],
    [-0.01, "Critico", 0],
    [4.99, "Basso", 40],
    [5, "Buono", 75],
    [14.99, "Buono", 75],
    [15, "Ottimo", 100],
  ])("roe %s → %s (score %s)", (v, label, score) => {
    const g = giudicaRoe(v as number | null);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
  });
});

describe("soglie GI", () => {
  it("EBITDA ≤ 0 → Critico score 0 a prescindere dal GI", () => {
    expect(giudicaGi(1, { ebitda: 0 }).label).toBe("Critico");
    expect(giudicaGi(1, { ebitda: -1 }).score).toBe(0);
  });
  it.each([
    [null, "n.d.", 0],
    [1.99, "Ottimo", 100],
    [2, "Buono", 80],
    [3.49, "Buono", 80],
    [3.5, "Attenziona", 50],
    [4.99, "Attenziona", 50],
    [5, "Critico", 20],
  ])("gi %s → %s (score %s)", (v, label, score) => {
    const g = giudicaGi(v as number | null, ebitdaOk);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
  });
});

describe("soglie DSCR", () => {
  it.each([
    [null, "n.d.", 0],
    [-0.01, "Critico", 0],
    [0.99, "Critico", 15],
    [1, "Tensione", 45],
    [1.19, "Tensione", 45],
    [1.2, "Buono", 80],
    [1.49, "Buono", 80],
    [1.5, "Ottimo", 100],
  ])("dscr %s → %s (score %s)", (v, label, score) => {
    const g = giudicaDscr(v as number | null);
    expect(g.label).toBe(label);
    expect(g.score).toBe(score);
  });
});
