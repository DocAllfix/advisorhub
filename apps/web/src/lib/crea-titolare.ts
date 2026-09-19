/**
 * Crea il titolare di una nuova istanza e il suo studio.
 *
 *   node apps/web/crea-titolare.js "Studio Rossi" referente@studiorossi.it
 *
 * Gira come container una-tantum durante il provisioning, con
 * REGISTRAZIONE_APERTA=true per quella sola esecuzione: il server pubblico
 * resta sempre chiuso e la registrazione non viene mai aperta verso l'esterno.
 *
 * Nessuna password viene consegnata a mano. L'account nasce con una password
 * casuale che nessuno conosce, e al referente parte una mail per impostarne una
 * propria — la stessa strada del recupero password, quindi collaudata. Se la
 * mail non arriva, il problema si vede subito e non il giorno in cui serve.
 */
import { randomBytes } from "node:crypto";

import { auth } from "./auth";
import { db } from "./db";
import { mailOutbox } from "./schema-dominio";

function esci(messaggio: string): never {
  console.error(`[titolare] ${messaggio}`);
  process.exit(1);
}

async function main() {
  const [nomeStudio, email] = process.argv.slice(2);
  if (!nomeStudio || !email) {
    esci('uso: node crea-titolare.js "<nome studio>" <email referente>');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) esci(`email non valida: ${email}`);

  if (process.env.REGISTRAZIONE_APERTA !== "true") {
    esci(
      "REGISTRAZIONE_APERTA deve valere 'true' per questa sola esecuzione.\n" +
        "          Il server pubblico resta chiuso: e' il container una-tantum ad averla.",
    );
  }

  const provvisoria = randomBytes(24).toString("base64url");
  const slug = nomeStudio
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  console.log(`[titolare] studio: ${nomeStudio} (${slug})`);
  console.log(`[titolare] referente: ${email}`);

  const registrato = await auth.api.signUpEmail({
    body: { name: nomeStudio, email, password: provvisoria },
    asResponse: false,
  });
  if (!registrato?.user?.id) esci("creazione dell'utente non riuscita");

  await auth.api.createOrganization({
    body: { name: nomeStudio, slug, userId: registrato.user.id },
  });
  console.log("[titolare] studio creato");

  // La password se la imposta il referente: la provvisoria non la conosce
  // nessuno e non viene mai scritta da nessuna parte.
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/reimposta-password" },
  });

  const [inCoda] = await db.select({ id: mailOutbox.id }).from(mailOutbox).limit(1);
  console.log(
    inCoda
      ? "[titolare] mail di primo accesso accodata: la spedisce il worker"
      : "[titolare] ATTENZIONE: nessuna mail in coda, controlla la configurazione SMTP",
  );
  console.log("[titolare] fatto");
  process.exit(0);
}

main().catch((errore) => {
  console.error("[titolare] fallito:", errore instanceof Error ? errore.message : errore);
  process.exit(1);
});
