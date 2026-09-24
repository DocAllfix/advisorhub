/**
 * Ciò che dipende da decisioni ancora aperte o da servizi esterni. Ogni voce è
 * facoltativa: se manca, la pagina NON mostra il pulsante o il blocco che ne
 * dipende, invece di mostrare un pulsante che porta a un muro.
 */

/** Calendario per «Prenota una chiamata» (Cal.com o equivalente). Link esterno, mai incorporato. */
export const URL_PRENOTAZIONE: string | null = process.env.NEXT_PUBLIC_URL_PRENOTAZIONE || null;

/**
 * Istanza dimostrativa pubblica (lavoro della sessione che cura l'app).
 * Finché non esiste, «Entra nella demo» non compare.
 */
export const URL_DEMO_PUBBLICA: string | null = process.env.NEXT_PUBLIC_URL_DEMO || null;

/** Indirizzo di ripiego mostrato se l'invio del modulo fallisce. */
export const EMAIL_CONTATTO: string | null = process.env.NEXT_PUBLIC_EMAIL_CONTATTO || null;

/**
 * Per quanto si conservano le richieste di demo. In assenza di una scelta del
 * titolare vale un CRITERIO (art. 13 GDPR ammette i criteri al posto di una
 * durata), non un numero inventato.
 */
export const CONSERVAZIONE_RICHIESTE: string =
  process.env.PRIVACY_CONSERVAZIONE ||
  "Per il tempo necessario a dare seguito alla richiesta. Se non ne nasce un rapporto, i dati vengono cancellati.";

/**
 * Il titolare dell'informativa. Ragione sociale e partita IVA non sono
 * richieste (decisione dell'utente, 24/09); l'art. 13 GDPR vuole però un
 * CONTATTO del titolare, quindi l'indirizzo privacy è obbligatorio per la
 * produzione (`scripts/verifica-lancio.mjs`). Il nome è facoltativo.
 */
export const TITOLARE: { nome: string | null; emailPrivacy: string } | null = process.env
  .LEGALE_EMAIL_PRIVACY
  ? { nome: process.env.LEGALE_NOME || null, emailPrivacy: process.env.LEGALE_EMAIL_PRIVACY }
  : null;
