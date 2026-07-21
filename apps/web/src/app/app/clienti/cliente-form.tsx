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
import { creaCliente, modificaCliente } from "@/lib/clienti/actions";
import {
  clienteSchema,
  DIMENSIONI,
  etichettaDimensione,
  type ClienteInput,
} from "@/lib/clienti/schema";

export type ClienteModificabile = {
  id: string;
  ragioneSociale: string;
  codiceAteco: string | null;
  dimensione: string | null;
  note?: string | null;
};

/** Corpo del form, remmontato a ogni apertura (via key) per stato pulito. */
function FormInterno({
  cliente,
  onCambioApertura,
  onSalvato,
}: {
  cliente?: ClienteModificabile | null;
  onCambioApertura: (v: boolean) => void;
  onSalvato?: () => void;
}) {
  const modifica = Boolean(cliente);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClienteInput>({
    resolver: standardSchemaResolver(clienteSchema),
    defaultValues: {
      ragioneSociale: cliente?.ragioneSociale ?? "",
      codiceAteco: cliente?.codiceAteco ?? "",
      dimensione: (cliente?.dimensione as ClienteInput["dimensione"]) ?? undefined,
      note: cliente?.note ?? "",
    },
  });

  async function onSubmit(valori: ClienteInput) {
    const res = cliente ? await modificaCliente(cliente.id, valori) : await creaCliente(valori);
    if (!res.ok) {
      if (res.campi) {
        for (const [campo, messaggio] of Object.entries(res.campi)) {
          setError(campo as keyof ClienteInput, { message: messaggio });
        }
      }
      toast.error(res.errore);
      return;
    }
    toast.success(modifica ? "Cliente aggiornato" : "Cliente aggiunto");
    onCambioApertura(false);
    onSalvato?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="grid flex-1 gap-5 overflow-y-auto px-4 py-2">
        <div className="grid gap-1.5">
          <Label htmlFor="ragioneSociale">Ragione sociale</Label>
          <Input
            id="ragioneSociale"
            autoFocus
            aria-invalid={Boolean(errors.ragioneSociale)}
            aria-describedby={errors.ragioneSociale ? "err-ragioneSociale" : undefined}
            placeholder="Es. Rossi S.r.l."
            {...register("ragioneSociale")}
          />
          {errors.ragioneSociale && (
            <p id="err-ragioneSociale" className="text-xs text-danger-foreground">
              {errors.ragioneSociale.message}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="codiceAteco">Codice ATECO (facoltativo)</Label>
          <Input
            id="codiceAteco"
            inputMode="decimal"
            aria-invalid={Boolean(errors.codiceAteco)}
            aria-describedby={errors.codiceAteco ? "err-codiceAteco" : undefined}
            placeholder="Es. 62.01"
            {...register("codiceAteco")}
          />
          {errors.codiceAteco && (
            <p id="err-codiceAteco" className="text-xs text-danger-foreground">
              {errors.codiceAteco.message}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="dimensione">Dimensione (facoltativa)</Label>
          <Controller
            control={control}
            name="dimensione"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="dimensione" className="w-full">
                  <SelectValue placeholder="Seleziona…" />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONI.map((d) => (
                    <SelectItem key={d} value={d}>
                      {etichettaDimensione[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="note">Note (facoltative)</Label>
          <Textarea id="note" rows={3} placeholder="Annotazioni interne" {...register("note")} />
        </div>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio…" : modifica ? "Salva modifiche" : "Aggiungi cliente"}
        </Button>
        <Button type="button" variant="outline" onClick={() => onCambioApertura(false)}>
          Annulla
        </Button>
      </SheetFooter>
    </form>
  );
}

export function ClienteForm({
  aperto,
  onCambioApertura,
  cliente,
  onSalvato,
}: {
  aperto: boolean;
  onCambioApertura: (v: boolean) => void;
  cliente?: ClienteModificabile | null;
  onSalvato?: () => void;
}) {
  return (
    <Sheet open={aperto} onOpenChange={onCambioApertura}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{cliente ? "Modifica cliente" : "Nuovo cliente"}</SheetTitle>
          <SheetDescription>
            {cliente
              ? "Aggiorna l'anagrafica dell'azienda."
              : "Aggiungi un'azienda al portafoglio dello studio."}
          </SheetDescription>
        </SheetHeader>
        {aperto && (
          <FormInterno
            key={cliente?.id ?? "nuovo"}
            cliente={cliente}
            onCambioApertura={onCambioApertura}
            onSalvato={onSalvato}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
