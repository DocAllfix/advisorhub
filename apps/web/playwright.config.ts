import { defineConfig } from "@playwright/test";

/**
 * Test end-to-end contro la BUILD DI PRODUZIONE, non contro `next dev`.
 *
 * Il server è quello standalone (`.next/standalone/.../server.js`), cioè lo stesso
 * artefatto che finisce nell'immagine: è l'unico modo per accorgersi dei difetti
 * che vivono solo lì — per esempio il percorso dei font del PDF, che in sviluppo
 * funziona e in produzione no (GUASTI G-09).
 *
 * `next start` non è utilizzabile con `output: "standalone"`: parte, dice Ready e
 * risponde 500 a tutto (GUASTI G-06).
 *
 * Prerequisito: database e Mailpit attivi.
 *   docker compose -f ../../deploy/docker-compose.dev.yml up -d
 */
const PORTA = Number(process.env.E2E_PORT ?? 3100);
const BASE = `http://127.0.0.1:${PORTA}`;
// Secondo server, stesso database, con la registrazione CHIUSA come in
// produzione: serve a provare che un estraneo non entri e che un invitato si.
const PORTA_CHIUSA = PORTA + 1;
export const BASE_CHIUSA = `http://127.0.0.1:${PORTA_CHIUSA}`;
const SEGRETO = "e2e-".padEnd(48, "0");
const DB =
  process.env.E2E_DATABASE_URL ?? "postgresql://advisorhub:sviluppo@127.0.0.1:5433/advisorhub";

export default defineConfig({
  testDir: "./e2e",
  // Il worker della posta gira per tutta la sessione di test: senza, i
  // messaggi restano in coda e il recupero password non arriva mai.
  globalSetup: "./e2e/avvia-posta.ts",
  globalTeardown: "./e2e/ferma-posta.ts",
  fullyParallel: false, // i test condividono un database: l'ordine conta
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node .next/standalone/apps/web/server.js",
      url: `${BASE}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        NODE_ENV: "production",
        PORT: String(PORTA),
        HOSTNAME: "127.0.0.1",
        DATABASE_URL: DB,
        DIRECT_URL: DB,
        BETTER_AUTH_SECRET: SEGRETO,
        BETTER_AUTH_URL: BASE,
        // La registrazione deve essere aperta: i test creano i propri studi.
        REGISTRAZIONE_APERTA: "true",
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "1025",
        SMTP_FROM: "no-reply@advisorhub.test",
        GIT_SHA: "e2e",
      },
    },
    {
      // Stesso artefatto, stesso database, REGISTRAZIONE_APERTA assente.
      command: "node .next/standalone/apps/web/server.js",
      url: `${BASE_CHIUSA}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        NODE_ENV: "production",
        PORT: String(PORTA_CHIUSA),
        HOSTNAME: "127.0.0.1",
        DATABASE_URL: DB,
        DIRECT_URL: DB,
        // Stesso segreto: le sessioni devono valere su entrambi i server.
        BETTER_AUTH_SECRET: SEGRETO,
        BETTER_AUTH_URL: BASE_CHIUSA,
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "1025",
        SMTP_FROM: "no-reply@advisorhub.test",
        GIT_SHA: "e2e-chiusa",
      },
    },
  ],
});
