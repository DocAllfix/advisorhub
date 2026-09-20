import fs from "node:fs";
import path from "node:path";

/**
 * Directory dei font del report, risolta a runtime.
 *
 * I font NON possono stare sotto src/: con `output: "standalone"` quella cartella
 * non finisce nell'immagine, e il percorso — essendo composto a runtime — sfugge
 * al file tracing di Next. Il risultato sarebbe un download del report che
 * fallisce solo in produzione.
 *
 * Vivono quindi in public/, che viene sempre copiato. La directory di lavoro però
 * cambia fra `next dev`, `next start` e il server standalone dentro il container:
 * invece di indovinarla, si prova la lista e si usa la prima che esiste davvero.
 */
const CANDIDATI = [
  path.join(process.cwd(), "public", "fonts", "report"),
  path.join(process.cwd(), "apps", "web", "public", "fonts", "report"),
  path.join(process.cwd(), "..", "..", "apps", "web", "public", "fonts", "report"),
];

export function cartellaFont(): string {
  const trovata = CANDIDATI.find((c) => fs.existsSync(c));
  if (!trovata) {
    throw new Error(
      `Font del report non trovati. Cercati in:\n${CANDIDATI.map((c) => `  - ${c}`).join("\n")}`,
    );
  }
  return trovata;
}
