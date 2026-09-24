import { defineConfig } from "vitest/config";

/**
 * Solo i test unitari in `src/`. Senza questo limite Vitest raccoglierebbe
 * anche `e2e/*.spec.ts`, che sono di Playwright e girano contro il server.
 */
export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
});
