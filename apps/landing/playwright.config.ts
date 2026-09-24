import { defineConfig } from "@playwright/test";

import { PORTA_SMTP } from "./e2e/smtp-finto";

/**
 * End-to-end della landing contro la BUILD DI PRODUZIONE (`next start`), come
 * per l'app: è l'artefatto che si spedisce. Prerequisito: `pnpm build`.
 *
 * Il modulo spedisce davvero, via SMTP, a un ricevitore finto avviato dai test
 * (`e2e/smtp-finto.ts`): niente Docker, niente posta vera.
 */
const PORTA = Number(process.env.E2E_PORT ?? 3210);
export const BASE = `http://127.0.0.1:${PORTA}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/preparazione.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: { baseURL: BASE, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: {
    command: `pnpm exec next start -p ${PORTA}`,
    url: BASE,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      DEMO_ATTIVO: "true",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: String(PORTA_SMTP),
      SMTP_FROM: "no-reply@finbeacon.test",
      DEMO_DESTINATARIO: "commerciale@finbeacon.test",
    },
  },
});
