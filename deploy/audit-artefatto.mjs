#!/usr/bin/env node
/**
 * Cancello di sicurezza sul PERIMETRO CHE SPEDIAMO DAVVERO.
 *
 * `pnpm audit` guarda il grafo delle dipendenze. Il grafo non è l'immagine: il
 * Dockerfile copia nel runtime solo `.next/standalone` (più `.next/static`, i
 * tre bundle e `drizzle`), e dentro `standalone` ci finisce ciò che il file
 * tracing di Next ha davvero raggiunto. I due insiemi sono molto diversi.
 *
 * Misurato su questo progetto il 19 settembre 2026, con 18 avvisi alti:
 *
 *     albero completo   18 alti   include eslint, vitest, la CLI di shadcn
 *     --prod            10 alti   include il plugin webpack di Sentry e
 *                                 styled-jsx > @babel/core dentro Next:
 *                                 dipendenze legittime, ma di COMPILAZIONE
 *     immagine reale     1 alto   nanoid, nella copia compilata dentro Next
 *
 * Con `--audit-level=high` sull'albero completo il cancello bloccava il
 * RILASCIO (il lavoro `immagine` dipende da `sicurezza`) per un `js-yaml` che
 * vive dentro eslint. Severo sul perimetro sbagliato è severo per finta.
 *
 * Questo script non abbassa l'asticella: la sposta dove il rischio esiste.
 * Fallisce se un pacchetto con avviso alto o critico è PRESENTE nell'artefatto.
 *
 * Richiede che la build sia già stata fatta: gira nel lavoro end-to-end, che
 * costruisce comunque, così non costa una seconda compilazione.
 *
 *   node deploy/audit-artefatto.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const RADICE = resolve(import.meta.dirname, "..");
const ARTEFATTO = join(RADICE, "apps/web/.next/standalone");

if (!existsSync(ARTEFATTO)) {
  console.error(
    `[audit-artefatto] manca ${ARTEFATTO}: serve una build (pnpm --filter web e2e:prepara).`,
  );
  process.exit(2);
}

/** Avvisi alti e critici dall'audit. Le eccezioni di pnpm-workspace.yaml sono già applicate da pnpm. */
function avvisiGravi() {
  let grezzo = "";
  try {
    grezzo = execFileSync("pnpm", ["audit", "--json"], {
      cwd: RADICE,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === "win32",
    });
  } catch (e) {
    // `pnpm audit` esce con 1 quando trova qualcosa: è il caso normale qui.
    grezzo = e.stdout ?? "";
  }
  const inizio = grezzo.indexOf("{");
  if (inizio < 0) throw new Error("audit senza JSON in uscita");
  const dati = JSON.parse(grezzo.slice(inizio));
  const per = new Map();
  for (const a of Object.values(dati.advisories ?? {})) {
    if (a.severity !== "high" && a.severity !== "critical") continue;
    const voce = per.get(a.module_name) ?? { moduli: a.module_name, avvisi: [] };
    voce.avvisi.push(`${a.severity} ${a.github_advisory_id ?? ""} ${a.title}`.trim());
    per.set(a.module_name, voce);
  }
  return per;
}

/**
 * Nomi presenti dentro l'artefatto.
 *
 * Si guarda OVUNQUE, non solo sotto `node_modules`. La prima versione di
 * questo script cercava i pacchetti solo dove un pacchetto sta di solito, e
 * dichiarava `nanoid` non spedito: `nanoid` sta in
 * `next/dist/compiled/nanoid`, INCORPORATO dentro Next. Il cancello diceva
 * "tutto a posto" sull'unico pacchetto vulnerabile che spediamo davvero.
 *
 * E' la trappola di GUASTI G-32 applicata allo strumento invece che al
 * prodotto: assenza di misura e misura di assenza danno lo stesso numero.
 * Meglio qualche falso positivo, che si legge e si valuta, di un falso
 * negativo silenzioso.
 */
function nomiNellArtefatto() {
  const trovati = new Set();
  const visita = (dir, profondita = 0) => {
    if (profondita > 14) return;
    let voci;
    try {
      voci = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const v of voci) {
      if (!v.isDirectory()) continue;
      trovati.add(v.name);
      // I pacchetti con scope vivono in due livelli: @scope/nome.
      if (v.name.startsWith("@")) {
        try {
          for (const q of readdirSync(join(dir, v.name), { withFileTypes: true }))
            if (q.isDirectory()) trovati.add(`${v.name}/${q.name}`);
        } catch {
          /* cartella non leggibile: si prosegue */
        }
      }
      visita(join(dir, v.name), profondita + 1);
    }
  };
  visita(ARTEFATTO);
  return trovati;
}

const gravi = avvisiGravi();
const presenti = nomiNellArtefatto();
const esposti = [...gravi.keys()].filter((m) => presenti.has(m));

console.log(`[audit-artefatto] nomi trovati nell'immagine: ${presenti.size}`);
console.log(`[audit-artefatto] moduli con avviso alto o critico nel grafo: ${gravi.size}`);

if (esposti.length === 0) {
  const nonSpediti = [...gravi.keys()].sort().join(", ");
  console.log(`[audit-artefatto] di cui PRESENTI nell'immagine: 0`);
  if (nonSpediti) console.log(`[audit-artefatto] non spediti (build o sviluppo): ${nonSpediti}`);
  console.log("[audit-artefatto] OK");
  process.exit(0);
}

console.error(`\n[audit-artefatto] ${esposti.length} pacchetti vulnerabili SONO nell'immagine:\n`);
for (const m of esposti) for (const a of gravi.get(m).avvisi) console.error(`  ${m}: ${a}`);
console.error(
  "\nNon è un avviso da ignorare: questo codice gira in produzione. Aggiorna, oppure\n" +
    "aggiungi un'eccezione in pnpm-workspace.yaml CON motivazione e data di revisione\n" +
    'in "//eccezioni-audit" nel package.json di radice.',
);
process.exit(1);
