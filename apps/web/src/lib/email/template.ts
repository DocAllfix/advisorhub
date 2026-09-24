/**
 * Testi delle email transazionali.
 *
 * Regola non negoziabile: i corpi sono CONTENT-FREE. Mai dati di bilancio, mai
 * ragioni sociali dei clienti dello studio, mai importi. Una casella di posta
 * non è un canale protetto: l'email dice cosa fare e porta all'applicazione,
 * dove la persona è autenticata.
 */

export type Messaggio = { oggetto: string; testo: string; html: string };

const MITTENTE_VISIBILE = "FinBeacon";

function guscio(titolo: string, paragrafi: string[], azione?: { testo: string; url: string }) {
  const corpo = paragrafi
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2b3038">${p}</p>`)
    .join("");
  const bottone = azione
    ? `<p style="margin:0 0 24px"><a href="${azione.url}" style="display:inline-block;background:#1f2937;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600">${azione.testo}</a></p>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7280">Se il pulsante non funziona, copia questo indirizzo nel browser:<br><span style="word-break:break-all;color:#374151">${azione.url}</span></p>`
    : "";

  return `<!doctype html>
<html lang="it"><body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb"><tr><td style="padding:32px">
    <p style="margin:0 0 24px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280">${MITTENTE_VISIBILE}</p>
    <h1 style="margin:0 0 16px;font-size:19px;font-weight:600;color:#111827">${titolo}</h1>
    ${corpo}
    ${bottone}
    <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.6;color:#9ca3af">Messaggio automatico: non rispondere a questo indirizzo.</p>
  </td></tr></table>
</body></html>`;
}

export function recuperoPassword(url: string): Messaggio {
  const titolo = "Reimposta la tua password";
  const paragrafi = [
    "Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo accesso a FinBeacon.",
    "Il link è valido per un'ora e può essere usato una sola volta.",
  ];
  return {
    oggetto: "Reimposta la tua password — FinBeacon",
    testo: [
      titolo,
      "",
      paragrafi.join("\n\n"),
      "",
      url,
      "",
      "Se non hai richiesto tu la reimpostazione, ignora questo messaggio: la password attuale resta valida.",
    ].join("\n"),
    html: guscio(
      titolo,
      [
        ...paragrafi,
        "Se non hai richiesto tu la reimpostazione, ignora questo messaggio: la password attuale resta valida.",
      ],
      { testo: "Reimposta la password", url },
    ),
  };
}

export function invitoCollaboratore(nomeStudio: string, url: string): Messaggio {
  const titolo = `Sei stato invitato in ${nomeStudio}`;
  const paragrafi = [
    `Hai ricevuto un invito a collaborare nello studio <strong>${nomeStudio}</strong> su FinBeacon.`,
    "Accetta l'invito per creare il tuo accesso personale.",
  ];
  return {
    oggetto: `Invito a collaborare in ${nomeStudio} — FinBeacon`,
    testo: [
      titolo,
      "",
      `Hai ricevuto un invito a collaborare nello studio ${nomeStudio} su FinBeacon.`,
      "Accetta l'invito per creare il tuo accesso personale.",
      "",
      url,
    ].join("\n"),
    html: guscio(titolo, paragrafi, { testo: "Accetta l'invito", url }),
  };
}

export function verificaEmail(url: string): Messaggio {
  const titolo = "Conferma il tuo indirizzo email";
  const paragrafi = [
    "Conferma questo indirizzo per completare l'attivazione del tuo accesso a FinBeacon.",
    "È l'indirizzo che useremo per farti recuperare la password: senza conferma, non potremmo aiutarti a rientrare.",
  ];
  return {
    oggetto: "Conferma il tuo indirizzo email — FinBeacon",
    testo: [titolo, "", paragrafi.join("\n\n").replace(/<[^>]+>/g, ""), "", url].join("\n"),
    html: guscio(titolo, paragrafi, { testo: "Conferma l'indirizzo", url }),
  };
}
