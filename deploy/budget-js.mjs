#!/usr/bin/env node
/**
 * Tetto al JavaScript che ogni pagina scarica all'avvio.
 *
 * PERCHE' ESISTE. Il peso del client era cresciuto senza che nessuno se ne
 * accorgesse: il portafoglio scaricava 804 KB perche' un componente client
 * importava un'etichetta da un modulo che esegue `z.object(...)` in testa, e
 * l'analisi 820 perche' recharts arrivava con la pagina invece che coi
 * grafici. Nessuno dei due era una scelta: erano conseguenze di un import.
 *
 * Un tetto non rende veloce niente. Fa una cosa sola, che le misure di tempo
 * su questa macchina non riescono a fare: si accorge di una REGRESSIONE. Il
 * `benchmarkIndex` di Lighthouse qui oscilla fra 583 e 1303 fra una corsa e
 * l'altra, e la stessa pagina non toccata passa da 535 a 1570 ms di blocco.
 * I KB invece non dipendono dalla CPU di chi misura (GUASTI G-32: se una
 * misura sorprende, il primo sospettato e' il metro).
 *
 * COSA MISURA. I chunk che la rotta dichiara nel suo
 * `page_client-reference-manifest.js`, cioe' il JavaScript che il browser
 * scarica per QUELLA pagina. Non i chunk condivisi di avvio, che sono uguali
 * per tutte e si misurano altrove.
 *
 * I tetti sono fissati poco sopra i valori reali del giorno in cui sono stati
 * scritti: abbastanza stretti da vedere una regressione, abbastanza larghi da
 * non fallire per un'icona in piu'. Se un tetto va alzato, si alza con una
 * ragione scritta nel commit, non in silenzio.
 *
 * Richiede una build: gira nel lavoro end-to-end, che la fa comunque.
 *
 *   node deploy/budget-js.mjs
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const RADICE = resolve(import.meta.dirname, "..");
const NEXT = join(RADICE, "apps/web/.next");

/**
 * Tetti in KB, misurati il 20 settembre 2026 dopo il passaggio a componenti
 * server, piu' circa il 12% di margine.
 *
 * Il margine e' scelto, non generoso: con +90 KB di spazio una regressione del
 * 25% sarebbe passata inosservata, e un tetto che non si raggiunge mai non
 * misura niente. Con questo margine ci sta un'icona in piu', non una libreria.
 */
const TETTI = [
  { rotta: "app/page", nome: "panoramica", tetto: 330 },
  { rotta: "app/clienti/page", nome: "portafoglio", tetto: 410 },
  { rotta: "app/clienti/[id]/analisi/page", nome: "analisi", tetto: 370 },
  { rotta: "app/scadenze/page", nome: "scadenze", tetto: 330 },
  { rotta: "(auth)/login/page", nome: "accesso", tetto: 140 },
];

if (!existsSync(NEXT)) {
  console.error(`[budget-js] manca ${NEXT}: serve una build (pnpm --filter web e2e:prepara).`);
  process.exit(2);
}

function pesoRotta(rotta) {
  const manifest = join(NEXT, "server/app", `${rotta}_client-reference-manifest.js`);
  if (!existsSync(manifest)) return null;
  const testo = readFileSync(manifest, "utf8");
  const chunk = new Set(testo.match(/static\/chunks\/[A-Za-z0-9_~.-]+\.js/g) ?? []);
  let kb = 0;
  for (const c of chunk) {
    const f = join(NEXT, c);
    if (existsSync(f)) kb += statSync(f).size / 1024;
  }
  return Math.round(kb);
}

let sforati = 0;
console.log("[budget-js] JavaScript per pagina, contro il tetto\n");
for (const { rotta, nome, tetto } of TETTI) {
  const kb = pesoRotta(rotta);
  if (kb === null) {
    console.error(`  ${nome.padEnd(14)} manifest assente — la rotta è stata rinominata?`);
    sforati++;
    continue;
  }
  const margine = tetto - kb;
  const stato = margine < 0 ? "SFORA" : "ok";
  console.log(
    `  ${nome.padEnd(14)} ${String(kb).padStart(4)} KB  su ${String(tetto).padStart(4)} KB` +
      `  ${margine >= 0 ? "+" : ""}${margine} KB  ${stato}`,
  );
  if (margine < 0) sforati++;
}

if (sforati === 0) {
  console.log("\n[budget-js] OK");
  process.exit(0);
}

console.error(
  `\n[budget-js] ${sforati} pagine oltre il tetto.\n` +
    "Di solito non è una scelta: è un import che tira dentro più di quanto sembra.\n" +
    "Prima di alzare il tetto, guarda COSA è entrato:\n" +
    "  - una libreria che serve solo a un pannello -> caricala con next/dynamic;\n" +
    "  - un'etichetta importata da un modulo con schemi zod -> separa le etichette;\n" +
    "  - un componente diventato client per un solo stato -> vedi se basta <details>.\n" +
    "Se il tetto va alzato davvero, alzalo scrivendo nel commit perché.",
);
process.exit(1);
