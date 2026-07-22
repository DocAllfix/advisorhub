import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Etichetta di servizio in maiuscoletto spaziato: nomina un dato senza rubargli
 * la scena. Sostituisce le intestazioni incassettate dell'impianto precedente.
 *
 * Quando introduce una sezione va resa con `come="h2"`/`"h3"`: l'aspetto è
 * quello di un'etichetta, ma per un lettore di schermo resta un'intestazione.
 */
function MicroEtichetta({
  come: Tag = "p",
  className,
  children,
  ...props
}: React.ComponentProps<"p"> & { come?: "p" | "h2" | "h3" }) {
  return (
    <Tag
      data-slot="micro-etichetta"
      className={cn(
        "text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export { MicroEtichetta };
