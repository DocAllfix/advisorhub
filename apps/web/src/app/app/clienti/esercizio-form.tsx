"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { mappaBilancioDaCsv } from "@finbeacon/engine";
import { ChevronDown, Upload } from "lucide-react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { creaEsercizio, modificaEsercizio } from "@/lib/esercizi/actions";
import { esercizioSchema, type EsercizioInput } from "@/lib/esercizi/schema";

type Props = {
  clienteId: string;
  ragioneSociale: string;
  esercizioId?: string;
  valoriIniziali?: Partial<EsercizioInput>;
};

const campiPrev = ["liquiditaIniziale", "entrate6m", "uscite6m", "debito6m"] as const;

type CampoNumerico = Exclude<keyof EsercizioInput, "anno">;

export function EsercizioForm({ clienteId, ragioneSociale, esercizioId, valoriIniziali }: Props) {
  const router = useRouter();
  const modifica = Boolean(esercizioId);
  const inputFile = useRef<HTMLInputElement>(null);
  const [prevAperto, setPrevAperto] = useState(
    campiPrev.some((c) => valoriIniziali?.[c] !== undefined && valoriIniziali?.[c] !== null),
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EsercizioInput>({
    resolver: standardSchemaResolver(esercizioSchema),
    defaultValues: { anno: new Date().getFullYear(), ...valoriIniziali },
  });

  function importaCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const riga = res.data[0];
        if (!riga) {
          toast.error("CSV vuoto o non leggibile.");
          return;
        }
        const { dati, previsionale, nCampi } = mappaBilancioDaCsv(riga);
        if (nCampi === 0) {
          toast.error("Nessuna colonna riconosciuta nel CSV.");
          return;
        }
        for (const [k, v] of Object.entries({ ...dati, ...previsionale })) {
          setValue(k as FieldPath<EsercizioInput>, v as number, { shouldDirty: true });
        }
        if (Object.keys(previsionale).length > 0) setPrevAperto(true);
        toast.success(`CSV importato: ${nCampi} valori`);
      },
      error: () => toast.error("Errore nella lettura del CSV."),
    });
  }

  async function onSubmit(valori: EsercizioInput) {
    const res = esercizioId
      ? await modificaEsercizio(esercizioId, valori)
      : await creaEsercizio(clienteId, valori);
    if (!res.ok) {
      if (res.campi) {
        for (const [campo, msg] of Object.entries(res.campi)) {
          setError(campo as FieldPath<EsercizioInput>, { message: msg });
        }
      }
      toast.error(res.errore);
      return;
    }
    toast.success(modifica ? "Esercizio aggiornato" : "Esercizio salvato");
    router.push(`/app/clienti/${clienteId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <label htmlFor="anno" className="text-sm font-medium">
            Anno di esercizio
          </label>
          <Input
            id="anno"
            type="number"
            inputMode="numeric"
            className="mt-1.5 w-32"
            aria-invalid={Boolean(errors.anno)}
            {...register("anno", { valueAsNumber: true })}
          />
          {errors.anno && (
            <p className="mt-1 text-xs text-danger-foreground">{errors.anno.message}</p>
          )}
        </div>
        <div>
          <input
            ref={inputFile}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importaCsv(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => inputFile.current?.click()}>
            <Upload className="size-4" />
            Importa da CSV
          </Button>
        </div>
      </div>

      <Sezione titolo="Conto economico">
        <Campo id="valProd" label="Valore della produzione" reg={register} errors={errors} />
        <Campo id="fatturato" label="Fatturato" reg={register} errors={errors} />
        <Campo id="ro" label="Reddito operativo (RO)" reg={register} errors={errors} />
        <Campo id="ebitda" label="EBITDA / MOL" reg={register} errors={errors} />
        <Campo id="utileNetto" label="Utile netto" reg={register} errors={errors} />
      </Sezione>

      <Sezione titolo="Struttura patrimoniale">
        <Campo id="capInvest" label="Capitale investito" reg={register} errors={errors} />
        <Campo id="patrNetto" label="Patrimonio netto" reg={register} errors={errors} />
      </Sezione>

      <Sezione titolo="Struttura finanziaria">
        <Campo id="pfn" label="Posizione finanziaria netta (PFN)" reg={register} errors={errors} />
        <Campo
          id="servizioDebito"
          label="Servizio del debito annuo"
          reg={register}
          errors={errors}
        />
        <Campo id="flussoCassa" label="Flusso di cassa operativo" reg={register} errors={errors} />
      </Sezione>

      <Collapsible open={prevAperto} onOpenChange={setPrevAperto} className="mt-8">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <span>
            <span className="text-sm font-semibold">Previsionale 6 mesi</span>
            <span className="ml-2 text-xs text-muted-foreground">
              opzionale, per il DSCR prospettico (CNDCEC)
            </span>
          </span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform ${prevAperto ? "rotate-180" : ""}`}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              id="liquiditaIniziale"
              label="Liquidità iniziale (cassa + c/c)"
              reg={register}
              errors={errors}
              opzionale
            />
            <Campo
              id="entrate6m"
              label="Entrate previste 6 mesi"
              reg={register}
              errors={errors}
              opzionale
            />
            <Campo
              id="uscite6m"
              label="Uscite previste 6 mesi"
              reg={register}
              errors={errors}
              opzionale
            />
            <Campo
              id="debito6m"
              label="Debito da servire 6 mesi"
              reg={register}
              errors={errors}
              opzionale
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-8 flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio…" : modifica ? "Salva modifiche" : "Salva esercizio"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/app/clienti/${clienteId}`)}
        >
          Annulla
        </Button>
      </div>

      <p className="sr-only">Cliente: {ragioneSociale}</p>
    </form>
  );
}

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
        {titolo}
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Campo({
  id,
  label,
  reg,
  errors,
  opzionale,
}: {
  id: CampoNumerico;
  label: string;
  reg: ReturnType<typeof useForm<EsercizioInput>>["register"];
  errors: ReturnType<typeof useForm<EsercizioInput>>["formState"]["errors"];
  opzionale?: boolean;
}) {
  const err = errors[id];
  // Campi opzionali: vuoto → undefined (non NaN), così restano validi se non compilati
  const regOpts = opzionale
    ? {
        setValueAs: (v: string) =>
          v === "" || v === null || v === undefined ? undefined : Number(v),
      }
    : { valueAsNumber: true };
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step="any"
        inputMode="decimal"
        className="nums"
        aria-invalid={Boolean(err)}
        aria-describedby={err ? `err-${id}` : undefined}
        placeholder="0"
        {...reg(id, regOpts)}
      />
      {err && (
        <p id={`err-${id}`} className="text-xs text-danger-foreground">
          {err.message as string}
        </p>
      )}
    </div>
  );
}
