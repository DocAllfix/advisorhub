import { expect, test } from "@playwright/test";

import { creaStudio, emailUnica, intestazioni } from "./aiuto";
import { BASE_CHIUSA } from "../playwright.config";

/**
 * In produzione la registrazione pubblica è chiusa: gli studi si creano col
 * provisioning. Ma «chiusa» non può voler dire «chiusa a tutti», perché
 * accettare un invito passa dallo stesso endpoint di registrazione.
 *
 * Questo test esiste per un difetto reale trovato il 18 settembre 2026
 * (GUASTI G-25): con `disableSignUp` di Better Auth il titolare creava
 * l'invito, la mail partiva, il collaboratore cliccava — e riceveva
 * `400 EMAIL_PASSWORD_SIGN_UP_DISABLED`. Invitare qualcuno era impossibile su
 * ogni istanza consegnata, e la suite non se ne accorgeva perché il server di
 * prova aveva la registrazione aperta.
 *
 * Gira quindi contro un SECONDO server con la registrazione chiusa, sullo
 * stesso database: è l'unico modo di provare il comportamento di produzione.
 */
test("a istanza chiusa entra chi è invitato, non un estraneo", async ({ context, baseURL }) => {
  const request = context.request;
  const base = baseURL!;

  // Lo studio e l'invito si creano sul server aperto: stesso database.
  const studio = await creaStudio(request, base, "chiusa");
  const invitato = emailUnica("invitato");
  const estraneo = emailUnica("estraneo");

  const invito = await request.post("/api/auth/organization/invite-member", {
    headers: intestazioni(base),
    data: { email: invitato, role: "member" },
  });
  expect(invito.ok(), `invito non creato: ${await invito.text()}`).toBeTruthy();

  // Da qui in poi si parla col server a registrazione CHIUSA.
  const h = intestazioni(BASE_CHIUSA);

  // Un estraneo non deve entrare.
  const tentativo = await request.post(`${BASE_CHIUSA}/api/auth/sign-up/email`, {
    headers: h,
    data: { name: "Estraneo", email: estraneo, password: "PasswordEstraneo-2026" },
  });
  expect(tentativo.status(), "un estraneo è riuscito a registrarsi").toBe(400);

  // Un invitato sì: è l'unico modo che ha di crearsi l'accesso.
  const accettazione = await request.post(`${BASE_CHIUSA}/api/auth/sign-up/email`, {
    headers: h,
    data: { name: "Collaboratore", email: invitato, password: "PasswordCollaboratore-2026" },
  });
  expect(
    accettazione.status(),
    `un collaboratore invitato non è riuscito a registrarsi: ${await accettazione.text()}`,
  ).toBe(200);

  // Il titolare continua ad accedere: il cancello non tocca chi c'è già.
  const accesso = await request.post(`${BASE_CHIUSA}/api/auth/sign-in/email`, {
    headers: h,
    data: { email: studio.email, password: studio.password },
  });
  expect(accesso.status()).toBe(200);
});

test("l'istanza chiusa è sana quanto quella aperta", async ({ context }) => {
  const r = await context.request.get(`${BASE_CHIUSA}/api/health`);
  expect(r.status()).toBe(200);
  expect((await r.json()).db).toBe("up");
});
