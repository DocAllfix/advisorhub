"use client";

import { ThemeProvider } from "next-themes";

/**
 * Tema scuro come base, chiaro disponibile dal selettore.
 *
 * Il `nonce` va passato: next-themes inserisce uno script INLINE che applica il
 * tema prima della prima pittura, per evitare il lampo di colore. Senza nonce,
 * la CSP lo blocca — e la pagina parte sempre col tema sbagliato.
 */
export function TemaProvider({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </ThemeProvider>
  );
}
