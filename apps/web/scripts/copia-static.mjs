import fs from "node:fs";
import path from "node:path";

/**
 * Next copia `public/` dentro `.next/standalone`, ma NON `.next/static`:
 * senza questo passo il server standalone serve l'HTML e nessun asset, e
 * l'applicazione resta ferma a meta' senza errori evidenti (GUASTI G-06).
 */
const radice = process.cwd();
const da = path.join(radice, ".next", "static");
const a = path.join(radice, ".next", "standalone", "apps", "web", ".next", "static");

if (!fs.existsSync(da)) {
  console.error(`[static] ${da} non esiste: esegui prima "next build".`);
  process.exit(1);
}
fs.rmSync(a, { recursive: true, force: true });
fs.mkdirSync(path.dirname(a), { recursive: true });
fs.cpSync(da, a, { recursive: true });
console.log(`[static] copiato in ${a}`);
