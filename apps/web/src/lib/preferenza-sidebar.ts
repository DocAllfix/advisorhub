"use client";

import { useSyncExternalStore } from "react";

/**
 * Preferenza "barra laterale ridotta", ricordata nel browser.
 *
 * Passa da useSyncExternalStore perché il server non può conoscere
 * localStorage: lo snapshot lato server è sempre "espansa" e React riconcilia
 * dopo l'idratazione senza segnalare disallineamenti.
 */
const CHIAVE = "sidebar-ridotta";
const ascoltatori = new Set<() => void>();

function sottoscrivi(callback: () => void) {
  ascoltatori.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    ascoltatori.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

const leggiClient = () => localStorage.getItem(CHIAVE) === "1";
const leggiServer = () => false;

export function useSidebarRidotta(): [boolean, () => void] {
  const ridotta = useSyncExternalStore(sottoscrivi, leggiClient, leggiServer);
  const cambia = () => {
    localStorage.setItem(CHIAVE, ridotta ? "0" : "1");
    ascoltatori.forEach((a) => a());
  };
  return [ridotta, cambia];
}
