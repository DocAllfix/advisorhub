import { expect, test } from "@playwright/test";

import { accedi, attendiMail, creaStudio, intestazioni, primoLink } from "./aiuto";

/**
 * NOTA sui cookie. I test autenticati usano `context.request`, cioe' il client
 * API del BROWSER, non il fixture `request` isolato.
 *
 * In produzione Better Auth emette il cookie di sessione con prefisso
 * `__Secure-` e attributo `Secure`, e i test girano contro la build di
 * produzione. Il fixture `request` non conserva un cookie Secure su http e ogni
 * chiamata autenticata risponde 401; un browser invece tratta 127.0.0.1 come
 * origine attendibile e lo conserva, esattamente come farebbe un utente vero su
 * https. Usare il contesto del browser e' quindi la simulazione fedele, non un
 * aggiramento.
 */

/**
 * Il recupero password è il flusso senza il quale un commercialista che
 * dimentica la password resta fuori in modo definitivo: la registrazione
 * pubblica è chiusa in produzione, e l'unico rimedio sarebbe una UPDATE a mano
 * sul suo database. Va verificato fino in fondo, non fino all'invio.
 */
test("recupero password: dalla richiesta al nuovo accesso", async ({ context, baseURL }) => {
  const request = context.request;
  const base = baseURL!;
  const studio = await creaStudio(request, base, "recupero");

  // 1. Richiesta. La risposta è sempre positiva, esista o meno l'account.
  const richiesta = await request.post("/api/auth/request-password-reset", {
    headers: intestazioni(base),
    data: { email: studio.email, redirectTo: "/reimposta-password" },
  });
  expect(richiesta.status()).toBe(200);

  // 2. La mail arriva davvero (il worker drena la coda).
  const mail = await attendiMail(request, studio.email, "Reimposta la tua password");
  const link = primoLink(mail.testo);
  expect(link).toContain("/api/auth/reset-password/");

  // 3. Il link porta alla nostra pagina con il token in query.
  const redirezione = await request.get(link, { maxRedirects: 0 });
  expect(redirezione.status()).toBe(302);
  const destinazione = redirezione.headers()["location"];
  expect(destinazione).toContain("/reimposta-password?token=");

  const token = new URL(destinazione, base).searchParams.get("token");
  expect(token).toBeTruthy();

  // 4. Cambio password.
  const nuova = "NuovaPasswordE2E-2026";
  const reset = await request.post("/api/auth/reset-password", {
    headers: intestazioni(base),
    data: { newPassword: nuova, token },
  });
  expect(reset.status()).toBe(200);

  // 5. La vecchia non vale più, la nuova sì.
  const vecchia = await request.post("/api/auth/sign-in/email", {
    headers: intestazioni(base),
    data: { email: studio.email, password: studio.password },
  });
  expect(vecchia.status()).toBe(401);

  await accedi(request, base, studio.email, nuova);
});

test("il form di recupero non rivela se un indirizzo è registrato", async ({
  context,
  baseURL,
}) => {
  const request = context.request;
  const base = baseURL!;

  // Un indirizzo che non esiste deve dare la stessa risposta di uno che esiste:
  // altrimenti il form diventa un modo per enumerare gli utenti.
  const inesistente = await request.post("/api/auth/request-password-reset", {
    headers: intestazioni(base),
    data: { email: "nessuno-mai-registrato@finbeacon.test", redirectTo: "/reimposta-password" },
  });
  expect(inesistente.status()).toBe(200);
});

test("l'invito a un collaboratore viene recapitato per email", async ({ context, baseURL }) => {
  const request = context.request;
  const base = baseURL!;
  const studio = await creaStudio(request, base, "invito");
  const invitato = `collaboratore-${Date.now()}@finbeacon.test`;

  const invito = await request.post("/api/auth/organization/invite-member", {
    headers: intestazioni(base),
    data: { email: invitato, role: "member" },
  });
  expect(invito.ok(), `invito fallito: ${await invito.text()}`).toBeTruthy();

  // Prima di questa correzione la callback di invio era VUOTA: l'invito veniva
  // creato e il link andava copiato a mano dall'interfaccia.
  const mail = await attendiMail(request, invitato, "Invito a collaborare");
  expect(mail.testo).toContain(studio.nomeStudio);
  expect(primoLink(mail.testo)).toContain("/invito/");
});
