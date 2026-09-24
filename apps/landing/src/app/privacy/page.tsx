import type { Metadata } from "next";

import { PaginaTesto } from "@/components/pagina-testo";
import { CONSERVAZIONE_RICHIESTE, TITOLARE } from "@/lib/configurazione";
import { dataEstesa, REVISIONI } from "@/lib/revisioni";

export const metadata: Metadata = {
  title: "Informativa sulla privacy",
  description: "Come FinBeacon tratta i dati inviati con il modulo di richiesta demo.",
  alternates: { canonical: "/privacy" },
};

/**
 * BOZZA da far rivedere al titolare prima del lancio. L'unico dato che solo lui
 * può fornire è il contatto: finché manca, la pagina lo segnala e
 * `scripts/verifica-lancio.mjs` blocca il build di produzione.
 */
export default function Privacy() {
  const titolare = TITOLARE;
  return (
    <PaginaTesto titolo="Informativa sulla privacy" aggiornamento={dataEstesa(REVISIONI.privacy)}>
      <p>
        Questa informativa riguarda i dati che invii con il modulo «Richiedi una demo» di questo
        sito, ai sensi dell&apos;art. 13 del Regolamento (UE) 2016/679.
      </p>

      <h2>Titolare del trattamento</h2>
      {titolare ? (
        <p>
          {titolare.nome ? `${titolare.nome}, titolare di FinBeacon.` : "Il titolare di FinBeacon."}{" "}
          Per qualunque richiesta sui tuoi dati puoi scrivere a{" "}
          <a href={`mailto:${titolare.emailPrivacy}`}>{titolare.emailPrivacy}</a>.
        </p>
      ) : (
        <p className="da-completare">
          Contatto del titolare da completare prima della pubblicazione.
        </p>
      )}

      <h2>Quali dati trattiamo</h2>
      <p>
        Quelli che scrivi nel modulo: nome e cognome, studio, indirizzo email e, se li indichi,
        telefono, numero indicativo di clienti seguiti e messaggio. Il sito non usa cookie di
        profilazione né di terze parti, e non ti chiede alcun consenso a riceverne.
      </p>

      <h2>Perché, e su quale base</h2>
      <p>
        Per rispondere alla tua richiesta e organizzare la demo o l&apos;appuntamento che hai
        chiesto. La base giuridica è l&apos;esecuzione di misure precontrattuali adottate su tua
        richiesta (art. 6, par. 1, lett. b del Regolamento). Non usiamo questi dati per inviarti
        comunicazioni commerciali.
      </p>

      <h2>Chi li tratta</h2>
      <p>
        Le persone del titolare che si occupano della tua richiesta, e i fornitori tecnici che ci
        servono per riceverla: il servizio che ospita il sito e quello che recapita la posta
        elettronica, nominati responsabili del trattamento.
      </p>

      <h2>Per quanto tempo</h2>
      <p>{CONSERVAZIONE_RICHIESTE}</p>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedere l&apos;accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione
        del trattamento e la portabilità, e opporti al trattamento, scrivendo all&apos;indirizzo del
        titolare. Puoi anche proporre reclamo al Garante per la protezione dei dati personali.
      </p>

      <h2>Se non ci dai i dati</h2>
      <p>
        Nome, studio ed email servono per risponderti: senza, non possiamo dar seguito alla
        richiesta. Gli altri campi sono facoltativi.
      </p>
    </PaginaTesto>
  );
}
