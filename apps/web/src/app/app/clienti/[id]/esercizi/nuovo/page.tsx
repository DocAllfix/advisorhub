import { notFound } from "next/navigation";

import { EsercizioForm } from "@/app/app/clienti/esercizio-form";
import { getCliente } from "@/lib/clienti/queries";

export default async function NuovoEsercizioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  return (
    <div>
      <header>
        <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
          {cliente.ragioneSociale}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Nuovo esercizio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inserisci i dati di bilancio, oppure importa un CSV. Il DSCR prospettico è opzionale.
        </p>
      </header>
      <div className="mt-8">
        <EsercizioForm clienteId={cliente.id} ragioneSociale={cliente.ragioneSociale} />
      </div>
    </div>
  );
}
