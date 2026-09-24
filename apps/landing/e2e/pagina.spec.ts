import { analizza, formatNumero } from "@advisorhub/engine";
import { expect, test, type Page } from "@playwright/test";

import { BILANCIO_ESEMPIO, PREVISIONALE_ESEMPIO } from "../src/lib/esempio";
import { PORTA_HTTP, type Messaggio } from "./smtp-finto";

/**
 * Raccoglie dalla console ogni errore o avviso: violazioni CSP, mancate
 * corrispondenze di idratazione (anche minificate, «Minified React error»),
 * eccezioni. Stessa impostazione di apps/web/e2e/aiuto.ts: si raccoglie tutto,
 * perché elencare solo ciò che si prevede rende ciechi sul resto (GUASTI G-33).
 */
function osservaConsole(page: Page) {
  const problemi: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problemi.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => problemi.push(`[eccezione] ${e.message}`));
  return {
    verifica(dove: string) {
      expect(problemi, `${dove}: ${problemi.join(" | ")}`).toHaveLength(0);
    },
  };
}

async function posta(): Promise<Messaggio[]> {
  const r = await fetch(`http://127.0.0.1:${PORTA_HTTP}/`);
  return (await r.json()) as Messaggio[];
}
async function svuotaPosta() {
  await fetch(`http://127.0.0.1:${PORTA_HTTP}/`, { method: "DELETE" });
}

test("i numeri sono già nell'HTML servito, senza JavaScript", async ({ request }) => {
  // Crawler, motori generativi e anteprime dei link non eseguono JavaScript:
  // se un numero nasce dal client, leggono uno zero (il difetto dei contatori
  // di evalisdeck). Qui si legge l'HTML grezzo.
  const html = await (await request.get("/")).text();
  const a = analizza(BILANCIO_ESEMPIO, PREVISIONALE_ESEMPIO);
  expect(html).toContain("Vedi la crisi arrivare, cliente per cliente.");
  expect(html).toContain(formatNumero(a.indicatori.dscrProspettico!, 2));
  expect(html).toContain(`>${a.score}<`);
});

test("la home si idrata pulita, alle tre larghezze, senza scorrimento orizzontale", async ({
  page,
}) => {
  const spia = osservaConsole(page);
  for (const larghezza of [1440, 768, 375]) {
    await page.setViewportSize({ width: larghezza, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Vedi la crisi arrivare, cliente per cliente.",
    );
    const largo = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(largo, `scorrimento orizzontale a ${larghezza}px`).toBe(false);
  }
  spia.verifica("home");
});

test("nessuna immagine raster sopra la piega: l'elemento più grande è testo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const raster = await page.locator("section[aria-labelledby=titolo-principale] img").count();
  expect(raster).toBe(0);
});

test("l'anteprima calcola con il motore vero, e torna ai valori di partenza", async ({ page }) => {
  const spia = osservaConsole(page);
  await page.goto("/#anteprima");
  const leva = page.getByRole("slider", { name: "Liquidità iniziale" });
  await leva.focus();
  // 30 passi da 1.000 € in su, da tastiera
  for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowRight");

  const attesa = analizza(BILANCIO_ESEMPIO, {
    ...PREVISIONALE_ESEMPIO,
    liquiditaIniziale: PREVISIONALE_ESEMPIO.liquiditaIniziale + 30_000,
  });
  const riquadro = page.locator("#anteprima [aria-live=polite]");
  await expect(riquadro).toContainText(formatNumero(attesa.indicatori.dscrProspettico!, 2));
  await expect(riquadro).toContainText(String(attesa.score));

  await page.getByRole("button", { name: "Torna ai valori di partenza" }).click();
  const partenza = analizza(BILANCIO_ESEMPIO, PREVISIONALE_ESEMPIO);
  await expect(riquadro).toContainText(formatNumero(partenza.indicatori.dscrProspettico!, 2));
  spia.verifica("anteprima");
});

