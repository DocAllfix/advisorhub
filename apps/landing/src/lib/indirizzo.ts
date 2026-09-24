/**
 * L'unico indirizzo pubblico della landing. Tutto ciò che deve essere assoluto
 * (canonical, Open Graph, sitemap, dati strutturati) parte da qui, così un
 * cambio di dominio si fa in un punto solo.
 *
 * Il dominio delle istanze cliente è un altro (`<slug>.finbeacon.it`) e non
 * compare mai in questa app: le istanze sono private e non indicizzabili.
 */
export const SITO = "https://finbeacon.eu";

export const NOME = "FinBeacon";

/** URL assoluto per un percorso del sito. */
export function indirizzo(percorso = "/"): string {
  return new URL(percorso, SITO).toString();
}

/**
 * Vero solo sul deploy di produzione di Vercel. Le anteprime e lo sviluppo
 * locale non devono mai essere indicizzati né spedire posta reale.
 */
export const IN_PRODUZIONE = process.env.VERCEL_ENV === "production";
