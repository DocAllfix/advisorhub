import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "advisorhub",
  description: "Analisi economico-finanziaria per studi professionali",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", plexSans.variable, plexMono.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <TemaProvider>{children}</TemaProvider>
      </body>
    </html>
  );
}
