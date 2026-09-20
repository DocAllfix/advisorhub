import { expect, test } from "@playwright/test";

import { creaStudio } from "./aiuto";
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
 * Il PDF è il deliverable di valore del prodotto: il documento che il
 * commercialista consegna al cliente e alla banca.
 *
 * Questo test esiste per un difetto reale (GUASTI G-09): i font venivano letti
 * da un percorso composto a runtime sotto `src/`, che nella build standalone non
 * esiste. In sviluppo funzionava, in produzione no, e un build verde non diceva
 * nulla. Per questo i test girano contro il server standalone e scaricano il
 * file per davvero invece di controllare solo lo stato della risposta.
 */
test("il report si scarica come PDF valido dalla build di produzione", async ({
  context,
  baseURL,
}) => {
  const request = context.request;
  await creaStudio(request, baseURL!, "report");
  const org = await idStudio(request);
  const cliente = await creaClienteConEsercizio(org, "Rossi & Figli Spa", 2026);

  const r = await request.get(`/api/report/${cliente}`);
  expect(r.status()).toBe(200);

  const h = r.headers();
  expect(h["content-type"]).toBe("application/pdf");
  // Dati contabili: mai in cache.
  expect(h["cache-control"]).toContain("no-store");
  // Il nome del file è sanificato: niente caratteri che permettano di iniettare
  // altre direttive nell'intestazione.
  expect(h["content-disposition"]).toContain(
    'attachment; filename="Analisi_Rossi_Figli_Spa_2026.pdf"',
  );

  const corpo = await r.body();
  expect(corpo.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  // Un PDF con i font incorporati pesa decine di KB: se i font mancassero,
  // react-pdf ripiegherebbe su Helvetica e il file sarebbe molto più piccolo.
  expect(corpo.byteLength).toBeGreaterThan(20_000);
});

test("un cliente senza esercizi non produce un report", async ({ context, baseURL }) => {
  const request = context.request;
  await creaStudio(request, baseURL!, "vuoto");
  const org = await idStudio(request);

  const { conDatabase } = await import("./dati");
  const clienteId = await conDatabase(async (c) => {
    const r = await c.query(
      `insert into clienti (organization_id, ragione_sociale) values ($1, $2) returning id`,
      [org, "Cliente Senza Esercizi Srl"],
    );
    return r.rows[0].id as string;
  });

  const r = await request.get(`/api/report/${clienteId}`);
  expect(r.status()).toBe(404);
  expect(await r.text()).toContain("Nessun esercizio");
});
