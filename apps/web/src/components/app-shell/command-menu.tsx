"use client";

import { Building2, LayoutDashboard, Settings, Users } from "lucide-react";
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

import type { ClienteRicerca } from "./app-shell";

/**
 * Command palette (Ctrl/Cmd-K): naviga tra le sezioni e salta a un cliente.
 */
export function CommandMenu({
  aperto,
  onCambioApertura,
  clienti,
}: {
  aperto: boolean;
  onCambioApertura: (v: boolean) => void;
  clienti: ClienteRicerca[];
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
          {clienti.length > 0 && (
            <CommandGroup heading="Clienti">
              {clienti.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`cliente ${c.ragioneSociale}`}
                  onSelect={() => vai(`/app/clienti/${c.id}`)}
                >
                  <Building2 className="size-4" />
                  {c.ragioneSociale}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
