"use client";

import { Building2, ChevronsUpDown, LogOut, Settings } from "lucide-react";
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

function voceAttiva(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function ContenutoSidebar({
  studio,
  utente,
  onNaviga,
}: {
  studio: DatiStudio;
  utente: DatiUtente;
  onNaviga?: () => void;
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
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{studio.nome}</span>
            <span className="block truncate text-xs text-muted-foreground">Studio</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/app/impostazioni">
              <Settings className="size-4" />
              Impostazioni studio
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={esci}>
            <LogOut className="size-4" />
            Esci
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
                className="flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground/60"
              >
                <voce.icon className="size-4.5 shrink-0" />
                <span className="flex-1">{voce.label}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                  presto
                </span>
              </span>
            );
          }
          return (
            <Link
              key={voce.href}
              href={voce.href}
              onClick={onNaviga}
              aria-current={attiva ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                attiva
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70 hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <voce.icon className="size-4.5 shrink-0" />
              {voce.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {utente.nome.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{utente.nome}</span>
          <span className="block truncate text-xs text-muted-foreground">{utente.email}</span>
        </span>
      </div>
    </div>
  );
}

export function Sidebar({
  studio,
  utente,
  drawerAperto,
  onChiudiDrawer,
}: {
  studio: DatiStudio;
  utente: DatiUtente;
  drawerAperto: boolean;
  onChiudiDrawer: () => void;
}) {
  return (
    <>
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <ContenutoSidebar studio={studio} utente={utente} />
        </div>
      </aside>

      <Sheet open={drawerAperto} onOpenChange={(v) => !v && onChiudiDrawer()}>
        <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu di navigazione</SheetTitle>
          </SheetHeader>
          <ContenutoSidebar studio={studio} utente={utente} onNaviga={onChiudiDrawer} />
        </SheetContent>
      </Sheet>
    </>
  );
}
