import { expect, test } from "@playwright/test";

import { accedi, creaStudio } from "./aiuto";
import { creaClienteConEsercizio, idStudio } from "./dati";

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
 * Regola 3 del CLAUDE.md di progetto: «per ogni superficie nuova va verificato
 * che un altro studio riceva 404».
 *
 * Fino a oggi era verificata solo a mano. È l'invariante che protegge i bilanci
 * dei clienti di uno studio dagli occhi di un altro: senza un test, una singola
 * query futura che dimentichi il filtro la rompe in silenzio.
 */
test("uno studio non vede il report di un cliente di un altro studio", async ({
  context,
  baseURL,
}) => {
  const request = context.request;
  const base = baseURL!;

  // Studio A, con un cliente suo.
  const a = await creaStudio(request, base, "alfa");
  const orgA = await idStudio(request);
  const clienteA = await creaClienteConEsercizio(orgA, "Cliente Alfa Spa");

  // Il proprietario lo scarica senza problemi.
  const suo = await request.get(`/api/report/${clienteA}`);
  expect(suo.status()).toBe(200);

  // Studio B: stessa macchina, stesso database, altro tenant.
  await creaStudio(request, base, "beta");
  const altrui = await request.get(`/api/report/${clienteA}`);
  expect(altrui.status()).toBe(404);
  expect(await altrui.text()).toContain("non trovato");

  // E il proprietario continua a vederlo: il 404 è dovuto al tenant, non a un
  // guasto sopravvenuto.
  await accedi(request, base, a.email, a.password);
  const ancoraSuo = await request.get(`/api/report/${clienteA}`);
  expect(ancoraSuo.status()).toBe(200);
});

test("un identificatore malformato dà 404, non un errore di server", async ({
  context,
  baseURL,
}) => {
  const request = context.request;
  await creaStudio(request, baseURL!, "malformato");

  const r = await request.get("/api/report/non-e-un-uuid");
  expect(r.status()).toBe(404);
});

test("senza sessione il report non è accessibile", async ({ browser, baseURL }) => {
  const base = baseURL!;

  // Contesto separato: nessun cookie di sessione.
  const anonimo = await browser.newContext({ baseURL: base });
  const setup = await browser.newContext({ baseURL: base });
  const s = await creaStudio(setup.request, base, "anonimo");
  expect(s.email).toBeTruthy();
  const org = await idStudio(setup.request);
  const cliente = await creaClienteConEsercizio(org, "Cliente Riservato Spa");

  const r = await anonimo.request.get(`/api/report/${cliente}`, { maxRedirects: 0 });
  // requireStudio() reindirizza al login: mai un 200, mai il PDF.
  expect(r.status()).not.toBe(200);
  expect([302, 303, 307]).toContain(r.status());

  await anonimo.close();
  await setup.close();
});
