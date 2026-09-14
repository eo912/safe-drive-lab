import { useEffect, useState } from "react";

/**
 * Interruttore unico della sincronizzazione Live Regia ↔ Aula.
 *
 * ON  = i cambi di scena originati dall'utente viaggiano (un solo evento).
 * OFF = nessun evento inviato, nessun evento remoto applicato, nessun canale
 *       aperto. Regia e Aula restano navigabili in locale.
 */

const KEY = "sdl-sync-enabled";

const read = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
};

let enabled = read();
const listeners = new Set<(v: boolean) => void>();

export const isSyncEnabled = () => enabled;

export const setSyncEnabled = (value: boolean) => {
  if (enabled === value) return;
  enabled = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(value));
};

export const onSyncEnabledChange = (fn: (v: boolean) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const useSyncEnabled = () => {
  const [value, setValue] = useState(enabled);
  useEffect(() => onSyncEnabledChange(setValue), []);
  return value;
};
