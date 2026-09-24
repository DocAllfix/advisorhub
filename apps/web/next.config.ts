import path from "node:path";

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

/**
 * La Content-Security-Policy NON sta qui: la emette `src/middleware.ts`, perche'
 * contiene un nonce diverso a ogni richiesta e una politica statica non puo'
 * contenerlo. Qui restano solo le intestazioni che non cambiano mai.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Attivo solo dietro HTTPS: in locale i browser lo ignorano su http
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Isolano la finestra e le risorse da documenti di altre origini
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Nessuna istanza cliente deve comparire nei motori di ricerca
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Server autosufficiente per l'immagine Docker: .next/standalone contiene già
  // le sole dipendenze necessarie, senza node_modules completo.
  output: "standalone",
  // Monorepo: il tracing deve partire dalla radice, altrimenti @finbeacon/engine
  // (che vive fuori da apps/web ed è TypeScript sorgente) non viene incluso.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

/**
 * Le source map si caricano solo quando ci sono le credenziali (CI). Senza,
 * gli stack trace nel collettore sarebbero minificati e illeggibili — cioè
 * inutili proprio quando servono.
 */
const caricaSourceMap = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT,
);

export default caricaSourceMap
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sentryUrl: process.env.SENTRY_URL,
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
