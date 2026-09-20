import { describe, expect, it } from "vitest";

import {
  giudicaDscr,
  giudicaDscrProspettico,
  giudicaGi,
  giudicaRoe,
  giudicaRoi,
  giudicaRoiIndustriale,
  giudicaRos,
  giudicaTurnover,
  SOGLIE_GIUDIZIO,
} from "../src/giudizi";

/**
 * `SOGLIE_GIUDIZIO` è una dichiarazione: dice dove sta il confine fra "sotto" e
 * "a posto" per ogni indicatore. Il report la usa per disegnare la riga sulla
 * scala, invece di riscrivere gli stessi numeri a mano come faceva prima.
 *
 * Una costante che dichiara un comportamento senza essere legata ad esso è però
 * peggio di niente: se qualcuno spostasse un `if` dentro una funzione giudica*
 * e non aggiornasse la costante, il motore giudicherebbe in un modo e il report
 * disegnerebbe la soglia in un altro — in silenzio, e per sempre.
 *
 * Questi test legano le due cose: attraversando la soglia, il giudizio DEVE
 * cambiare. È l'unica verifica che rende la costante affidabile.
 */
const E = 0.0001;

describe("le soglie dichiarate corrispondono al giudizio reale", () => {
  it("ROS: sotto la soglia il punteggio è inferiore", () => {
    const s = SOGLIE_GIUDIZIO.ros.soglia;
    expect(giudicaRos(s - E).score).toBeLessThan(giudicaRos(s).score);
  });

  it("Turnover", () => {
    const s = SOGLIE_GIUDIZIO.turnover.soglia;
    expect(giudicaTurnover(s - E).score).toBeLessThan(giudicaTurnover(s).score);
  });

  it("ROI", () => {
    const s = SOGLIE_GIUDIZIO.roi.soglia;
    expect(giudicaRoi(s - E).score).toBeLessThan(giudicaRoi(s).score);
  });

  it("ROI industriale", () => {
    const s = SOGLIE_GIUDIZIO.roiI.soglia;
    expect(giudicaRoiIndustriale(s - E).score).toBeLessThan(giudicaRoiIndustriale(s).score);
  });

  it("ROE", () => {
    const s = SOGLIE_GIUDIZIO.roe.soglia;
    expect(giudicaRoe(s - E).score).toBeLessThan(giudicaRoe(s).score);
  });

  it("DSCR", () => {
    const s = SOGLIE_GIUDIZIO.dscr.soglia;
    expect(giudicaDscr(s - E).score).toBeLessThan(giudicaDscr(s).score);
  });

  it("DSCR prospettico 6M: soglia CNDCEC", () => {
    const s = SOGLIE_GIUDIZIO.dscr6m.soglia;
    expect(giudicaDscrProspettico(s - E).score).toBeLessThan(giudicaDscrProspettico(s).score);
  });

  it("Gravosità: qui MENO è meglio, quindi il verso è invertito", () => {
    const s = SOGLIE_GIUDIZIO.gi.soglia;
    const dati = { ebitda: 500_000 };
    expect(SOGLIE_GIUDIZIO.gi.minoreMeglio).toBe(true);
    // Sotto la soglia (meno anni di rientro) il giudizio dev'essere migliore.
    expect(giudicaGi(s - E, dati).score).toBeGreaterThan(giudicaGi(s, dati).score);
  });

  it("solo la gravosità ha il verso invertito", () => {
    const invertiti = Object.entries(SOGLIE_GIUDIZIO)
      .filter(([, v]) => v.minoreMeglio)
      .map(([k]) => k);
    expect(invertiti).toEqual(["gi"]);
  });
});
