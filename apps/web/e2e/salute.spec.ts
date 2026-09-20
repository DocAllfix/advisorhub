import { expect, test } from "@playwright/test";

/**
 * La sonda di salute è il contratto su cui si appoggiano Uptime Kuma,
 * l'healthcheck di Docker e lo smoke-test del provisioning. Se cambia forma,
 * tutto il monitoraggio smette di funzionare in silenzio.
 *
 * Il caso «database fermo → 503» non si prova qui: richiede di spegnere un
 * container, quindi vive in `deploy/prova-salute.sh`.
 */
test("la sonda di salute risponde 200 con il database raggiungibile", async ({ request }) => {
  const r = await request.get("/api/health");

  expect(r.status()).toBe(200);
  expect(r.headers()["cache-control"]).toContain("no-store");

  const corpo = await r.json();
  expect(corpo.status).toBe("ok");
  expect(corpo.db).toBe("up");
  // La release serve ad attribuire un errore a una versione precisa.
  expect(corpo.version).toBeTruthy();
  expect(typeof corpo.ora).toBe("string");
});

test("le intestazioni di sicurezza sono presenti su una pagina pubblica", async ({ request }) => {
  const r = await request.get("/login");
  const h = r.headers();

  const csp = h["content-security-policy"];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");

  // La CSP deve portare un NONCE: senza, `script-src` si reggerebbe su
  // 'unsafe-inline' e non proteggerebbe da XSS — cioè dalla sola cosa da cui
  // dovrebbe proteggere.
  expect(csp, "la CSP non contiene un nonce").toMatch(/'nonce-[A-Za-z0-9+/=_-]{16,}'/);
  expect(csp).toContain("'strict-dynamic'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["strict-transport-security"]).toContain("max-age=");
  // Nessuna istanza cliente deve comparire nei motori di ricerca.
  expect(h["x-robots-tag"]).toContain("noindex");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("il nonce della CSP cambia a ogni richiesta", async ({ request }) => {
  const prendi = async () => {
    const r = await request.get("/login");
    return (r.headers()["content-security-policy"] ?? "").match(/'nonce-([^']+)'/)?.[1];
  };

  const primo = await prendi();
  const secondo = await prendi();

  expect(primo).toBeTruthy();
  expect(secondo).toBeTruthy();
  // Un nonce riutilizzato è prevedibile, e un nonce prevedibile non serve a
  // nulla: un'iniezione potrebbe semplicemente includerlo.
  expect(secondo).not.toBe(primo);
});

test("la vetrina dei componenti non è raggiungibile in produzione", async ({ request }) => {
  const r = await request.get("/styleguide");
  expect(r.status()).toBe(404);
});
