import { describe, expect, it } from "vitest";

import { formatEuro, formatNumero, parseNumeroIt } from "../src/numeri";

const pulisci = (s: string) => s.replace(/ /g, " ");

describe("parseNumeroIt", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["1234,56", 1234.56],
    ["1,5", 1.5],
    ["1234.56", 1234.56],
    ["1.234.567", 1234567],
    ["€ 550.000", 550000],
    ["11,67%", 11.67],
    ["-120.000", -120000],
    ["1'234'567", 1234567],
    [1234.56, 1234.56],
    ["0", 0],
  ])("interpreta %s → %s", (input, atteso) => {
    expect(parseNumeroIt(input as string | number)).toBe(atteso);
  });

  it.each([[null], [undefined], [""], ["   "], ["abc"], ["€ %"]])(
    "restituisce null per %s",
    (input) => {
      expect(parseNumeroIt(input as string | null | undefined)).toBeNull();
    },
  );
});

describe("formattazione it-IT", () => {
  it("formatEuro senza decimali", () => {
    expect(pulisci(formatEuro(550000))).toBe("550.000 €");
    expect(pulisci(formatEuro(-120000))).toBe("-120.000 €");
  });
  it("formatNumero con decimali fissi", () => {
    expect(formatNumero(11.666666, 2)).toBe("11,67");
    expect(formatNumero(1.4)).toBe("1,40");
    expect(formatNumero(2.1818181818, 1)).toBe("2,2");
  });
  it("formatNumero con valore non finito → em dash tipografico", () => {
    expect(formatNumero(Infinity)).toBe("—");
    expect(formatNumero(NaN)).toBe("—");
  });
});
