import { DOMANDE, FUNZIONI, HERO } from "./contenuti";
import { indirizzo, NOME, SITO } from "./indirizzo";

/**
 * I dati strutturati della home. Scelte, con il motivo:
 *
 * - `SoftwareApplication` SENZA `offers`: la landing non mostra prezzi, e
 *   inventarne uno per ottenere lo snippet sarebbe falso. Senza `offers` niente
 *   risultato arricchito, ma lo schema resta valido e dice ai motori cos'è.
 * - Niente `Product`: senza offerte, recensioni o valutazioni genera avvisi.
 * - `FAQPage` dallo STESSO array della sezione in pagina: non possono divergere.
 *   Google oggi mostra quasi solo ai siti istituzionali lo snippet FAQ; serve ai
 *   motori e ai modelli linguistici, non a uno snippet.
 */
export function schemaHome(): Record<string, unknown> {
  const organizzazione = {
    "@type": "Organization",
    "@id": `${SITO}/#organizzazione`,
    name: NOME,
    url: SITO,
    logo: indirizzo("/icon-512.png"),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizzazione,
      {
        "@type": "WebSite",
        "@id": `${SITO}/#sito`,
        name: NOME,
        url: SITO,
        inLanguage: "it-IT",
        publisher: { "@id": organizzazione["@id"] },
      },
      {
        "@type": "SoftwareApplication",
        name: NOME,
        url: SITO,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Analisi di bilancio e allerta crisi",
        operatingSystem: "Web",
        inLanguage: "it-IT",
        description: `${HERO.titolo} ${HERO.sottotitolo}`,
        featureList: FUNZIONI.map((f) => f.titolo),
        audience: { "@type": "BusinessAudience", audienceType: "Studi commercialisti" },
        provider: { "@id": organizzazione["@id"] },
      },
      {
        "@type": "FAQPage",
        mainEntity: DOMANDE.map((d) => ({
          "@type": "Question",
          name: d.domanda,
          acceptedAnswer: { "@type": "Answer", text: d.risposta },
        })),
      },
    ],
  };
}
