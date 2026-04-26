import { useCallback, useEffect, useState } from "react";
import type { Resource } from "./instructorTypes";

/**
 * Storage istruttore — solo localStorage (per ora).
 * Strutturato per essere migrato a Lovable Cloud quando verra' aggiunto il login.
 *
 * Chiavi:
 *   sdl-instr:notes:free:<modulo>           → string  (note libere modulo)
 *   sdl-instr:notes:slide:<modulo>:<blocco> → string  (note slide)
 *   sdl-instr:archive                       → Resource[] (archivio globale)
 *   sdl-instr:linked:<modulo>:<blocco>      → Resource[] (contenuti collegati slide)
 */

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

const safeReadString = (key: string): string => {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
};

const safeWriteString = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

export const noteKeys = {
  free: (modulo: string) => `sdl-instr:notes:free:${modulo}`,
  slide: (modulo: string, blocco: string) =>
    `sdl-instr:notes:slide:${modulo}:${blocco}`,
};

export const ARCHIVE_KEY = "sdl-instr:archive";
export const linkedKey = (modulo: string, blocco: string) =>
  `sdl-instr:linked:${modulo}:${blocco}`;

// ---------- Notes ----------

export const useNotes = (modulo: string, blocco: string) => {
  const freeK = noteKeys.free(modulo);
  const slideK = noteKeys.slide(modulo, blocco);

  const [freeNote, setFreeNote] = useState<string>(() => safeReadString(freeK));
  const [slideNote, setSlideNote] = useState<string>(() =>
    safeReadString(slideK),
  );

  // Quando cambia slide, ricarica nota associata
  useEffect(() => {
    setSlideNote(safeReadString(slideK));
  }, [slideK]);

  // Quando cambia modulo, ricarica nota libera
  useEffect(() => {
    setFreeNote(safeReadString(freeK));
  }, [freeK]);

  const updateFree = useCallback(
    (v: string) => {
      setFreeNote(v);
      safeWriteString(freeK, v);
    },
    [freeK],
  );

  const updateSlide = useCallback(
    (v: string) => {
      setSlideNote(v);
      safeWriteString(slideK, v);
    },
    [slideK],
  );

  return { freeNote, slideNote, updateFree, updateSlide };
};

// ---------- Archive (globale) ----------

const genId = () =>
  `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const useArchive = () => {
  const [items, setItems] = useState<Resource[]>(() =>
    safeRead<Resource[]>(ARCHIVE_KEY, []),
  );

  const persist = useCallback((next: Resource[]) => {
    setItems(next);
    safeWrite(ARCHIVE_KEY, next);
  }, []);

  const add = useCallback(
    (data: Omit<Resource, "id" | "createdAt">) => {
      const r: Resource = { ...data, id: genId(), createdAt: Date.now() };
      persist([r, ...items]);
      return r;
    },
    [items, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(items.filter((r) => r.id !== id));
    },
    [items, persist],
  );

  return { items, add, remove };
};

// ---------- Linked content (per slide) ----------

export const useLinkedContent = (modulo: string, blocco: string) => {
  const key = linkedKey(modulo, blocco);
  const [items, setItems] = useState<Resource[]>(() =>
    safeRead<Resource[]>(key, []),
  );

  useEffect(() => {
    setItems(safeRead<Resource[]>(key, []));
  }, [key]);

  const persist = useCallback(
    (next: Resource[]) => {
      setItems(next);
      safeWrite(key, next);
    },
    [key],
  );

  const add = useCallback(
    (data: Omit<Resource, "id" | "createdAt">) => {
      const r: Resource = { ...data, id: genId(), createdAt: Date.now() };
      persist([r, ...items]);
      return r;
    },
    [items, persist],
  );

  const attach = useCallback(
    (r: Resource) => {
      // evita duplicati per id
      if (items.some((x) => x.id === r.id)) return;
      persist([r, ...items]);
    },
    [items, persist],
  );

  const remove = useCallback(
    (id: string) => persist(items.filter((r) => r.id !== id)),
    [items, persist],
  );

  return { items, add, attach, remove };
};
