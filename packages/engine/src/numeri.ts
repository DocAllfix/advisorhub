/**
 * Parsing e formattazione numeri in convenzione italiana.
 * Porting del parser del prototipo (funzione `Ze`) con una correzione:
 * l'originale interpretava "550.000" come 550 e "1.234.567" come non valido;
 * qui i punti sono riconosciuti come separatori di migliaia quando coerenti.
 */

/**
 * Converte una stringa in numero accettando formati italiani e anglosassoni:
 * "1.234,56" → 1234.56, "1,5" → 1.5, "1234.56" → 1234.56, "€ 550.000" → 550000.
 * Rimuove €, %, spazi, apostrofi. Ritorna null se non interpretabile.
 */
export function parseNumeroIt(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;
  s = s.replace(/[€%\s]/g, "").replace(/ /g, "");
  s = s.replace(/'/g, "");
  if (!s) return null;
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  } else if (s.includes(".")) {
    const parti = s.split(".");
    const intera = parti[0]!.replace("-", "");
    if (parti.length > 2) {
      // "1.234.567" → separatori di migliaia
      s = s.replace(/\./g, "");
    } else if (parti[1]!.length === 3 && intera !== "" && intera !== "0") {
      // "550.000" / "-120.000" → migliaia; "0.500" e "1234.56" restano decimali
      s = s.replace(/\./g, "");
    }
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/** Formatta un importo in euro senza decimali, convenzione it-IT. */
export function formatEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valore);
}

/** Formatta un numero con un numero fisso di decimali, convenzione it-IT. "—" se non finito. */
export function formatNumero(valore: number, decimali = 2): string {
  if (!Number.isFinite(valore)) return "—";
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: decimali,
    maximumFractionDigits: decimali,
  }).format(valore);
}
