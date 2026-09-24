import { DOMANDE, FUNZIONI, HERO, METODO, RISERVATEZZA } from "@/lib/contenuti";
import { indirizzo } from "@/lib/indirizzo";

/**
 * Descrizione testuale del prodotto per i motori generativi (llms.txt),
 * generata dagli stessi testi della pagina: non può raccontare altro.
 */
export const dynamic = "force-static";

export function GET() {
  const righe = [
    "# FinBeacon",
    "",
    `> ${HERO.titolo} ${HERO.sottotitolo}`,
    "",
    HERO.testo,
    "",
    "## Cosa fa",
    ...FUNZIONI.map((f) => `- ${f.titolo}: ${f.testo}`),
    "",
    "## Metodo",
    ...METODO.punti.map((p) => `- ${p.titolo}: ${p.testo}`),
    "",
    "## Riservatezza",
    ...RISERVATEZZA.punti.map((p) => `- ${p.titolo}: ${p.testo}`),
    "",
    "## Domande frequenti",
    ...DOMANDE.flatMap((d) => [`### ${d.domanda}`, d.risposta, ""]),
    "## Collegamenti",
    `- [Home](${indirizzo("/")})`,
    `- [Richiedi una demo](${indirizzo("/#richiesta")})`,
    `- [Informativa sulla privacy](${indirizzo("/privacy")})`,
    "",
  ];
  return new Response(righe.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
