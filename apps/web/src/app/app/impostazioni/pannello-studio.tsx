"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

const etichettaRuolo: Record<string, string> = {
  owner: "Titolare",
  admin: "Amministratore",
  member: "Collaboratore",
};

export function PannelloStudio() {
  const { data: studio, isPending, refetch } = authClient.useActiveOrganization();
  const [emailInvito, setEmailInvito] = useState("");
  const [inCorso, setInCorso] = useState(false);

  // Fallback: sessione senza studio attivo (es. login precedente alla membership)
  useEffect(() => {
    if (isPending || studio) return;
    (async () => {
      const { data: elenco } = await authClient.organization.list();
      const primo = elenco?.[0];
      if (primo) {
        await authClient.organization.setActive({ organizationId: primo.id });
        refetch();
      }
    })();
  }, [isPending, studio, refetch]);

  async function invita(e: React.FormEvent) {
    e.preventDefault();
    setInCorso(true);
    const { error } = await authClient.organization.inviteMember({
      email: emailInvito,
      role: "member",
    });
    setInCorso(false);
    if (error) {
      toast.error(error.message ?? "Invito non riuscito.");
      return;
    }
    setEmailInvito("");
    refetch();
    toast.success("Invito creato: copia il link e invialo al collaboratore.");
  }

  if (isPending || !studio) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const invitiPendenti = (studio.invitations ?? []).filter((i) => i.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Persone dello studio</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {studio.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <JudgmentBadge tone={m.role === "owner" ? "eccellente" : "nd"}>
                {etichettaRuolo[m.role] ?? m.role}
              </JudgmentBadge>
            </li>
          ))}
        </ul>

        <form onSubmit={invita} className="mt-5 grid gap-3 border-t border-border pt-5">
          <div className="grid gap-1.5">
            <Label htmlFor="invito-email">Invita un collaboratore</Label>
            <div className="flex gap-2">
              <Input
                id="invito-email"
                type="email"
                placeholder="collaboratore@studio.it"
                value={emailInvito}
                onChange={(e) => setEmailInvito(e.target.value)}
              />
              <Button type="submit" disabled={inCorso || !emailInvito}>
                {inCorso ? "Invio…" : "Invita"}
              </Button>
            </div>
          </div>
        </form>

        {invitiPendenti.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
              Inviti in attesa
            </p>
            <ul className="mt-2 space-y-2">
              {invitiPendenti.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{i.email}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invito/${i.id}`);
                      toast.success("Link di invito copiato.");
                    }}
                  >
                    Copia link
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
