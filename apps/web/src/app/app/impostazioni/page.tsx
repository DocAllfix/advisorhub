import { PannelloStudio } from "./pannello-studio";

export default function ImpostazioniPage() {
  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Impostazioni studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Persone dello studio e inviti. Le altre impostazioni arrivano con le prossime fasi.
        </p>
      </header>
      <div className="mt-8">
        <PannelloStudio />
      </div>
    </div>
  );
}
