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
 * COSA MISURA, e perche' due colonne.
 *
 * AVVIO: i chunk che la rotta dichiara nel suo
 * `page_client-reference-manifest.js`, cioe' il JavaScript che il browser
 * scarica per QUELLA pagina. Non i chunk condivisi di avvio, che sono uguali
 * per tutte e si misurano altrove.
 *
 * DIFFERITO: i chunk di `next/dynamic`, che stanno in un manifest diverso
 * (`page/react-loadable-manifest.json`) e nel primo non compaiono affatto.
 *
 * La prima versione guardava solo l'avvio, e il risultato e' stato un cancello
 * che si compiaceva: dichiarava l'analisi a 331 KB mentre 348 KB di recharts
 * stavano in un chunk differito che non vedeva — piu' di quanto misurasse.
 * Peggio: un import spostato sotto `next/dynamic` spariva dal conto e sembrava
 * un guadagno anche quando il chunk continuava a scaricarsi all'avvio.
 *
 * I due tetti sono separati apposta. Sommarli punirebbe un rinvio fatto bene;
 * tenerne uno solo sarebbe tornare a non vedere.
 *
 * QUELLO CHE QUESTO CONTO NON DICE e' QUANDO un chunk differito si scarica
 * davvero: `ssr: false` significa «non sul server», non «al bisogno». Quello
 * si prova solo guardando le richieste di rete, e vive in e2e.
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
 *
 * `differito: 0` non e' pigrizia: quelle due rotte oggi non hanno nessun
 * `next/dynamic`, e se domani ne compare uno vogliamo accorgercene e decidere,
 * non ereditarlo.
 */
const TETTI = [
  { rotta: "app/page", nome: "panoramica", tetto: 330, differito: 0 },
  { rotta: "app/clienti/page", nome: "portafoglio", tetto: 410, differito: 380 },
  { rotta: "app/clienti/[id]/analisi/page", nome: "analisi", tetto: 370, differito: 440 },
  { rotta: "app/scadenze/page", nome: "scadenze", tetto: 330, differito: 380 },
  { rotta: "(auth)/login/page", nome: "accesso", tetto: 140, differito: 0 },
];

if (!existsSync(NEXT)) {
  console.error(`[budget-js] manca ${NEXT}: serve una build (pnpm --filter web e2e:prepara).`);
  process.exit(2);
}

/** Somma in KB dei chunk indicati, ignorando i nomi che non esistono su disco. */
function sommaKb(chunk) {
  let kb = 0;
  for (const c of chunk) {
    const f = join(NEXT, c);
    if (existsSync(f)) kb += statSync(f).size / 1024;
  }
  return Math.round(kb);
}

function pesoRotta(rotta) {
  const manifest = join(NEXT, "server/app", `${rotta}_client-reference-manifest.js`);
  if (!existsSync(manifest)) return null;
  const testo = readFileSync(manifest, "utf8");
  const avvio = new Set(testo.match(/static\/chunks\/[A-Za-z0-9_~.-]+\.js/g) ?? []);

  // I chunk di next/dynamic stanno in un manifest tutto loro: assente = nessuno.
  const loadable = join(NEXT, "server/app", rotta, "react-loadable-manifest.json");
  const differiti = new Set();
  if (existsSync(loadable)) {
    for (const voce of Object.values(JSON.parse(readFileSync(loadable, "utf8")))) {
      for (const f of voce.files ?? []) differiti.add(f);
    }
  }

  return { avvio: sommaKb(avvio), differito: sommaKb(differiti), quanti: differiti.size };
}

let sforati = 0;
console.log("[budget-js] JavaScript per pagina, contro il tetto\n");
console.log(`  ${"".padEnd(14)}   all'avvio            differito (next/dynamic)`);
for (const { rotta, nome, tetto, differito } of TETTI) {
  const peso = pesoRotta(rotta);
  if (peso === null) {
    console.error(`  ${nome.padEnd(14)} manifest assente — la rotta è stata rinominata?`);
    sforati++;
    continue;
  }
  const colonna = (kb, t) => {
    if (kb > t) sforati++;
    return `${String(kb).padStart(4)} su ${String(t).padStart(4)} KB ${(kb > t ? "SFORA" : "ok").padEnd(5)}`;
  };
  console.log(
    `  ${nome.padEnd(14)} ${colonna(peso.avvio, tetto)}  ${colonna(peso.differito, differito)}` +
      `${peso.quanti ? ` in ${peso.quanti} chunk` : ""}`,
  );
}

if (sforati === 0) {
  console.log("\n[budget-js] OK");
  process.exit(0);
}

console.error(
  `\n[budget-js] ${sforati} tetti superati.\n` +
    "Di solito non è una scelta: è un import che tira dentro più di quanto sembra.\n" +
    "Prima di alzare il tetto, guarda COSA è entrato:\n" +
    "  - una libreria che serve solo a un pannello -> caricala con next/dynamic;\n" +
    "  - un'etichetta importata da un modulo con schemi zod -> separa le etichette;\n" +
    "  - un componente diventato client per un solo stato -> vedi se basta <details>.\n" +
    "Se a sforare è la colonna DIFFERITO, ricorda che spostare un import sotto\n" +
    "next/dynamic non lo toglie: lo sposta. Perché si scarichi davvero al bisogno\n" +
    "serve che il componente non venga reso finché non serve.\n" +
    "Se il tetto va alzato davvero, alzalo scrivendo nel commit perché.",
);
process.exit(1);
