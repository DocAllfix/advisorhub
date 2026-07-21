"use client";

import { ThemeProvider } from "next-themes";

/** Tema scuro come base, chiaro disponibile dal selettore. */
export function TemaProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
