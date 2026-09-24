/**
 * Date di revisione VERE delle pagine legali: si aggiornano a mano quando il
 * testo cambia. La sitemap dichiara `lastModified` solo dove la data è vera.
 */
export const REVISIONI = {
  privacy: "2026-09-24",
  noteLegali: "2026-09-24",
} as const;

export function dataEstesa(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
}
