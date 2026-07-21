"use client";

import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";

import { CommandMenu } from "./command-menu";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export type DatiStudio = { nome: string };
export type DatiUtente = { nome: string; email: string };
export type ClienteRicerca = { id: string; ragioneSociale: string };

export function AppShell({
  studio,
  utente,
  clienti,
  children,
}: {
  studio: DatiStudio;
  utente: DatiUtente;
  clienti: ClienteRicerca[];
  children: React.ReactNode;
}) {
  const [drawerAperto, setDrawerAperto] = useState(false);
  const [cercaAperto, setCercaAperto] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <Sidebar
        studio={studio}
        utente={utente}
        drawerAperto={drawerAperto}
        onChiudiDrawer={() => setDrawerAperto(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-col">
        <Topbar
          onApriDrawer={() => setDrawerAperto(true)}
          onApriCerca={() => setCercaAperto(true)}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
      <CommandMenu aperto={cercaAperto} onCambioApertura={setCercaAperto} clienti={clienti} />
      <Toaster position="bottom-center" />
    </div>
  );
}
