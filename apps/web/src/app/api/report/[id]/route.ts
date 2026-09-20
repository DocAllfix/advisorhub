import { analizza } from "@advisorhub/engine";
import { renderToBuffer } from "@react-pdf/renderer";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { requireStudio } from "@/lib/auth-helpers";
import { datiDa, previsionaleDa } from "@/lib/analisi/da-esercizio";
import { getCliente } from "@/lib/clienti/queries";
import { etichettaDimensione } from "@/lib/clienti/schema";
import { listEsercizi } from "@/lib/esercizi/queries";
import { DocumentoReport } from "@/lib/report/documento";
import { segnalaErrore } from "@/lib/telemetria";

// I font si leggono dal disco: serve il runtime Node, non l'edge
export const runtime = "nodejs";

/** Nome file leggibile e sicuro: "Analisi_Mario_Rossi_Spa_2026.pdf" */
function nomeFile(ragioneSociale: string, anno: number) {
  const base = ragioneSociale
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return `Analisi_${base || "cliente"}_${anno}.pdf`;
}

/**
 * Genera il report in PDF e lo restituisce come allegato: il browser lo
 * scarica senza aprire pagine intermedie.
 *
 * requireStudio() e' chiamata esplicitamente anche se getCliente/listEsercizi
 * la invocano gia': la sicurezza di questa route non deve dipendere da cosa
 * fanno internamente le query che usa. E' memoizzata per richiesta, quindi non
 * costa nulla.
 */
export async function GET(richiesta: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStudio();

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return new NextResponse("Cliente non trovato.", { status: 404 });
  }
  const esercizioParam = new URL(richiesta.url).searchParams.get("esercizio");

  const cliente = await getCliente(id);
  if (!cliente) return new NextResponse("Cliente non trovato.", { status: 404 });

  const esercizi = await listEsercizi(id);
  if (esercizi.length === 0) {
    return new NextResponse("Nessun esercizio da analizzare.", { status: 404 });
  }

  const e = esercizi.find((x) => x.id === esercizioParam) ?? esercizi[0]!;
  const dati = datiDa(e);
  const analisi = analizza(dati, previsionaleDa(e) ?? undefined);

  const studio = await auth.api.getFullOrganization({ headers: await headers() }).catch(() => null);

  let pdf: Buffer;
  try {
    pdf = (await renderToBuffer(
      DocumentoReport({
        d: {
          studio: studio?.name ?? "Studio",
          ragioneSociale: cliente.ragioneSociale,
          anno: e.anno,
          dimensione: cliente.dimensione
            ? (etichettaDimensione[cliente.dimensione as keyof typeof etichettaDimensione] ?? null)
            : null,
          codiceAteco: cliente.codiceAteco,
          dati,
          analisi,
          dataOggi: new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(new Date()),
        },
      }),
    )) as unknown as Buffer;
  } catch (errore) {
    // Tipicamente: font non trovati nell'immagine, o dati di bilancio che
    // fanno esplodere il layout. Va segnalato, non mostrato all'utente.
    segnalaErrore(errore, { origine: "report-pdf", clienteId: id });
    return new NextResponse("Non e' stato possibile generare il report.", { status: 500 });
  }

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeFile(cliente.ragioneSociale, e.anno)}"`,
      // Il report riflette dati che possono cambiare: nessuna cache
      "Cache-Control": "no-store",
    },
  });
}
