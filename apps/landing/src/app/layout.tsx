import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { Comparse } from "@/components/comparse";
import { HERO } from "@/lib/contenuti";
import { IN_PRODUZIONE, NOME, SITO } from "@/lib/indirizzo";

import "./globals.css";

/*
 * NIENTE `dynamic = "force-dynamic"` qui, e niente `headers()` o `cookies()` in
 * nessun componente: la landing è statica per costruzione (GUASTI G-28 spiega
 * perché l'app invece deve essere dinamica). `scripts/verifica-statica.mjs`
 * controlla dopo il build che ogni pagina sia pre-renderizzata.
 */

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  // Solo cifre e brevi etichette: non serve prima del testo.
  preload: false,
});

const DESCRIZIONE =
  "Analisi di bilancio e allerta crisi per commercialisti: indicatori con soglie CCII, DSCR prospettico a 6 mesi e il report da consegnare a cliente e banca.";

export const metadata: Metadata = {
  metadataBase: new URL(SITO),
  title: {
    default: `${NOME} · Analisi di bilancio e allerta crisi per commercialisti`,
    template: `%s · ${NOME}`,
  },
  description: DESCRIZIONE,
  applicationName: NOME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: NOME,
    url: "/",
    title: `${NOME} · ${HERO.titolo}`,
    description: DESCRIZIONE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${NOME} · ${HERO.titolo}`,
    description: DESCRIZIONE,
  },
  // Solo la produzione è indicizzabile; anteprime e sviluppo mai.
  robots: IN_PRODUZIONE
    ? { index: true, follow: true, googleBot: { "max-image-preview": "large" } }
    : { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#f8fafd",
  colorScheme: "light",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning SOLO su <html>, e solo per la classe `js` che lo
    // script qui sotto aggiunge prima dell'idratazione. Vale per questo elemento
    // e non si eredita dai figli: le mancate corrispondenze vere restano visibili.
    <html
      lang="it"
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
         * Una riga sola, prima del primo disegno: dice al CSS che il
         * JavaScript c'è, e solo allora le comparse partono nascoste. Senza,
         * tutto è visibile da subito.
         */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body>
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[var(--radius-pulsante)] focus:bg-superficie focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Vai al contenuto
        </a>
        {children}
        <Comparse />
      </body>
    </html>
  );
}
