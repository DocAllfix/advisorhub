import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { TemaProvider } from "@/components/tema-provider";

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/**
 * Resa dinamica per TUTTE le pagine.
 *
 * La Content-Security-Policy usa un nonce diverso a ogni richiesta (middleware.ts),
 * e una pagina pre-renderizzata a build time non puo' contenerlo: l'HTML e' gia'
 * scritto quando il nonce non esiste ancora. Il browser, vedendo un nonce nella
 * politica, IGNORA 'unsafe-inline' — e gli script della pagina statica, che nonce
 * non ne hanno, vengono bloccati. La pagina arriva e resta ferma a meta'.
 *
 * Il prezzo e' la resa statica di cinque pagine (accesso, registrazione, recupero,
 * reimpostazione, radice): su un'istanza dedicata a un singolo studio, con decine
 * di utenti, non si misura. Tutte le pagine sotto /app erano gia' dinamiche,
 * perche' passano da requireStudio() che legge gli header.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "advisorhub",
  description: "Analisi economico-finanziaria per studi professionali",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lo stesso nonce che il middleware ha messo nella CSP di questa richiesta.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", plexSans.variable, plexMono.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <TemaProvider nonce={nonce}>{children}</TemaProvider>
      </body>
    </html>
  );
}
