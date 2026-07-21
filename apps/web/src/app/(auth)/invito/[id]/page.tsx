"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

export default function InvitoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: sessione, isPending } = useSession();
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  async function accetta() {
    setErrore(null);
    setInCorso(true);
    const { data, error } = await authClient.organization.acceptInvitation({
      invitationId: id,
    });
    if (error) {
      setInCorso(false);
      setErrore(
        error.message ??
          "Invito non valido o scaduto. Verifica di aver effettuato l'accesso con l'email invitata.",
      );
      return;
    }
    if (data?.invitation.organizationId) {
      await authClient.organization.setActive({
        organizationId: data.invitation.organizationId,
      });
    }
    setInCorso(false);
    router.push("/app");
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Verifica in corso…</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Invito a uno studio</h1>
      {sessione ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Sei connesso come{" "}
            <span className="font-medium text-foreground">{sessione.user.email}</span>. Accettando
            entrerai nello studio che ti ha invitato.
          </p>
          {errore && (
            <p role="alert" className="mt-4 text-sm text-danger-foreground">
              {errore}
            </p>
          )}
          <Button className="mt-6 w-full" onClick={accetta} disabled={inCorso}>
            {inCorso ? "Accettazione…" : "Accetta l'invito"}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Per accettare l&apos;invito devi prima accedere (o creare un account) con l&apos;email a
            cui è stato inviato.
          </p>
          <div className="mt-6 grid gap-3">
            <Button asChild>
              <Link href={`/login?da=/invito/${id}`}>Accedi</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/registrazione?invito=${id}`}>Crea un account</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
