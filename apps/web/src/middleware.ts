import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Due compiti, entrambi per richiesta.
 *
 * 1. CONTENT-SECURITY-POLICY CON NONCE. Sta qui e non in next.config.ts perché
 *    il nonce dev'essere diverso a ogni richiesta: una politica statica non può
 *    contenerlo. Prima `script-src` aveva `'unsafe-inline'` anche in produzione,
 *    il che rendeva la CSP inutile proprio contro l'XSS da cui dovrebbe
 *    difendere.
 *
 *    Next legge il nonce dall'intestazione della RICHIESTA e lo applica ai propri
 *    script; `'strict-dynamic'` lascia che quegli script ne carichino altri senza
 *    dover elencare ogni file.
 *
 * 2. GUARDIA OTTIMISTICA su /app: verifica solo la presenza del cookie, per
 *    evitare il lampo di una pagina protetta. La verifica autorevole (sessione
 *    valida e studio attivo) resta server-side nei layout, in requireStudio().
 */
function origineTelemetria(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return "";
  try {
    return " " + new URL(dsn).origin;
  } catch {
    return "";
  }
}

const SVILUPPO = process.env.NODE_ENV === "development";

function politica(nonce: string): string {
  return [
    "default-src 'self'",
    // 'unsafe-inline' resta come ripiego per i browser che non capiscono il
    // nonce: quelli che lo capiscono lo IGNORANO in sua presenza. Non è una
    // contraddizione, è la compatibilità prevista dalla specifica.
    // 'unsafe-eval' solo in sviluppo, per il ricaricamento a caldo.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${SVILUPPO ? " 'unsafe-eval'" : ""}`,
    // Gli stili inline restano necessari: Next e le animazioni li scrivono a
    // runtime sull'attributo style, e lì il nonce non si applica.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${origineTelemetria()}${SVILUPPO ? " ws: http://localhost:*" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = politica(nonce);

  // Guardia su /app soltanto: il resto del sito è pubblico.
  if (request.nextUrl.pathname.startsWith("/app") && !getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("da", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Next ricava il nonce da questa intestazione sulla richiesta: senza, non lo
  // applica ai propri script e la pagina resta ferma a metà idratazione.
  const intestazioni = new Headers(request.headers);
  intestazioni.set("x-nonce", nonce);
  intestazioni.set("Content-Security-Policy", csp);

  const risposta = NextResponse.next({ request: { headers: intestazioni } });
  risposta.headers.set("Content-Security-Policy", csp);
  return risposta;
}

export const config = {
  matcher: [
    /*
     * Tutto tranne gli asset statici, che non hanno bisogno di una CSP e per cui
     * generare un nonce sarebbe solo lavoro sprecato a ogni immagine.
     *
     * `/api/report/*` e `/api/health` passano di qui e prendono le intestazioni;
     * la loro sicurezza però non dipende dal middleware — la route chiama
     * requireStudio() per conto suo.
     */
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
