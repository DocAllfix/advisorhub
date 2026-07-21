import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const sessione = await auth.api.getSession({ headers: h });
  if (!sessione) redirect("/login");

  const studio = await auth.api.getFullOrganization({ headers: h }).catch(() => null);

  return (
    <AppShell
      studio={{ nome: studio?.name ?? "Il tuo studio" }}
      utente={{ nome: sessione.user.name, email: sessione.user.email }}
    >
      {children}
    </AppShell>
  );
}
