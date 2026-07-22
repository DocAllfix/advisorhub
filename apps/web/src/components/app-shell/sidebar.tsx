"use client";

import {
  Building2,
  ChevronsUpDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { navPrincipale } from "@/lib/navigazione";
import { cn } from "@/lib/utils";

import type { DatiStudio, DatiUtente } from "./app-shell";
import { SelettoreTema } from "./selettore-tema";

function voceAttiva(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function ContenutoSidebar({
  studio,
  utente,
  ridotta,
  onNaviga,
  onCambiaRidotta,
}: {
  studio: DatiStudio;
  utente: DatiUtente;
  ridotta: boolean;
  onNaviga?: () => void;
  onCambiaRidotta?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function esci() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2.5 rounded-lg py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            ridotta ? "justify-center px-1" : "px-2.5",
          )}
          title={ridotta ? studio.nome : undefined}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
            <Building2 className="size-4" />
          </span>
          {!ridotta && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{studio.nome}</span>
                <span className="block truncate text-xs text-muted-foreground">Studio</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>
        {/* Qui vive solo ciò che riguarda lo studio: le azioni di account
            stanno sotto l'avatar, dove le cerca chiunque. */}
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/app/impostazioni">
              <Settings className="size-4" />
              Impostazioni studio
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="mt-3 flex flex-1 flex-col gap-0.5" aria-label="Navigazione principale">
        {navPrincipale.map((voce) => {
          const attiva = voceAttiva(pathname, voce.href);
          if (voce.presto) {
            return (
              <span
                key={voce.href}
                aria-disabled
                title={ridotta ? `${voce.label} (presto)` : undefined}
                className={cn(
                  "flex cursor-default items-center gap-3 rounded-lg py-2 text-sm text-muted-foreground/60",
                  ridotta ? "justify-center px-1" : "px-2.5",
                )}
              >
                <voce.icon className="size-4.5 shrink-0" />
                {!ridotta && (
                  <>
                    <span className="flex-1">{voce.label}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                      presto
                    </span>
                  </>
                )}
              </span>
            );
          }
          return (
            <Link
              key={voce.href}
              href={voce.href}
              onClick={onNaviga}
              title={ridotta ? voce.label : undefined}
              aria-current={attiva ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                ridotta ? "justify-center px-1" : "px-2.5",
                attiva
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70 hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <voce.icon className="size-4.5 shrink-0" />
              {!ridotta && voce.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 space-y-1 border-t border-sidebar-border pt-2">
        <SelettoreTema compatto={ridotta} />
        {onCambiaRidotta && (
          <button
            type="button"
            onClick={onCambiaRidotta}
            aria-label={ridotta ? "Espandi la barra laterale" : "Riduci la barra laterale"}
            title={ridotta ? "Espandi" : "Riduci"}
            className={cn(
              "hidden w-full items-center gap-3 rounded-lg py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:flex",
              ridotta ? "justify-center px-1" : "px-2.5",
            )}
          >
            {ridotta ? (
              <PanelLeftOpen className="size-4.5 shrink-0" />
            ) : (
              <PanelLeftClose className="size-4.5 shrink-0" />
            )}
            {!ridotta && <span>Riduci</span>}
          </button>
        )}

        {/* Il blocco utente era inerte: si cliccava il proprio nome e non
            accadeva nulla, mentre "Esci" viveva nel menu dello studio. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              ridotta ? "justify-center px-1" : "px-2.5",
            )}
            title={ridotta ? `${utente.nome} · ${utente.email}` : undefined}
            aria-label={`Account di ${utente.nome}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {utente.nome.slice(0, 2).toUpperCase()}
            </span>
            {!ridotta && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{utente.nome}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {utente.email}
                  </span>
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            {/* A sidebar estesa nome ed email sono già sul pulsante: ripeterli
                qui sarebbe solo rumore. */}
            {ridotta && (
              <>
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">{utente.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{utente.email}</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={esci}>
              <LogOut className="size-4" />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar({
  studio,
  utente,
  drawerAperto,
  onChiudiDrawer,
  ridotta,
  onCambiaRidotta,
}: {
  studio: DatiStudio;
  utente: DatiUtente;
  drawerAperto: boolean;
  onChiudiDrawer: () => void;
  ridotta: boolean;
  onCambiaRidotta: () => void;
}) {
  return (
    <>
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <ContenutoSidebar
            studio={studio}
            utente={utente}
            ridotta={ridotta}
            onCambiaRidotta={onCambiaRidotta}
          />
        </div>
      </aside>

      <Sheet open={drawerAperto} onOpenChange={(v) => !v && onChiudiDrawer()}>
        <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu di navigazione</SheetTitle>
          </SheetHeader>
          <ContenutoSidebar
            studio={studio}
            utente={utente}
            ridotta={false}
            onNaviga={onChiudiDrawer}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
