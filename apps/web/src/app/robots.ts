import type { MetadataRoute } from "next";

/**
 * Le istanze cliente non devono MAI comparire nei motori di ricerca: ogni
 * sottodominio e' lo spazio di lavoro privato di uno studio.
 *
 * Il crawling resta permesso di proposito: un Disallow impedirebbe ai bot di
 * leggere il noindex, lasciando gli URL nudi comunque indicizzabili. Il divieto
 * vero e' l'header X-Robots-Tag, emesso anche dal reverse proxy.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
  };
}
