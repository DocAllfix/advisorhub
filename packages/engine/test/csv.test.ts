import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { analizza, mappaBilancioDaCsv, rigaExport, serializzaCsv } from "../src/index";

/** Costruisce un record intestazione→valore da una riga CSV con campi quotati. */
function recordDaCsv(nomeFile: string): Record<string, string> {
  const path = fileURLToPath(new URL(`../../../archivio/${nomeFile}`, import.meta.url));
  const righe = readFileSync(path, "utf-8").trim().split(/\r?\n/);
  const intestazioni = righe[0]!.split(",");
  const valori = [...righe[1]!.matchAll(/"([^"]*)"/g)].map((m) => m[1]!);
  const rec: Record<string, string> = {};
  intestazioni.forEach((h, i) => (rec[h.trim()] = valori[i] ?? ""));
  return rec;
}

describe("mappaBilancioDaCsv: matching fuzzy delle intestazioni", () => {
  it("riconosce alias abbreviati e MOL", () => {
    const r = mappaBilancioDaCsv({
      "Val Prod": "1.000.000",
      Fatturato: "900.000",
      MOL: "200.000",
      "Rata Annua": "50.000",
    });
    expect(r.dati.valProd).toBe(1_000_000);
    expect(r.dati.fatturato).toBe(900_000);
    expect(r.dati.ebitda).toBe(200_000); // da "MOL"
    expect(r.dati.servizioDebito).toBe(50_000); // da "Rata Annua"
  });

  it("interpreta numeri in formato italiano e simboli", () => {
    const r = mappaBilancioDaCsv({
      "Valore Produzione": "1.234.567",
      "Reddito Operativo": "-12.000",
    });
    expect(r.dati.valProd).toBe(1_234_567);
    expect(r.dati.ro).toBe(-12_000);
  });

  it("estrae il nome cliente e conta i campi", () => {
    const r = mappaBilancioDaCsv({ "Nome Cliente": '"Rossi Spa"', Fatturato: "100", EBITDA: "10" });
    expect(r.nomeCliente).toBe("Rossi Spa");
    expect(r.nCampi).toBe(2);
  });

  it("mappa anche le grandezze previsionali 6M", () => {
    const r = mappaBilancioDaCsv({
      "Liquidita Iniziale": "150.000",
      "Entrate 6M": "1.200.000",
      "Uscite 6M": "950.000",
      "Debito 6M": "180.000",
    });
    expect(r.previsionale.liquiditaIniziale).toBe(150_000);
    expect(r.previsionale.entrate6m).toBe(1_200_000);
    expect(r.previsionale.uscite6m).toBe(950_000);
    expect(r.previsionale.debito6m).toBe(180_000);
  });
});

describe("mappaBilancioDaCsv: import dei CSV reali dell'archivio", () => {
  it("Mario Rossi Spa → 10 grandezze corrette", () => {
    const r = mappaBilancioDaCsv(recordDaCsv("ROI_Mario_Rossi_Spa_2026-07-21 (1).csv"));
    expect(r.nomeCliente).toBe("Mario Rossi Spa");
    expect(r.dati).toMatchObject({
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
    });
  });

  it("un CSV senza colonne previsionali non riempie i campi 6M", () => {
    // Regressione: alias troppo generici catturavano "Flusso Cassa Operativo"
    // come liquidità iniziale, rendendo incompleti i 4 previsionali.
    const r = mappaBilancioDaCsv(recordDaCsv("ROI_Mario_Rossi_Spa_2026-07-21 (1).csv"));
    expect(Object.keys(r.previsionale)).toHaveLength(0);
    expect(r.nCampi).toBe(10);
  });

  it("Luca Bianchi Spa → 10 grandezze corrette", () => {
    const r = mappaBilancioDaCsv(recordDaCsv("ROI_Luca_Bianchi_Spa_2026-07-21.csv"));
    expect(r.nomeCliente).toBe("Luca Bianchi Spa");
    expect(r.dati.valProd).toBe(5_500_000);
    expect(r.dati.servizioDebito).toBe(420_000);
    expect(r.dati.flussoCassa).toBe(360_000);
  });
});

describe("export CSV: round-trip", () => {
  const dati = {
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
  const previsionale = {
    liquiditaIniziale: 150_000,
    entrate6m: 1_200_000,
    uscite6m: 950_000,
    debito6m: 180_000,
  };

  it("esporta e reimporta senza perdita dei dati", () => {
    const a = analizza(dati, previsionale);
    const intest = [
      "Nome Cliente",
      "Valore Produzione",
      "Fatturato",
      "Reddito Operativo",
      "Capitale Investito",
      "Patrimonio Netto",
      "Utile Netto",
      "EBITDA",
      "PFN",
      "Servizio Debito Annuo",
      "Flusso Cassa Operativo",
      "ROS %",
      "Turnover",
      "IC",
      "ROI %",
      "ROI-I %",
      "ROE %",
      "GI anni",
      "DSCR",
      "Liquidita Iniziale",
      "Entrate 6M",
      "Uscite 6M",
      "Debito 6M",
      "Disponibile 6M",
      "DSCR Prospettico 6M",
      "Data",
    ];
    const riga = rigaExport("Rossi Spa", dati, previsionale, a, "21/07/2026");
    // ricostruisce il record intestazione→valore dalla riga esportata
    const rec: Record<string, string> = {};
    intest.forEach((h, i) => (rec[h] = riga[i]!));
    const reimport = mappaBilancioDaCsv(rec);
    expect(reimport.nomeCliente).toBe("Rossi Spa");
    expect(reimport.dati).toMatchObject(dati);
    expect(reimport.previsionale).toMatchObject(previsionale);
  });

  it("serializzaCsv fa escaping degli apici", () => {
    const csv = serializzaCsv([
      ["a", 'b"c'],
      ["1", "2"],
    ]);
    expect(csv).toBe('"a","b""c"\r\n"1","2"');
  });
});
