/**
 * Prima del build di PRODUZIONE: ciò che solo il titolare può decidere deve
 * esserci, altrimenti il build si ferma.
 *
 * Senza questi dati la pagina funziona lo stesso, e mostra segnaposto ben
 * visibili nell'informativa e nelle note legali: va bene su un'anteprima, non
 * su finbeacon.eu. Un'informativa privacy senza un contatto del titolare è un
 * obbligo di legge non rispettato (art. 13 GDPR), non un dettaglio.
 *
 * Fuori produzione (VERCEL_ENV diverso da "production") non controlla niente.
 */
const produzione = process.env.VERCEL_ENV === "production";

if (!produzione) {
  console.log("[verifica-lancio] non è un build di produzione: controlli saltati.");
  process.exit(0);
}

const richieste = {
  // Ragione sociale e P.IVA non richieste (decisione dell'utente, 24/09).
  // Il contatto del titolare sì: l'art. 13 GDPR lo vuole nell'informativa.
  LEGALE_EMAIL_PRIVACY: "indirizzo per le richieste privacy",
  DEMO_ATTIVO: 'invio del modulo attivo ("true")',
  SMTP_HOST: "relay SMTP",
  SMTP_FROM: "mittente delle richieste",
  DEMO_DESTINATARIO: "casella che riceve le richieste",
};

const mancanti = Object.entries(richieste).filter(([nome]) => !process.env[nome]);
if (process.env.DEMO_ATTIVO && process.env.DEMO_ATTIVO !== "true") {
  mancanti.push(["DEMO_ATTIVO", 'deve valere "true" in produzione']);
}

if (mancanti.length > 0) {
  console.error("[verifica-lancio] build di produzione FERMATO. Mancano:");
  for (const [nome, cosa] of mancanti) console.error(`  - ${nome}: ${cosa}`);
  process.exit(1);
}
console.log("[verifica-lancio] OK: contatto del titolare e invio del modulo presenti.");
