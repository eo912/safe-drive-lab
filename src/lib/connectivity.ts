import { useEffect, useState } from "react";

/**
 * Stato di connessione condiviso dall'intera app.
 *
 * Combina `navigator.onLine` con l'esito reale delle chiamate al backend:
 * una chiamata fallita mette l'app in stato "offline" finché una successiva
 * non riesce. Quando il browser dichiara di essere offline non tentiamo
 * nemmeno le chiamate remote, così Regia e Aula non si bloccano mai.
 */

let backendOk = true;
const listeners = new Set<(online: boolean) => void>();

const browserOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine !== false;

const compute = () => browserOnline() && backendOk;

let current = compute();

const notify = () => {
  const next = compute();
  if (next === current) return;
  current = next;
  listeners.forEach((fn) => fn(next));
};

/** Stato corrente: true se l'app può ragionevolmente raggiungere il backend. */
export const isOnline = () => current;

/** Una chiamata al backend è andata a buon fine. */
export const markBackendOk = () => {
  if (backendOk) return;
  backendOk = true;
  notify();
};

/** Una chiamata al backend è fallita (rete assente o server irraggiungibile). */
export const markBackendFailure = () => {
  if (!backendOk) return;
  backendOk = false;
  notify();
};

/** Esegue una chiamata al backend aggiornando lo stato di connessione. */
export const withConnectivity = async <T,>(
  run: () => Promise<T>,
  fallback: T,
): Promise<T> => {
  if (!current) return fallback;
  try {
    const out = await run();
    markBackendOk();
    return out;
  } catch {
    markBackendFailure();
    return fallback;
  }
};

/** Iscrizione ai cambi di stato. Ritorna la funzione di annullamento. */
export const onConnectivityChange = (fn: (online: boolean) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    // Il browser è tornato online: riproviamo in modo ottimistico.
    backendOk = true;
    notify();
  });
  window.addEventListener("offline", notify);

  // Se siamo offline per un fallimento del backend, ogni tanto riproviamo.
  window.setInterval(() => {
    if (!current && browserOnline()) {
      backendOk = true;
      notify();
    }
  }, 20000);
}

/** Hook React sullo stato di connessione. */
export const useOnline = () => {
  const [online, setOnline] = useState(current);
  useEffect(() => {
    const off = onConnectivityChange(setOnline);
    return () => {
      off();
    };
  }, []);
  return online;
};
