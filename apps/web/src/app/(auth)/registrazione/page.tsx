"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function slugDaNome(nome: string): string {
  return (
    nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "studio"
  );
}

/**
 * Creazione di nuovi studi dalla pagina pubblica: chiusa in produzione, dove
 * gli accessi vengono consegnati dallo studio titolare del prodotto. Resta
 * aperta in sviluppo, così i collaudi automatici possono creare studi.
 * L'ingresso su invito (?invito=<id>) non è mai bloccato: serve ai
 * collaboratori degli studi reali.
 */
const registrazioneAperta =
  process.env.NEXT_PUBLIC_REGISTRAZIONE_APERTA === "true" || process.env.NODE_ENV === "development";

function RegistrazioneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Con ?invito=<id> si crea solo l'account (si entrerà nello studio che invita)
  const invitoId = searchParams.get("invito");
  const [studio, setStudio] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  async function registra(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    if (password.length < 10) {
      setErrore("La password deve avere almeno 10 caratteri.");
      return;
    }
    setInCorso(true);
    const { error: errUtente } = await authClient.signUp.email({
      email,
      password,
      name: nome,
    });
    if (errUtente) {
      setInCorso(false);
      setErrore(
        errUtente.code === "USER_ALREADY_EXISTS"
          ? "Esiste già un account con questa email. Accedi."
          : (errUtente.message ?? "Registrazione non riuscita, riprova."),
      );
      return;
    }
    if (invitoId) {
      setInCorso(false);
      router.push(`/invito/${invitoId}`);
      return;
    }
    const slugBase = slugDaNome(studio);
    const { data: nuovoStudio, error: errStudio } = await authClient.organization.create({
      name: studio,
      slug: `${slugBase}-${Date.now().toString(36)}`,
    });
    if (errStudio) {
      setInCorso(false);
      setErrore(errStudio.message ?? "Creazione dello studio non riuscita.");
      return;
    }
    // La sessione è nata prima dello studio: va agganciata esplicitamente
    if (nuovoStudio) {
      await authClient.organization.setActive({ organizationId: nuovoStudio.id });
    }
    setInCorso(false);
    router.push("/app");
  }

  // Nessun invito e registrazione chiusa: si spiega come si ottiene l'accesso
  if (!invitoId && !registrazioneAperta) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Accesso su richiesta</h1>
        <p className="mt-2.5 text-base text-muted-foreground">
          L&apos;apertura di un nuovo studio non avviene da qui: le credenziali vengono consegnate
          direttamente dopo l&apos;attivazione del servizio.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        {invitoId ? "Crea il tuo account" : "Registra il tuo studio"}
      </h1>
      <p className="mt-2.5 text-base text-muted-foreground">
        {invitoId
          ? "Usa l'email a cui è stato inviato l'invito: al termine tornerai ad accettarlo."
          : "Crei lo studio e l'account del titolare in un passaggio."}
      </p>
      <form onSubmit={registra} className="mt-8 grid gap-5" noValidate>
        {!invitoId && (
          <div className="grid gap-1.5">
            <Label htmlFor="studio">Nome dello studio</Label>
            <Input
              id="studio"
              placeholder="Es. Studio Bianchi Commercialisti"
              required
              value={studio}
              onChange={(e) => setStudio(e.target.value)}
            />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="nome">Nome e cognome</Label>
          <Input
            id="nome"
            autoComplete="name"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={10}
            aria-describedby="password-aiuto"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id="password-aiuto" className="text-xs text-muted-foreground">
            Minimo 10 caratteri.
          </p>
        </div>
        {errore && (
          <p role="alert" className="text-sm text-danger-foreground">
            {errore}
          </p>
        )}
        <Button
          type="submit"
          disabled={inCorso || (!invitoId && !studio) || !nome || !email || !password}
        >
          {inCorso ? "Creazione in corso…" : invitoId ? "Crea account" : "Crea studio e account"}
        </Button>
      </form>
      <p className="mt-7 text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
}

export default function RegistrazionePage() {
  return (
    <Suspense>
      <RegistrazioneForm />
    </Suspense>
  );
}
