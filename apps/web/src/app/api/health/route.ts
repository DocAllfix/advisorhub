import { NextResponse } from "next/server";

import { databaseRaggiungibile } from "@/lib/db";

// I font e il pool pg richiedono Node, e la salute non va mai memorizzata.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sonda di salute profonda: verifica anche il database, così un monitor esterno
 * si accorge che l'istanza è inutilizzabile anche quando il web server risponde.
 *
 * Pubblica e senza autenticazione (è il probe): non espone nulla oltre allo
 * stato e alla release.
 */
export async function GET() {
  const db = await databaseRaggiungibile();
  const corpo = {
    status: db ? "ok" : "degraded",
    db: db ? "up" : "down",
    version: process.env.GIT_SHA ?? "sviluppo",
    ora: new Date().toISOString(),
  };
  return NextResponse.json(corpo, {
    status: db ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
