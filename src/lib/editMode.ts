import { useEffect, useState } from "react";

/**
 * "Modalità modifica" nascosta.
 *
 * Attivazione:
 *  - parametro URL segreto  ?edit=sdl2026
 *  - scorciatoia tastiera   Ctrl + Alt + Shift + E
 * Disattivazione:
 *  - ?edit=0  oppure la stessa scorciatoia
 *
 * Lo stato vive in sessionStorage: chiudendo la finestra si spegne da solo.
 * Fuori da questa modalità nessun elemento di modifica viene renderizzato.
 */
const SECRET = "sdl2026";
const KEY = "sdl.editMode";
const EVT = "sdl:edit-mode";

let active = false;

if (typeof window !== "undefined") {
  const param = new URLSearchParams(window.location.search).get("edit");
  if (param === SECRET) sessionStorage.setItem(KEY, "1");
  if (param === "0") sessionStorage.removeItem(KEY);
  active = sessionStorage.getItem(KEY) === "1";
}

export const isEditMode = () => active;

const setActive = (v: boolean) => {
  active = v;
  if (typeof window === "undefined") return;
  if (v) sessionStorage.setItem(KEY, "1");
  else sessionStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(EVT));
};

export const toggleEditMode = () => setActive(!active);

/** Registra la scorciatoia globale. Da montare una sola volta (App). */
export const useEditModeHotkey = () => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        toggleEditMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
};

export const useEditMode = () => {
  const [on, setOn] = useState(active);
  useEffect(() => {
    const sync = () => setOn(active);
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return on;
};
