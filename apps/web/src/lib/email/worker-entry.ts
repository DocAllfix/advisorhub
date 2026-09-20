/**
 * Punto d'ingresso del container `mail-worker`.
 *
 * Viene impacchettato in un singolo worker.js da `pnpm --filter web build:worker`:
 * il server standalone di Next non include le devDependencies, quindi il worker
 * non puo' girare con tsx dentro l'immagine.
 */
import { avvia } from "./worker";

avvia().catch((errore) => {
  console.error("[posta] worker terminato:", errore);
  process.exit(1);
});
