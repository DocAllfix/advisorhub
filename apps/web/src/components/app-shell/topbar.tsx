"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { etichetteSegmento } from "@/lib/navigazione";

type Briciola = { label: string; href: string };

function briciole(pathname: string): Briciola[] {
  const segmenti = pathname.split("/").filter(Boolean); // es. ["app","clienti"]
  const out: Briciola[] = [];
  let acc = "";
  for (const seg of segmenti) {
    acc += `/${seg}`;
    out.push({ label: etichetteSegmento[seg] ?? seg, href: acc });
  }
  return out;
}

export function Topbar({
  onApriDrawer,
  onApriCerca,
}: {
  onApriDrawer: () => void;
  onApriCerca: () => void;
}) {
  const pathname = usePathname();
  const percorso = briciole(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-5 backdrop-blur-sm sm:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onApriDrawer}
        aria-label="Apri il menu"
      >
        <Menu className="size-5" />
      </Button>

      <nav aria-label="Percorso" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {percorso.map((b, i) => {
            const ultimo = i === percorso.length - 1;
            return (
              <Fragment key={b.href}>
                {i > 0 && <li className="text-muted-foreground/50">/</li>}
                <li className="min-w-0">
                  {ultimo ? (
                    <span className="truncate font-medium text-foreground" aria-current="page">
                      {b.label}
                    </span>
                  ) : (
                    <Link
                      href={b.href}
                      className="truncate text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {b.label}
                    </Link>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>

      <button
        type="button"
        onClick={onApriCerca}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Search className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">Cerca cliente</span>
        <kbd
          aria-hidden
          className="ml-1 hidden rounded border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground sm:inline"
        >
          Ctrl K
        </kbd>
      </button>
    </header>
  );
}
