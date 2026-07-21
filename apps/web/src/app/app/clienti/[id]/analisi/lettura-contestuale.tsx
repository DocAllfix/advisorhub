/**
 * Lettura in relazione a settore e dimensione, e legenda delle soglie.
 * Contenuto didattico ereditato dai report del prototipo: senza questo, un
 * indicatore fuori scala verrebbe letto come giudizio assoluto anziché relativo.
 */
const COLONNE = [
  {
    titolo: "Marginalità (ROS, ROI, ROE)",
    testo:
      "Nei servizi ad alto valore intellettuale un ROS sopra il 15% è comune, nel commercio all'ingrosso il 2-4% può essere normale. Confronta sempre con benchmark di settore e dimensione (micro contro PMI strutturata).",
  },
  {
    titolo: "Efficienza (Turnover, IC)",
    testo:
      "Un Turnover sotto 1 è tipico nel manifatturiero capital intensive, sopra 2 nella distribuzione snella. Un IC alto non è di per sé negativo se il ROS compensa: conta il prodotto ROS × Turnover, cioè il ROI.",
  },
  {
    titolo: "Sostenibilità (GI, PFN/EBITDA)",
    testo:
      "Un GI sotto 3 anni è bancabile in quasi tutti i settori, tra 3 e 4,5 richiede covenant leggeri, oltre 5 va gestito con un piano di rientro. Valuta anche la stagionalità dell'EBITDA e i picchi di capitale circolante.",
  },
];

const SOGLIE = [
  "ROS > 10% ottimo",
  "Turnover > 1 ottimo",
  "ROI > 8% ottimo",
  "ROE 5-15% buono",
  "GI < 2 anni ottimo",
  "DSCR > 1,5 ottimo",
  "DSCR 6M > 1,1 (CNDCEC)",
];

export function LetturaContestuale() {
  return (
    <section className="rounded-xl border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
        Cosa significa, in relazione a settore e dimensione
      </h2>
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {COLONNE.map((c) => (
          <div key={c.titolo} className="p-5">
            <h3 className="text-sm font-semibold">{c.titolo}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.testo}</p>
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        {SOGLIE.map((s) => (
          <li key={s} className="nums">
            {s}
          </li>
        ))}
      </ul>
    </section>
  );
}
