import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge di giudizio KPI (DESIGN.md): pallino + etichetta testuale, bordo pieno 1px.
 * Il colore non è mai l'unico canale: l'etichetta è obbligatoria.
 */
const judgmentBadgeVariants = cva(
  "nums inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        eccellente: "border-primary/30 bg-accent text-accent-foreground",
        buono: "border-success/30 bg-success-subtle text-success-foreground",
        attenzione: "border-warning/40 bg-warning-subtle text-warning-foreground",
        critico: "border-danger/30 bg-danger-subtle text-danger-foreground",
        nd: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "nd",
    },
  },
);

const dotByTone: Record<string, string> = {
  eccellente: "bg-primary",
  buono: "bg-success",
  attenzione: "bg-warning",
  critico: "bg-danger",
  nd: "bg-muted-foreground",
};

export type JudgmentTone = NonNullable<VariantProps<typeof judgmentBadgeVariants>["tone"]>;

function JudgmentBadge({
  className,
  tone = "nd",
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof judgmentBadgeVariants>) {
  return (
    <span
      data-slot="judgment-badge"
      className={cn(judgmentBadgeVariants({ tone }), className)}
      {...props}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dotByTone[tone ?? "nd"])} />
      {children}
    </span>
  );
}

export { JudgmentBadge, judgmentBadgeVariants };
