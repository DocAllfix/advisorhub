import { expect, test } from "@playwright/test";

import { creaStudio, emailUnica, intestazioni } from "./aiuto";
import { creaClienteConEsercizio, idStudio, rendiDimostrativo } from "./dati";

/**
 * NOTA sui cookie. I test autenticati usano `context.request`, cioe' il client
 * API del BROWSER, non il fixture `request` isolato.
 *
 * In produzione Better Auth emette il cookie di sessione con prefisso
 * `__Secure-` e attributo `Secure`, e i test girano contro la build di
 * produzione. Il fixture `request` non conserva un cookie Secure su http e ogni
 * chiamata autenticata risponde 401; un browser invece tratta 127.0.0.1 come
 * origine attendibile e lo conserva, esattamente come farebbe un utente vero su
 * https. Usare il contesto del browser e' quindi la simulazione fedele, non un
 * aggiramento.
 */

/**
 * Gli altri test parlano con le API. Questo apre davvero il browser, perché
 * alcune cose non si vedono altrimenti:
 *
 *  - che l'applicazione si idrati sotto la Content-Security-Policy. Una CSP
 *    sbagliata non dà 500: la pagina arriva e resta ferma a metà;
 *  - che la build standalone serva gli asset statici (`.next/static` va copiato
 *    a mano, GUASTI G-06);
 *  - che il gate dello studio dimostrativo sia visibile all'utente.
 */
test("accesso dall'interfaccia e navigazione autenticata", async ({ page, context, baseURL }) => {
  const request = context.request;
  const base = baseURL!;
  const email = emailUnica("interfaccia");
  const password = "ProvaE2E-Password-2026";

  // Registrazione via API: qui interessa l'accesso, non il modulo di iscrizione.
  await request.post("/api/auth/sign-up/email", {
    headers: intestazioni(base),
    data: { name: "Studio Interfaccia", email, password },
  });
  await request.post("/api/auth/organization/create", {
    headers: intestazioni(base),
    data: { name: "Studio Interfaccia", slug: `interfaccia-${Date.now()}` },
  });

  // Ogni violazione della CSP finisce in console: se la raccolgo, un errore di
  // configurazione non passa inosservato.
  const violazioni: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/Content Security Policy|Refused to (load|execute|apply)/i.test(t)) violazioni.push(t);
  });
  const erroriPagina: string[] = [];
  page.on("pageerror", (e) => erroriPagina.push(e.message));

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();

  // Il collegamento al recupero password deve esistere: senza, un utente
  // bloccato non ha alcuna via d'uscita dall'interfaccia.
  await expect(page.getByRole("link", { name: /password dimenticata/i })).toBeVisible();

  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();

  await page.waitForURL("**/app", { timeout: 30_000 });
  await expect(page.locator("body")).toContainText(/Studio Interfaccia|Panoramica|clienti/i);

  expect(violazioni, `violazioni CSP: ${violazioni.join(" | ")}`).toHaveLength(0);
  expect(erroriPagina, `errori JS: ${erroriPagina.join(" | ")}`).toHaveLength(0);
});

/**
 * Il test qui sopra si ferma a /app, e per molto tempo e' bastato. Non basta
 * piu': le superfici dense (analisi, portafoglio, scadenze, impostazioni) sono
 * quelle che cambiano di piu' e sono proprio quelle che il cono della rete non
 * copriva. Una CSP sbagliata la' dentro non darebbe 500 e nessuno se ne
 * accorgerebbe fino al browser di un cliente.
 *
 * Il giro va fatto anche a viewport stretto: il portafoglio a 375 px non e'
 * la stessa pagina che a 1440, e l'idratazione puo' fallire solo in uno dei due.
 */
test("ogni superficie autenticata si idrata sotto la CSP, larga e stretta", async ({
  page,
  context,
  baseURL,
}) => {
  const request = context.request;
  const base = baseURL!;
  const studio = await creaStudio(request, base, "superfici");
  const org = await idStudio(request);
  const cliente = await creaClienteConEsercizio(org, "Superfici Spa");

  const violazioni: string[] = [];
  const erroriPagina: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/Content Security Policy|Refused to (load|execute|apply)/i.test(t)) violazioni.push(t);
  });
  page.on("pageerror", (e) => erroriPagina.push(e.message));

  await page.goto("/login");
  await page.locator("#email").fill(studio.email);
  await page.locator("#password").fill(studio.password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL("**/app", { timeout: 30_000 });

  const superfici: [string, string, RegExp][] = [
    ["panoramica", "/app", /Panoramica|portafoglio/i],
    ["portafoglio", "/app/clienti", /Superfici Spa/],
    ["scheda cliente", `/app/clienti/${cliente}`, /Superfici Spa/],
    ["analisi", `/app/clienti/${cliente}/analisi`, /ROS|DSCR/],
    ["scadenze", "/app/scadenze", /Scadenz/i],
    ["impostazioni", "/app/impostazioni", /Impostazioni|Studio/i],
  ];

  for (const larghezza of [1440, 375]) {
    await page.setViewportSize({ width: larghezza, height: 900 });
    for (const [nome, rotta, atteso] of superfici) {
      await page.goto(rotta);
      // Il contenuto atteso e' la prova che l'idratazione e' arrivata in fondo:
      // con la CSP rotta la pagina risponde 200 e resta il guscio vuoto (G-28).
      await expect(page.locator("body"), `${nome} @${larghezza}`).toContainText(atteso);
    }
  }

  expect(violazioni, `violazioni CSP: ${violazioni.join(" | ")}`).toHaveLength(0);
  expect(erroriPagina, `errori JS: ${erroriPagina.join(" | ")}`).toHaveLength(0);
});

test("lo studio dimostrativo è dichiarato in sola lettura", async ({ page, context, baseURL }) => {
  const request = context.request;
  const base = baseURL!;
  const studio = await creaStudio(request, base, "dimostrativo");
  const org = await idStudio(request);
  const cliente = await creaClienteConEsercizio(org, "Cliente Dimostrativo Spa");
  await rendiDimostrativo(org);

  await page.goto("/login");
  await page.locator("#email").fill(studio.email);
  await page.locator("#password").fill(studio.password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL("**/app", { timeout: 30_000 });

  await page.goto(`/app/clienti/${cliente}/esercizi/nuovo`);
  // L'avviso è la parte visibile del gate; quella autorevole è `vietatoInDemo()`
  // in testa a ogni azione di scrittura, lato server.
  await expect(page.locator("body")).toContainText(/dimostrativ|sola lettura/i);
});

test("la pagina non trovata non espone la shell autenticata", async ({ page }) => {
  const r = await page.goto("/una-pagina-che-non-esiste");
  expect(r?.status()).toBe(404);
});
