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
  matcher: ["/app/:path*", "/stampa/:path*"],
};
