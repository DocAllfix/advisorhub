import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { analizza, type DatiBilancio } from "../src/index";

/**
 * Golden test: gli export CSV reali del prototipo (cartella archivio/) sono la
 * verità di riferimento. Il motore deve riprodurre esattamente i loro output.
 */

function leggiCsv(nomeFile: string) {
  const path = fileURLToPath(new URL(`../../../archivio/${nomeFile}`, import.meta.url));
  const righe = readFileSync(path, "utf-8").trim().split(/\r?\n/);
  const intestazioni = righe[0]!.split(",");
  const valori = [...righe[1]!.matchAll(/"([^"]*)"/g)].map((m) => m[1]!);
  const record: Record<string, string> = {};
  intestazioni.forEach((h, i) => {
    record[h.trim()] = valori[i] ?? "";
  });
  return record;
}

function datiDaCsv(r: Record<string, string>): DatiBilancio {
  return {
    valProd: Number(r["Valore Produzione"]),
    fatturato: Number(r["Fatturato"]),
    ro: Number(r["Reddito Operativo"]),
    capInvest: Number(r["Capitale Investito"]),
    patrNetto: Number(r["Patrimonio Netto"]),
    utileNetto: Number(r["Utile Netto"]),
    ebitda: Number(r["EBITDA"]),
    pfn: Number(r["PFN"]),
    servizioDebito: Number(r["Servizio Debito Annuo"]),
    flussoCassa: Number(r["Flusso Cassa Operativo"]),
  };
}

describe("golden: Mario Rossi Spa (scenario eccellenza)", () => {
  const csv = leggiCsv("ROI_Mario_Rossi_Spa_2026-07-21 (1).csv");
  const a = analizza(datiDaCsv(csv));

  it("riproduce esattamente gli indicatori dell'export CSV", () => {
    expect(a.indicatori.ros).toBe(Number(csv["ROS %"]));
    expect(a.indicatori.turnover).toBe(Number(csv["Turnover"]));
    expect(a.indicatori.ic).toBe(Number(csv["IC"]));
    expect(a.indicatori.roi).toBe(Number(csv["ROI %"]));
    expect(a.indicatori.roe).toBe(Number(csv["ROE %"]));
    expect(a.indicatori.gi).toBe(Number(csv["GI anni"]));
    expect(a.indicatori.dscr).toBe(Number(csv["DSCR"]));
  });

  it("valori noti dal report PDF", () => {
    expect(a.indicatori.roi).toBeCloseTo(14, 10);
    expect(a.indicatori.dscr).toBeCloseTo(1.4, 10);
    expect(a.score).toBe(91);
    expect(a.sintesi.titolo).toBe("Eccellenza gestionale");
  });

  it("giudizi come nel report PDF", () => {
    expect(a.giudizi.ros.label).toBe("Ottimo");
    expect(a.giudizi.turnover.label).toBe("Ottimo");
    expect(a.giudizi.roi.label).toBe("Ottimo");
    expect(a.giudizi.roiI.label).toBe("Sostiene sviluppo");
    expect(a.giudizi.roe.label).toBe("Ottimo");
    expect(a.giudizi.gi.label).toBe("Buono");
    expect(a.giudizi.dscr.label).toBe("Buono");
  });

  it("punti di forza e azione prioritaria come nel report PDF", () => {
    expect(a.puntiForza.map((p) => p.k)).toEqual(["ROS", "TURN", "ROI"]);
    expect(a.puntiForza[0]!.txt).toBe("ROS 11,67% eccellente, pricing difeso");
    expect(a.puntiForza[1]!.txt).toBe("Turnover 1,12x, capitale che lavora bene");
    expect(a.puntiForza[2]!.txt).toBe("ROI 14,00% crea valore sopra WACC");
    expect(a.areeAttenzione[0]!.txt).toBe("Nessuna criticità evidente sui 7 indicatori + DSCR 6M");
    expect(a.azionePrioritaria).toBe(
      "Consolida processi, prepara budget per crescita controllata.",
    );
  });

  it("analisi estesa coerente con il report PDF", () => {
    expect(a.analisiEstesa).toContain(
      "Combinazione equilibrata tra marginalità (ROS 11,67%) e rotazione (Turnover 1,12x)",
    );
    expect(a.analisiEstesa).toContain("ROE (22,50%) superiore al ROI (14,00%)");
    expect(a.analisiEstesa).toContain("GI a 2,18 anni in fascia bancabile");
    expect(a.analisiEstesa).toContain("DSCR a 1,40: bancabile con buon margine");
  });
});

describe("golden: Luca Bianchi Spa (scenario tensione)", () => {
  const csv = leggiCsv("ROI_Luca_Bianchi_Spa_2026-07-21.csv");
  const a = analizza(datiDaCsv(csv));

  it("riproduce esattamente gli indicatori dell'export CSV", () => {
    expect(a.indicatori.ros).toBe(Number(csv["ROS %"]));
    expect(a.indicatori.turnover).toBe(Number(csv["Turnover"]));
    expect(a.indicatori.ic).toBe(Number(csv["IC"]));
    expect(a.indicatori.roi).toBe(Number(csv["ROI %"]));
    expect(a.indicatori.roe).toBe(Number(csv["ROE %"]));
    expect(a.indicatori.gi).toBe(Number(csv["GI anni"]));
    expect(a.indicatori.dscr).toBe(Number(csv["DSCR"]));
  });

  it("valori noti dal report PDF", () => {
    expect(a.indicatori.roi).toBeCloseTo(2.535211267605634, 12);
    expect(a.indicatori.dscr).toBeCloseTo(0.8571428571428571, 12);
    expect(a.score).toBe(49);
    expect(a.sintesi.titolo).toBe("Equilibrio fragile");
  });

  it("giudizi come nel report PDF", () => {
    expect(a.giudizi.ros.label).toBe("Critico");
    expect(a.giudizi.turnover.label).toBe("Ottimo");
    expect(a.giudizi.roi.label).toBe("Critico");
    expect(a.giudizi.roi.tone).toBe("attenzione");
    expect(a.giudizi.roiI.label).toBe("Non genera ricchezza");
    expect(a.giudizi.roe.label).toBe("Buono");
    expect(a.giudizi.gi.label).toBe("Buono");
    expect(a.giudizi.dscr.label).toBe("Critico");
  });

  it("aree di attenzione e azione prioritaria coerenti", () => {
    expect(a.areeAttenzione.map((v) => v.k)).toEqual(["ROS", "ROI", "DSCR"]);
    expect(a.areeAttenzione[0]!.txt).toContain("ROS 1,64% critico");
    expect(a.areeAttenzione[2]!.txt).toContain("DSCR 0,86 critico");
    expect(a.azionePrioritaria).toBe(
      "Ottimizza capitale circolante e pricing per alzare ROS di 2-3 punti.",
    );
  });

  it("analisi estesa segnala la criticità DSCR ex art. 3 CCII", () => {
    expect(a.analisiEstesa).toContain("DSCR a 0,86");
    expect(a.analisiEstesa).toContain("art. 3 CCII");
  });
});
