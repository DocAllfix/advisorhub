"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

/** Il tema reale si conosce solo nel browser: finché non siamo idratati
 *  mostriamo l'icona neutra, senza far lampeggiare quella sbagliata. */
const sottoscriviNulla = () => () => {};
function useIdratato() {
  return useSyncExternalStore(
    sottoscriviNulla,
    () => true,
    () => false,
  );
}

export function SelettoreTema({ compatto = false }: { compatto?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const montato = useIdratato();

  const scuro = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size={compatto ? "icon" : "sm"}
      onClick={() => setTheme(scuro ? "light" : "dark")}
      aria-label={scuro ? "Passa al tema chiaro" : "Passa al tema scuro"}
      title={scuro ? "Tema chiaro" : "Tema scuro"}
      className={compatto ? "size-9" : "w-full justify-start gap-3 px-2.5"}
    >
      {montato && scuro ? (
        <Sun className="size-4.5 shrink-0" aria-hidden />
      ) : (
        <Moon className="size-4.5 shrink-0" aria-hidden />
      )}
      {!compatto && <span>{montato && scuro ? "Tema chiaro" : "Tema scuro"}</span>}
    </Button>
  );
}
