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
  { label: "Scadenze", href: "/app/scadenze", icon: CalendarClock, presto: true },
  { label: "Impostazioni", href: "/app/impostazioni", icon: Settings },
];

/** Etichette per il breadcrumb, per segmento di percorso. */
export const etichetteSegmento: Record<string, string> = {
  app: "Panoramica",
  clienti: "Clienti",
  scadenze: "Scadenze",
  impostazioni: "Impostazioni",
};
