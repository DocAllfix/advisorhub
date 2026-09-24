import { avviaSmtpFinto } from "./smtp-finto";

/** Avvia il ricevitore SMTP per tutta la sessione di test; lo chiude alla fine. */
export default async function preparazione() {
  const { chiudi } = await avviaSmtpFinto();
  return async () => {
    await chiudi();
  };
}
