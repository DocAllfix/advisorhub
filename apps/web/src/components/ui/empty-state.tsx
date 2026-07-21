import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Stato vuoto che insegna l'interfaccia: icona, cosa manca, cosa fare.
 * Non "niente qui", ma un invito all'azione.
 */
export function EmptyState({
  icon: Icon,
  titolo,
  descrizione,
  azione,
  className,
}: {
  icon: LucideIcon;
  titolo: string;
  descrizione: string;
  azione?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold">{titolo}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{descrizione}</p>
      {azione && <div className="mt-5">{azione}</div>}
    </div>
  );
}
