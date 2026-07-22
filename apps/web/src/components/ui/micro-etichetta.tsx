import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Etichetta di servizio in maiuscoletto spaziato: nomina un dato senza rubargli
 * la scena. Sostituisce le intestazioni incassettate dell'impianto precedente.
 */
function MicroEtichetta({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="micro-etichetta"
      className={cn(
        "text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export { MicroEtichetta };
