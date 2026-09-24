/**
 * Dopo il build: OGNI pagina della landing deve essere pre-renderizzata.
 *
 * La staticità è ciò che tiene basso l'LCP, e si perde in silenzio: basta un
 * `headers()` o un `cookies()` in un componente, o un layout copiato da
 * apps/web (che è dinamico per necessità, GUASTI G-28). Il build non fallisce,
 * la pagina funziona, e diventa solo più lenta. Questo controllo lo rende un
 * errore.
 *
 *   node scripts/verifica-statica.mjs      (dopo `next build`)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NEXT = join(import.meta.dirname, "..", ".next");

if (!existsSync(join(NEXT, "prerender-manifest.json"))) {
  console.error(
    "[verifica-statica] manca .next/prerender-manifest.json: esegui prima `next build`.",
  );
  process.exit(2);
}

const prerender = JSON.parse(readFileSync(join(NEXT, "prerender-manifest.json"), "utf8"));
const statiche = new Set(Object.keys(prerender.routes ?? {}));
const rotte = JSON.parse(readFileSync(join(NEXT, "app-path-routes-manifest.json"), "utf8"));

// Le pagine, più le rotte di metadati e di testo che devono uscire dalla CDN.
const attese = new Set(
  Object.entries(rotte)
    .filter(([interno]) => interno.endsWith("/page"))
    .map(([, pubblico]) => pubblico)
    .filter((r) => r !== "/_not-found"),
);
for (const r of [
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/llms.txt",
  "/opengraph-image",
]) {
  attese.add(r);
}

const dinamiche = [...attese].filter((r) => !statiche.has(r));

console.log("[verifica-statica] rotte attese statiche:");
for (const r of [...attese].sort())
  console.log(`  ${statiche.has(r) ? "OK      " : "DINAMICA"}  ${r}`);

if (dinamiche.length > 0) {
  console.error(
    `\n[verifica-statica] ${dinamiche.length} rotte NON sono pre-renderizzate: ${dinamiche.join(", ")}.\n` +
      "Cerca headers(), cookies(), searchParams letti dal server o `dynamic` nel layout.",
  );
  process.exit(1);
}
console.log("\n[verifica-statica] OK: tutte statiche.");
