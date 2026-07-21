"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  async function accedi(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setInCorso(true);
    const { error } = await authClient.signIn.email({ email, password });
    setInCorso(false);
    if (error) {
      setErrore(
        error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "Email o password non corretti."
          : (error.message ?? "Accesso non riuscito, riprova."),
      );
      return;
    }
    router.push(searchParams.get("da") ?? "/app");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Accedi</h1>
      <p className="mt-1 text-sm text-muted-foreground">Lo spazio di lavoro del tuo studio.</p>
      <form onSubmit={accedi} className="mt-6 grid gap-4" noValidate>
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
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {errore && (
          <p role="alert" className="text-sm text-danger-foreground">
            {errore}
          </p>
        )}
        <Button type="submit" disabled={inCorso || !email || !password}>
          {inCorso ? "Accesso in corso…" : "Accedi"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Nuovo studio?{" "}
        <Link href="/registrazione" className="font-medium text-primary hover:underline">
          Registralo
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
