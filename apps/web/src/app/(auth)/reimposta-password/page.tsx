"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const LUNGHEZZA_MINIMA = 10;

function ReimpostaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  // Better Auth rimanda qui con ?error=INVALID_TOKEN quando il link è scaduto
  // o già usato: va detto subito, non dopo aver compilato il form.
  const tokenNonValido = !token || searchParams.get("error");

  async function reimposta(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    if (password !== conferma) {
      setErrore("Le due password non coincidono.");
      return;
    }
    if (password.length < LUNGHEZZA_MINIMA) {
      setErrore(`La password deve avere almeno ${LUNGHEZZA_MINIMA} caratteri.`);
      return;
    }
    setInCorso(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    setInCorso(false);
    if (error) {
      setErrore(
        error.message ?? "Non è stato possibile reimpostare la password. Richiedi un nuovo link.",
      );
      return;
    }
    router.push("/login?reimpostata=1");
  }

  if (tokenNonValido) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Link non più valido</h1>
        <p className="mt-2.5 text-base text-muted-foreground">
          Il link di reimpostazione è scaduto o è già stato usato. Richiedine uno nuovo: vale
          un&apos;ora.
        </p>
        <p className="mt-7 text-sm text-muted-foreground">
          <Link href="/recupera-password" className="font-medium text-primary hover:underline">
            Richiedi un nuovo link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Nuova password</h1>
      <p className="mt-2.5 text-base text-muted-foreground">
        Scegli una password di almeno {LUNGHEZZA_MINIMA} caratteri.
      </p>
      <form onSubmit={reimposta} className="mt-8 grid gap-5" noValidate>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Nuova password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="conferma">Conferma password</Label>
          <Input
            id="conferma"
            type="password"
            autoComplete="new-password"
            required
            value={conferma}
            onChange={(e) => setConferma(e.target.value)}
          />
        </div>
        {errore && (
          <p role="alert" className="text-sm text-danger-foreground">
            {errore}
          </p>
        )}
        <Button type="submit" disabled={inCorso || !password || !conferma}>
          {inCorso ? "Salvataggio…" : "Salva la nuova password"}
        </Button>
      </form>
    </div>
  );
}

export default function ReimpostaPasswordPage() {
  return (
    <Suspense>
      <ReimpostaForm />
    </Suspense>
  );
}
