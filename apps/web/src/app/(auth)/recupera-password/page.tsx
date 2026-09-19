"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function RecuperaPasswordPage() {
  const [email, setEmail] = useState("");
  const [inviata, setInviata] = useState(false);
  const [inCorso, setInCorso] = useState(false);

  async function richiedi(e: React.FormEvent) {
    e.preventDefault();
    setInCorso(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reimposta-password",
    });
    setInCorso(false);
    // Conferma SEMPRE identica, esista o no l'account: altrimenti questo form
    // diventa un modo per scoprire chi è registrato.
    setInviata(true);
  }

  if (inviata) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Controlla la posta</h1>
        <p className="mt-2.5 text-base text-muted-foreground">
          Se <span className="font-medium text-foreground">{email}</span> corrisponde a un accesso
          esistente, riceverai un messaggio con il link per reimpostare la password. È valido per
          un&apos;ora.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Non è arrivato nulla? Controlla lo spam, poi{" "}
          <button
            type="button"
            onClick={() => setInviata(false)}
            className="font-medium text-primary hover:underline"
          >
            riprova
          </button>
          .
        </p>
        <p className="mt-7 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Torna all&apos;accesso
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Recupera l&apos;accesso</h1>
      <p className="mt-2.5 text-base text-muted-foreground">
        Inserisci la tua email: ti inviamo un link per impostare una nuova password.
      </p>
      <form onSubmit={richiedi} className="mt-8 grid gap-5" noValidate>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={inCorso || !email}>
          {inCorso ? "Invio in corso…" : "Invia il link"}
        </Button>
      </form>
      <p className="mt-7 text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Torna all&apos;accesso
        </Link>
      </p>
    </div>
  );
}
