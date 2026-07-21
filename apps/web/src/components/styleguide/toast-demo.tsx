"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export function ToastDemo() {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => toast.success("CSV importato: 10 valori")}>
          Toast successo
        </Button>
        <Button variant="outline" onClick={() => toast.error("Errore import: formato non valido")}>
          Toast errore
        </Button>
      </div>
      <Toaster position="bottom-center" />
    </>
  );
}
