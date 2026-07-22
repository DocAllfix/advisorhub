import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Guardia ottimistica: le route /app richiedono il cookie di sessione.
 * La verifica autorevole (sessione valida + studio attivo) avviene
 * server-side nei layout; qui si evita solo il flash di pagine protette.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("da", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Il report è ora una route API che scarica il PDF: protetta dal tenant
  // scoping di getCliente/listEsercizi, non serve la guardia sul cookie qui.
  matcher: ["/app/:path*"],
};
