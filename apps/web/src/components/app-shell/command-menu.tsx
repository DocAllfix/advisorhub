"use client";

import { LayoutDashboard, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Command palette (Ctrl/Cmd-K). In Fase 5 è il guscio: naviga tra le sezioni.
 * La ricerca dei clienti si aggancia in Fase 6 (gruppo "Clienti").
 */
export function CommandMenu({
  aperto,
  onCambioApertura,
}: {
  aperto: boolean;
  onCambioApertura: (v: boolean) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onCambioApertura(!aperto);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aperto, onCambioApertura]);

  function vai(href: string) {
    onCambioApertura(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={aperto}
      onOpenChange={onCambioApertura}
      title="Cerca e naviga"
      description="Salta a una sezione o cerca un cliente"
    >
      <Command>
        <CommandInput placeholder="Cerca un cliente o una sezione…" />
        <CommandList>
          <CommandEmpty>Nessun risultato.</CommandEmpty>
          <CommandGroup heading="Vai a">
            <CommandItem onSelect={() => vai("/app")}>
              <LayoutDashboard className="size-4" />
              Panoramica
            </CommandItem>
            <CommandItem onSelect={() => vai("/app/clienti")}>
              <Users className="size-4" />
              Clienti
            </CommandItem>
            <CommandItem onSelect={() => vai("/app/impostazioni")}>
              <Settings className="size-4" />
              Impostazioni studio
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
