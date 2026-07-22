/**
 * Palette del report in esadecimale: @react-pdf/renderer non conosce oklch(),
 * quindi i token del tema scuro dell'app sono convertiti una volta sola qui.
 * Se cambiano i token in globals.css, vanno riportati anche in questa mappa.
 */
export const C = {
  bg: "#1c2026", // oklch(0.17 0.014 250)
  card: "#252a31", // oklch(0.215 0.014 250)
  fg: "#eef0f2", // oklch(0.95 0.006 240)
  fg2: "#b0b6bc", // oklch(0.74 0.012 245)
  muted: "#2e343b", // oklch(0.26 0.014 250)
  border: "#3d444c", // oklch(0.32 0.016 250)
  hairline: "#31373e", // oklch(0.27 0.016 250)
  primary: "#47c5d2", // oklch(0.76 0.11 205)
  primarySoft: "#24414a",
  ok: "#8de9ae", // success-foreground
  okG: "#5ccb89", // success (grafica)
  buono: "#b8dac9", // success-buono-foreground
  buonoG: "#93c7ae", // success-buono
  warn: "#f2d08a", // warning-foreground
  warnG: "#e8bb63", // warning
  bad: "#f5a49e", // danger-foreground
  badG: "#ef7a72", // danger
  bandaSottoSoglia: "#2a3138",
} as const;

export type Tono = "eccellente" | "buono" | "attenzione" | "critico" | "nd";

/** Tinta del testo per tono (contrasto >= 4,5:1 sul fondo del report). */
export const testoTono: Record<Tono, string> = {
  eccellente: C.ok,
  buono: C.buono,
  attenzione: C.warn,
  critico: C.bad,
  nd: C.fg2,
};

/** Tinta grafica per tono (barre, segni: contrasto >= 3:1). */
export const graficaTono: Record<Tono, string> = {
  eccellente: C.okG,
  buono: C.buonoG,
  attenzione: C.warnG,
  critico: C.badG,
  nd: C.fg2,
};
