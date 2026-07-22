"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Passa tra scuro e chiaro. Per non provocare disallineamenti di idratazione
 * (il tema reale si conosce solo nel browser) renderizziamo entrambe le icone
 * e le etichette, alternandole via CSS con la classe `dark` sull'html: l'HTML
 * del server e del client è identico, cambia solo cosa è visibile.
 */
export function SelettoreTema({ compatto = false }: { compatto?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={compatto ? "icon" : "sm"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Cambia tema chiaro/scuro"
      title="Cambia tema"
      className={compatto ? "size-9" : "w-full justify-start gap-3 px-2.5"}
    >
      {/* In scuro mostra il sole (per andare al chiaro); in chiaro la luna */}
      <Sun className="hidden size-4.5 shrink-0 dark:block" aria-hidden />
      <Moon className="size-4.5 shrink-0 dark:hidden" aria-hidden />
      {!compatto && (
        <>
          <span className="hidden dark:inline">Tema chiaro</span>
          <span className="dark:hidden">Tema scuro</span>
        </>
      )}
    </Button>
  );
}
