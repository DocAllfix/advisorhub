import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { creaStudio, osservaConsole } from "./aiuto";
import { aggiungiEsercizio, creaClienteConEsercizio, idStudio } from "./dati";

/**
 * Prova che una libreria rinviata sia rinviata DAVVERO.
 *
 * PERCHE' ESISTE. `next/dynamic` con `ssr: false` sembra dire «carica al
 * bisogno». Dice un'altra cosa: «non renderlo sul server». Appena il componente
 * che lo contiene si idrata, l'import parte. Per i grafici dell'analisi questo
 * significava 348 KB di recharts scaricati e valutati all'avvio della pagina
 * piu' carica del prodotto, per un riquadro che sta in fondo e che una visita
 * su due non guarda mai.
 *
 * Il conto dei KB (`deploy/budget-js.mjs`) non puo' accorgersene: i chunk sono
 * gli stessi prima e dopo, cambia solo QUANDO partono. L'unico testimone e' la
 * rete. Da qui la forma del test: si guarda l'elenco delle richieste, non il
 * peso dei file.
 *
 * Il criterio e' in due tempi, e servono entrambi. Solo il primo («non parte»)
 * passerebbe anche se il grafico fosse rotto e non si disegnasse mai: sarebbe
 * un'assenza scambiata per un rinvio, che e' esattamente il guasto G-32.
 */

/**
 * I chunk che contengono recharts, cercati per CONTENUTO.
 *
 * Il nome ha un hash che cambia a ogni build: scriverlo nel test lo renderebbe
 * verde per sempre il giorno che l'hash cambia, perche' cercherebbe un file che
 * non esiste e non troverebbe mai una richiesta. Si cerca cio' che c'e' dentro.
 */
function chunkDiRecharts(): string[] {
  const dir = join(process.cwd(), ".next/static/chunks");
  const nomi = readdirSync(dir).filter(
    (f) => f.endsWith(".js") && readFileSync(join(dir, f), "utf8").includes("recharts"),
  );
  if (nomi.length === 0) {
    throw new Error(
      "Nessun chunk contiene recharts: o la libreria non c'e' piu', o la build " +
        "e' vecchia. In entrambi i casi questo test non sta misurando niente.",
    );
  }
  return nomi;
}

test("i grafici dell'analisi non pesano sull'avvio della pagina", async ({
  page,
  context,
  baseURL,
}) => {
  const request = context.request;
  const studio = await creaStudio(request, baseURL!, "peso");
  const org = await idStudio(request);
  const cliente = await creaClienteConEsercizio(org, "Grafici Spa", 2026);
  await aggiungiEsercizio(cliente, 2025);

  const chunk = chunkDiRecharts();
  const spia = osservaConsole(page);

  const richieste: string[] = [];
  page.on("request", (r) => richieste.push(r.url()));
  const rechartsChiesto = () => richieste.some((u) => chunk.some((c) => u.includes(c)));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.locator("#email").fill(studio.email);
  await page.locator("#password").fill(studio.password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL("**/app", { timeout: 30_000 });

  await page.goto(`/app/clienti/${cliente}/analisi`);

  // L'idratazione e' il momento in cui l'import sarebbe partito: prima di
  // quella, «non e' stato chiesto» non significherebbe nulla.
  await page.waitForFunction(
    () => Object.keys(document.body).some((k) => k.startsWith("__reactFiber")),
    undefined,
    { timeout: 15_000 },
  );
  await page.waitForLoadState("networkidle");

  expect(
    rechartsChiesto(),
    "recharts e' stato scaricato all'avvio, senza che i grafici fossero in vista: " +
      "l'osservatore in trend-esercizi.tsx non sta rinviando niente.",
  ).toBe(false);

  // Secondo tempo: sceso fin li', il grafico deve arrivare e disegnarsi. Senza
  // questa meta' il test sarebbe verde anche con i grafici rotti.
  await page.getByRole("heading", { name: /Andamento tra esercizi/i }).scrollIntoViewIfNeeded();

  await expect(page.locator("svg.recharts-surface").first()).toBeVisible({ timeout: 20_000 });
  expect(rechartsChiesto(), "il grafico si vede ma recharts non risulta chiesto: metro rotto").toBe(
    true,
  );

  spia.verifica("peso-avvio");
});
