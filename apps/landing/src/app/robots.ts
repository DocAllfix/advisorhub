import type { MetadataRoute } from "next";

import { IN_PRODUZIONE, indirizzo } from "@/lib/indirizzo";

/**
 * Logica OPPOSTA a quella delle istanze cliente (`apps/web/src/app/robots.ts`):
 * lì tutto è privato; qui la landing è l'unica superficie del prodotto che deve
 * farsi trovare, anche dai motori generativi, che sono ammessi per nome.
 *
 * Fuori produzione (anteprime di Vercel, sviluppo) niente indicizzazione: il
 * divieto vero è l'intestazione X-Robots-Tag in next.config.ts, questo lo
 * accompagna.
 */
const MOTORI_GENERATIVI = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  if (!IN_PRODUZIONE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: MOTORI_GENERATIVI, allow: "/" },
    ],
    sitemap: indirizzo("/sitemap.xml"),
    host: indirizzo("/"),
  };
}
