import { CalendarClock, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";

export type VoceNav = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Voce predisposta ma non ancora attiva (sezioni future) */
  presto?: boolean;
};

export const navPrincipale: VoceNav[] = [
  { label: "Panoramica", href: "/app", icon: LayoutDashboard },
  { label: "Clienti", href: "/app/clienti", icon: Users },
  { label: "Scadenze", href: "/app/scadenze", icon: CalendarClock },
  { label: "Impostazioni", href: "/app/impostazioni", icon: Settings },
];

/** Etichette per il breadcrumb, per segmento di percorso. */
export const etichetteSegmento: Record<string, string> = {
  app: "Panoramica",
  clienti: "Clienti",
  scadenze: "Scadenze",
  impostazioni: "Impostazioni",
  esercizi: "Esercizi",
  nuovo: "Nuovo",
  modifica: "Modifica",
  analisi: "Analisi",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isIdentificativo(segmento: string): boolean {
  return UUID.test(segmento);
}

/** Etichetta leggibile per un identificativo, in base al segmento che lo precede. */
export function etichettaIdentificativo(precedente: string | undefined): string {
  if (precedente === "clienti") return "Scheda";
  if (precedente === "esercizi") return "Esercizio";
  return "Dettaglio";
}
