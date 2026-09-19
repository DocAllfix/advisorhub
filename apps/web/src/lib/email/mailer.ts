import nodemailer, { type Transporter } from "nodemailer";

/**
 * Invio SMTP. Volutamente sottile: tutta la logica di coda e di ritentativo sta
 * in outbox.ts e worker.ts, così questo modulo è sostituibile e mockabile.
 *
 * Senza SMTP_HOST il trasporto non esiste: `inviaSubito` lancia, il worker
 * registra il tentativo e il messaggio resta in coda. In sviluppo si punta a
 * Mailpit (localhost:1025), che cattura tutto senza spedire nulla davvero.
 */
let trasporto: Transporter | null = null;

export function smtpConfigurato(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function ottieniTrasporto(): Transporter {
  if (trasporto) return trasporto;
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP_HOST non configurato: impossibile spedire.");

  const porta = Number(process.env.SMTP_PORT ?? 587);
  const utente = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  // TLS obbligatorio verso un relay REMOTO, mai verso un sink in ascolto sulla
  // macchina stessa. Il discrimine non e' NODE_ENV: i test end-to-end girano con
  // NODE_ENV=production contro Mailpit, che STARTTLS non lo offre — e l'invio
  // fallirebbe con "Error upgrading connection with STARTTLS" lasciando le mail
  // in coda. Su loopback non c'e' rete da proteggere.
  const hostLocale = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);

  trasporto = nodemailer.createTransport({
    host,
    port: porta,
    // 465 e' TLS implicito; sulle altre porte si parte in chiaro e si sale con
    // STARTTLS.
    secure: porta === 465,
    requireTLS: !hostLocale && porta !== 465,
    auth: utente ? { user: utente, pass: password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return trasporto;
}

export async function inviaSubito(messaggio: {
  a: string;
  oggetto: string;
  testo: string;
  html?: string | null;
}): Promise<void> {
  const mittente = process.env.SMTP_FROM ?? "no-reply@localhost";
  await ottieniTrasporto().sendMail({
    from: mittente,
    to: messaggio.a,
    subject: messaggio.oggetto,
    text: messaggio.testo,
    html: messaggio.html ?? undefined,
  });
}
