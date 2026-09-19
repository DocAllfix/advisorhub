import { expect, type APIRequestContext } from "@playwright/test";

/**
 * Utilità condivise dai test end-to-end.
 *
 * Nota su `Origin`: Better Auth rifiuta con 403 `MISSING_OR_NULL_ORIGIN` ogni
 * richiesta che modifica stato senza quell'header. Un browser lo manda sempre,
 * un client API no — quindi va aggiunto a mano (GUASTI G-08). Non si allarga
 * `trustedOrigins` per farlo sparire.
 */
export const MAILPIT = process.env.E2E_MAILPIT ?? "http://127.0.0.1:8025";

export function intestazioni(baseURL: string) {
  return { "Content-Type": "application/json", Origin: baseURL };
}

/** Email irripetibile: i test condividono un database e non devono collidere. */
export function emailUnica(prefisso: string): string {
  return `${prefisso}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@advisorhub.test`;
}

export type Studio = {
  email: string;
  password: string;
  nomeStudio: string;
  slug: string;
  id: string;
};

/**
 * Crea un utente e il suo studio, e lascia il contesto autenticato.
 *
 * La sessione nasce al momento della registrazione, quindi PRIMA che lo studio
 * esista: l'hook `session.create.before` non ha nulla da agganciare e
 * `activeOrganizationId` resta nullo. Si rimedia con `set-active`, non con un
 * secondo accesso — che consumerebbe il limitatore di `/sign-in/email`
 * (5 al minuto) e farebbe fallire la suite con 429 su un comportamento corretto.
 */
export async function creaStudio(
  request: APIRequestContext,
  baseURL: string,
  prefisso: string,
): Promise<Studio> {
  const email = emailUnica(prefisso);
  const password = "ProvaE2E-Password-2026";
  const slug = `${prefisso}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
  const nomeStudio = `Studio ${prefisso}`;
  const h = intestazioni(baseURL);

  const reg = await request.post("/api/auth/sign-up/email", {
    headers: h,
    data: { name: nomeStudio, email, password },
  });
  expect(reg.ok(), `registrazione: HTTP ${reg.status()} ${await reg.text()}`).toBeTruthy();

  const org = await request.post("/api/auth/organization/create", {
    headers: h,
    data: { name: nomeStudio, slug },
  });
  expect(org.ok(), `creazione studio: HTTP ${org.status()} ${await org.text()}`).toBeTruthy();

  const idStudio = ((await org.json()) as { id: string }).id;
  const attiva = await request.post("/api/auth/organization/set-active", {
    headers: h,
    data: { organizationId: idStudio },
  });
  expect(attiva.ok(), `studio non attivato: HTTP ${attiva.status()}`).toBeTruthy();

  return { email, password, nomeStudio, slug, id: idStudio };
}

export async function accedi(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string,
) {
  const r = await request.post("/api/auth/sign-in/email", {
    headers: intestazioni(baseURL),
    data: { email, password },
  });
  expect(r.status(), `accesso fallito per ${email}`).toBe(200);
  return r;
}

type MessaggioMailpit = { ID: string; Subject: string; To: { Address: string }[] };

/** Attende che a `destinatario` arrivi una mail il cui oggetto contiene `frammento`. */
export async function attendiMail(
  request: APIRequestContext,
  destinatario: string,
  frammento: string,
  timeoutMs = 30_000,
): Promise<{ id: string; testo: string }> {
  const scadenza = Date.now() + timeoutMs;
  while (Date.now() < scadenza) {
    const r = await request.get(`${MAILPIT}/api/v1/messages?limit=100`);
    if (r.ok()) {
      const corpo = (await r.json()) as { messages?: MessaggioMailpit[] };
      const trovato = (corpo.messages ?? []).find(
        (m) =>
          m.Subject.includes(frammento) &&
          m.To.some((t) => t.Address.toLowerCase() === destinatario.toLowerCase()),
      );
      if (trovato) {
        const dettaglio = await request.get(`${MAILPIT}/api/v1/message/${trovato.ID}`);
        const d = (await dettaglio.json()) as { Text?: string };
        return { id: trovato.ID, testo: d.Text ?? "" };
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Nessuna mail "${frammento}" per ${destinatario} entro ${timeoutMs} ms`);
}

/** Primo URL http(s) contenuto nel testo del messaggio. */
export function primoLink(testo: string): string {
  const m = testo.match(/https?:\/\/\S+/);
  if (!m) throw new Error(`Nessun link nel messaggio:\n${testo}`);
  return m[0];
}
