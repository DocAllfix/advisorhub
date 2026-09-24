import type { Metadata } from "next";

import { PaginaTesto } from "@/components/pagina-testo";
import { TITOLARE } from "@/lib/configurazione";
import { dataEstesa, REVISIONI } from "@/lib/revisioni";

export const metadata: Metadata = {
  title: "Note legali",
  description: "Chi pubblica questo sito e come contattarlo.",
  alternates: { canonical: "/note-legali" },
};

export default function NoteLegali() {
  return (
    <PaginaTesto titolo="Note legali" aggiornamento={dataEstesa(REVISIONI.noteLegali)}>
      <h2>Chi pubblica questo sito</h2>
      {TITOLARE ? (
        <p>
          {TITOLARE.nome ?? "FinBeacon"}
          <br />
          <a href={`mailto:${TITOLARE.emailPrivacy}`}>{TITOLARE.emailPrivacy}</a>
        </p>
      ) : (
        <p className="da-completare">
          Contatto del titolare da completare prima della pubblicazione.
        </p>
      )}

      <h2>I dati mostrati in queste pagine</h2>
      <p>
        Lo studio, il cliente e le cifre che compaiono negli esempi sono inventati. Sono calcolati
        dal motore di FinBeacon per mostrare come lavora, e non si riferiscono a persone o imprese
        reali.
      </p>

      <h2>Marchi</h2>
      <p>FinBeacon e il suo marchio appartengono al titolare del sito.</p>
    </PaginaTesto>
  );
}
