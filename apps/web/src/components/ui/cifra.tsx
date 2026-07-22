import * as React from "react";

import { cn } from "@/lib/utils";

const dimensioni = {
  sm: "text-2xl",
  md: "text-[2rem] leading-none",
  lg: "text-6xl leading-none",
  xl: "text-[5.5rem] leading-[0.9]",
} as const;

/**
 * Numero in evidenza: mono tabellare, con un suffisso opzionale che resta
 * subordinato (il "/100" non deve pesare quanto il punteggio).
 */
function Cifra({
  valore,
  suffisso,
  dimensione = "md",
  className,
  ...props
}: React.ComponentProps<"span"> & {
  valore: React.ReactNode;
  suffisso?: React.ReactNode;
  dimensione?: keyof typeof dimensioni;
}) {
  return (
    <span
      data-slot="cifra"
      className={cn("cifra font-semibold", dimensioni[dimensione], className)}
      {...props}
    >
      {valore}
      {suffisso ? (
        <span className="ml-0.5 text-[0.4em] font-medium text-muted-foreground">{suffisso}</span>
      ) : null}
    </span>
  );
}

export { Cifra };
