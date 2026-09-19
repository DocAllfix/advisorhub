"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { creaScadenza, modificaScadenza } from "@/lib/scadenze/actions";
import {
  CATEGORIE,
  etichettaCategoria,
  scadenzaSchema,
  type ScadenzaInput,
} from "@/lib/scadenze/schema";

export type ScadenzaModificabile = {
  id: string;
  titolo: string;
  data: string;
  categoria: string;
  clienteId: string | null;
  note: string | null;
};

function FormInterno({
  scadenza,
  clienti,
  onCambioApertura,
  onSalvata,
}: {
  scadenza?: ScadenzaModificabile | null;
  clienti: { id: string; ragioneSociale: string }[];
  onCambioApertura: (v: boolean) => void;
  onSalvata?: () => void;
}) {
  const modifica = Boolean(scadenza);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ScadenzaInput>({
    resolver: standardSchemaResolver(scadenzaSchema),
    defaultValues: {
      titolo: scadenza?.titolo ?? "",
      data: scadenza?.data ?? new Date().toISOString().slice(0, 10),
      categoria: (scadenza?.categoria as ScadenzaInput["categoria"]) ?? "adempimenti",
      clienteId: scadenza?.clienteId ?? "",
      note: scadenza?.note ?? "",
    },
  });

  async function onSubmit(valori: ScadenzaInput) {
    const res = scadenza ? await modificaScadenza(scadenza.id, valori) : await creaScadenza(valori);
    if (!res.ok) {
      if (res.campi) {
        for (const [campo, msg] of Object.entries(res.campi)) {
          setError(campo as keyof ScadenzaInput, { message: msg });
        }
      }
      toast.error(res.errore);
      return;
    }
    toast.success(modifica ? "Scadenza aggiornata" : "Scadenza aggiunta");
    onCambioApertura(false);
    onSalvata?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="grid flex-1 gap-5 overflow-y-auto px-4 py-2">
        <div className="grid gap-1.5">
          <Label htmlFor="titolo">Titolo</Label>
          <Input
            id="titolo"
            autoFocus
            aria-invalid={Boolean(errors.titolo)}
            placeholder="Es. Deposito bilancio 2025"
            {...register("titolo")}
          />
          {errors.titolo && (
            <p className="text-xs text-danger-foreground">{errors.titolo.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="data">Scadenza</Label>
            <Input
              id="data"
              type="date"
              aria-invalid={Boolean(errors.data)}
              {...register("data")}
            />
            {errors.data && <p className="text-xs text-danger-foreground">{errors.data.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="categoria">Categoria</Label>
            <Controller
              control={control}
              name="categoria"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoria" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE.map((c) => (
                      <SelectItem key={c} value={c}>
                        {etichettaCategoria[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="clienteId">Cliente (facoltativo)</Label>
          <Controller
            control={control}
            name="clienteId"
            render={({ field }) => (
              <Select
                value={field.value || "__nessuno"}
                onValueChange={(v) => field.onChange(v === "__nessuno" ? "" : v)}
              >
                <SelectTrigger id="clienteId" className="w-full">
                  <SelectValue placeholder="Nessuno (scadenza dello studio)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nessuno">Nessuno (scadenza dello studio)</SelectItem>
                  {clienti.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.ragioneSociale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="note">Note (facoltative)</Label>
          <Textarea
            id="note"
            rows={3}
            placeholder="Dettagli, importi, riferimenti"
            {...register("note")}
          />
        </div>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio…" : modifica ? "Salva modifiche" : "Aggiungi scadenza"}
        </Button>
        <Button type="button" variant="outline" onClick={() => onCambioApertura(false)}>
          Annulla
        </Button>
      </SheetFooter>
    </form>
  );
}

export function ScadenzaForm({
  aperto,
  onCambioApertura,
  scadenza,
  clienti,
  onSalvata,
}: {
  aperto: boolean;
  onCambioApertura: (v: boolean) => void;
  scadenza?: ScadenzaModificabile | null;
  clienti: { id: string; ragioneSociale: string }[];
  onSalvata?: () => void;
}) {
  return (
    <Sheet open={aperto} onOpenChange={onCambioApertura}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{scadenza ? "Modifica scadenza" : "Nuova scadenza"}</SheetTitle>
          <SheetDescription>
            {scadenza ? "Aggiorna la scadenza." : "Aggiungi un adempimento o un promemoria."}
          </SheetDescription>
        </SheetHeader>
        {aperto && (
          <FormInterno
            key={scadenza?.id ?? "nuova"}
            scadenza={scadenza}
            clienti={clienti}
            onCambioApertura={onCambioApertura}
            onSalvata={onSalvata}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