test.describe("modulo di richiesta", () => {
  test.beforeEach(svuotaPosta);

  test("una richiesta valida arriva davvero alla casella commerciale", async ({ page }) => {
    const spia = osservaConsole(page);
    await page.goto("/#richiesta");
    await page.getByLabel("Nome e cognome", { exact: true }).fill("Giulia Verdi");
    await page.getByLabel("Studio", { exact: true }).fill("Studio Verdi di prova");
    await page.getByLabel("Email", { exact: true }).fill("giulia@esempio.test");
    await page.getByLabel("Cosa ti interessa", { exact: true }).selectOption("appuntamento");
    // La trappola del tempo scarta chi invia in meno di tre secondi.
    await page.waitForTimeout(3_200);
    await page.getByRole("button", { name: "Invia la richiesta" }).click();

    await expect(page.getByText("Richiesta ricevuta.")).toBeVisible();
    const arrivati = await posta();
    expect(arrivati).toHaveLength(1);
    expect(arrivati[0]!.a.join()).toContain("commerciale@finbeacon.test");
    expect(arrivati[0]!.grezzo).toContain("Studio Verdi di prova");
    expect(arrivati[0]!.grezzo).toContain("Fissare un appuntamento");
    spia.verifica("modulo");
  });

  test("un errore di validazione non svuota il modulo", async ({ page }) => {
    await page.goto("/#richiesta");
    await page.getByLabel("Nome e cognome", { exact: true }).fill("Giulia Verdi");
    await page.getByLabel("Studio", { exact: true }).fill("Studio Verdi di prova");
    await page.getByLabel("Email", { exact: true }).fill("non-una-email");
    await page.waitForTimeout(3_200);
    await page.getByRole("button", { name: "Invia la richiesta" }).click();

    await expect(page.getByText("Questo indirizzo email non sembra valido.")).toBeVisible();
    await expect(page.getByLabel("Nome e cognome", { exact: true })).toHaveValue("Giulia Verdi");
    await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("Studio Verdi di prova");
    expect(await posta()).toHaveLength(0);
  });

  test("un invio troppo rapido si scarta in silenzio", async ({ page }) => {
    await page.goto("/#richiesta");
    await page.getByLabel("Nome e cognome", { exact: true }).fill("Programma Veloce");
    await page.getByLabel("Studio", { exact: true }).fill("Nessuno");
    await page.getByLabel("Email", { exact: true }).fill("bot@esempio.test");
    await page.getByRole("button", { name: "Invia la richiesta" }).click();
    // Risponde come a un umano, per non istruire il programma, ma non spedisce.
    await expect(page.getByText("Richiesta ricevuta.")).toBeVisible();
    expect(await posta()).toHaveLength(0);
  });

  test("?motivo= preseleziona il motivo", async ({ page }) => {
    await page.goto("/?motivo=acquisto#richiesta");
    await expect(page.getByLabel("Cosa ti interessa", { exact: true })).toHaveValue("acquisto");
  });
});

test("SEO: robots, sitemap, llms.txt, manifest e immagine di anteprima rispondono", async ({
  request,
}) => {
  for (const percorso of [
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/manifest.webmanifest",
    "/opengraph-image",
  ]) {
    const r = await request.get(percorso);
    expect(r.status(), percorso).toBe(200);
  }
  const og = await request.get("/opengraph-image");
  expect(og.headers()["content-type"]).toContain("image/png");
});

test("fuori produzione la pagina non è indicizzabile, e le intestazioni di sicurezza ci sono", async ({
  request,
}) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["x-robots-tag"]).toContain("noindex");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
});

test("i dati strutturati sono JSON valido e la FAQ coincide con la pagina", async ({ page }) => {
  await page.goto("/");
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const dati = JSON.parse(json!) as { "@graph": { "@type": string; mainEntity?: unknown[] }[] };
  const faq = dati["@graph"].find((n) => n["@type"] === "FAQPage");
  expect(faq?.mainEntity?.length).toBe(await page.locator("#domande details").count());
});
