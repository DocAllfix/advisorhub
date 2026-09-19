"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MicroEtichetta } from "@/components/ui/micro-etichetta";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { JudgmentBadge } from "@/components/ui/judgment-badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient, useSession } from "@/lib/auth-client";
import { MESSAGGIO_DEMO } from "@/lib/demo";

const etichettaRuolo: Record<string, string> = {
  owner: "Titolare",
  admin: "Amministratore",
  member: "Collaboratore",
};

export function PannelloStudio({ demo }: { demo: boolean }) {
  const { data: sessione } = useSession();
  const { data: studio, isPending, refetch } = authClient.useActiveOrganization();
  const [emailInvito, setEmailInvito] = useState("");
  const [inCorso, setInCorso] = useState(false);
  // null = non ancora toccato dall'utente: mostra il nome corrente dello studio
  const [nomeModificato, setNomeModificato] = useState<string | null>(null);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const nomeStudio = nomeModificato ?? studio?.name ?? "";

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
    if (demo) return toast.error(MESSAGGIO_DEMO);
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
    toast.success("Invito inviato per email. Il link resta copiabile qui sotto come riserva.");
  }

  async function rinomina(e: React.FormEvent) {
    e.preventDefault();
    if (demo) return toast.error(MESSAGGIO_DEMO);
    if (!studio || !nomeStudio.trim()) return;
    setSalvandoNome(true);
    const { error } = await authClient.organization.update({
      organizationId: studio.id,
      data: { name: nomeStudio.trim() },
    });
    setSalvandoNome(false);
    if (error) {
      toast.error(error.message ?? "Rinomina non riuscita.");
      return;
    }
    setNomeModificato(null);
    refetch();
    toast.success("Nome dello studio aggiornato.");
  }

  async function revocaInvito(invitationId: string) {
    if (demo) return toast.error(MESSAGGIO_DEMO);
    const { error } = await authClient.organization.cancelInvitation({ invitationId });
    if (error) {
      toast.error(error.message ?? "Revoca non riuscita.");
      return;
    }
    refetch();
    toast.success("Invito revocato.");
  }

  async function rimuoviMembro(memberId: string, nome: string) {
    if (demo) return toast.error(MESSAGGIO_DEMO);
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
      organizationId: studio!.id,
    });
    if (error) {
      toast.error(error.message ?? "Rimozione non riuscita.");
      return;
    }
    refetch();
    toast.success(`${nome} rimosso dallo studio.`);
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
  const ruoloMio = studio.members.find((m) => m.userId === sessione?.user.id)?.role;
  const puoGestire = ruoloMio === "owner" || ruoloMio === "admin";

  return (
    <div className="space-y-6">
      {demo && (
        <div
          role="status"
          data-tour="banner-demo"
          className="rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning-foreground"
        >
          <span className="font-semibold">Versione dimostrativa.</span> Rinomina dello studio,
          inviti e gestione delle persone sono disattivati: puoi consultarli, non modificarli.
        </div>
      )}

      {puoGestire && (
        <section>
          <MicroEtichetta come="h2">Nome dello studio</MicroEtichetta>
          <div className="mt-3 border-t border-hairline pt-4">
            <form onSubmit={rinomina} className="flex gap-2">
              <Input
                aria-label="Nome dello studio"
                value={nomeStudio}
                onChange={(e) => setNomeModificato(e.target.value)}
                disabled={demo}
              />
              <Button
                type="submit"
                disabled={
                  demo || salvandoNome || !nomeStudio.trim() || nomeStudio.trim() === studio.name
                }
              >
                {salvandoNome ? "Salvataggio…" : "Salva"}
              </Button>
            </form>
          </div>
        </section>
      )}

      <section>
        <MicroEtichetta come="h2" data-tour="persone-studio">
          Persone dello studio
        </MicroEtichetta>
        <div className="mt-3 border-t border-hairline pt-4">
          <ul className="divide-y divide-hairline">
            {studio.members.map((m) => {
              const sonoIo = m.userId === sessione?.user.id;
              const rimovibile = puoGestire && !sonoIo && m.role !== "owner";
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.user.name}
                      {sonoIo && <span className="ml-2 text-xs text-muted-foreground">(tu)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <JudgmentBadge tone={m.role === "owner" ? "eccellente" : "nd"}>
                      {etichettaRuolo[m.role] ?? m.role}
                    </JudgmentBadge>
                    {rimovibile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label={`Gestisci ${m.user.name}`}>
                            Gestisci
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => rimuoviMembro(m.id, m.user.name)}
                          >
                            Rimuovi dallo studio
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {puoGestire && (
            <form
              onSubmit={invita}
              data-tour="invito"
              className="mt-5 grid gap-3 border-t border-hairline pt-5"
            >
              <div className="grid gap-1.5">
                <Label htmlFor="invito-email">Invita un collaboratore</Label>
                <div className="flex gap-2">
                  <Input
                    id="invito-email"
                    type="email"
                    placeholder="collaboratore@studio.it"
                    value={emailInvito}
                    onChange={(e) => setEmailInvito(e.target.value)}
                    disabled={demo}
                  />
                  <Button type="submit" disabled={demo || inCorso || !emailInvito}>
                    {inCorso ? "Invio…" : "Invita"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {invitiPendenti.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                Inviti in attesa
              </p>
              <ul className="mt-2 space-y-2">
                {invitiPendenti.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{i.email}</span>
                    <div className="flex gap-2">
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
                      {puoGestire && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => revocaInvito(i.id)}
                        >
                          Revoca
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
