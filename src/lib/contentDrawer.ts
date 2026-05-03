import { useCallback, useEffect, useState } from "react";
import type { ResourceKind } from "./instructorTypes";

/**
 * ============================================================
 *  CASSETTO CONTENUTI — area in cui l'istruttore importa o
 *  scrive materiale grezzo e lo organizza con la stessa
 *  struttura logica della Scena.
 * ============================================================
 *
 *  Differenza rispetto all'Archivio e alle Scene:
 *   - Archivio        → deposito materiali (link, PDF, immagini, video).
 *   - Cassetto        → materiale grezzo + form di trasformazione in scena.
 *   - Scene           → output finale, pronto per regia/Aula.
 *
 *  Regola: nulla viene mostrato automaticamente in Aula. Una bozza diventa
 *  una scena solo quando l'istruttore la promuove e la invia.
 *
 *  Persistenza: per ora solo localStorage. Pronto per migrare a Lovable
 *  Cloud quando arrivera' il login (stesso shape, basta cambiare driver).
 */

export type ScenePriority = "CORE" | "STANDARD" | "FULL";
export type SceneFormat = "FLASH" | "STANDARD" | "FULL";

/**
 * Dove deve finire il contenuto una volta promosso a scena:
 *  - "aula"        → contenuto visibile ai discenti (Stimolo / Azione, ecc.)
 *  - "regia-notes" → contenuto SOLO per l'istruttore (note regia)
 */
export type ContentTarget = "aula" | "regia-notes";

/**
 * Stato del contenuto:
 *  - draft  → bozza in lavorazione
 *  - ready  → scena pronta, confermata dall'istruttore
 *  - scene  → alias di ready (compatibilita' precedente)
 *  Lo stato "collegato" viene derivato a runtime da `linkedSceneId`.
 */
export type ContentStatus = "draft" | "ready" | "scene";

export type DerivedStatus = "bozza" | "pronto" | "collegato";

export const deriveStatus = (c: {
  status: ContentStatus;
  linkedSceneId?: string;
}): DerivedStatus => {
  if (c.linkedSceneId) return "collegato";
  if (c.status === "ready" || c.status === "scene") return "pronto";
  return "bozza";
};

/** Precompila i campi scena da un testo grezzo, in modo deterministico. */
export const autofillFromRaw = (raw: {
  title?: string;
  text?: string;
  url?: string;
}) => {
  const text = (raw.text ?? "").trim();
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const first = lines[0] ?? raw.title ?? "";
  const rest = lines.slice(1).join(" ");
  const last = lines[lines.length - 1] ?? "";
  return {
    obiettivo: raw.title || first,
    stimolo: first,
    azione: rest || (raw.url ? `Mostra: ${raw.url}` : ""),
    chiusura: lines.length > 1 ? last : "",
  };
};

export type DraftContent = {
  id: string;
  createdAt: number;

  // ---- materiale grezzo importato/scritto ----
  rawTitle: string;
  rawText?: string;
  rawUrl?: string;
  rawKind: ResourceKind | "text";

  // ---- assegnazione ----
  moduloSlug?: string;
  /** id scena esistente (block:step) cui agganciarsi; vuoto = nuova scena. */
  linkedSceneId?: string;

  // ---- struttura scena (compilata in trasformazione) ----
  obiettivo: string;
  stimolo: string;
  azione: string;
  chiusura: string;
  /** id risorse archivio collegate come media. */
  mediaResourceIds: string[];
  notesRegia: string;
  expectedSeconds: number;
  priority: ScenePriority;
  format: SceneFormat;
  target: ContentTarget;

  status: ContentStatus;
};

const STORAGE_KEY = "sdl-instr:content-drawer";

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

const genId = () =>
  `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const emptyDraft = (
  moduloSlug?: string,
): Omit<DraftContent, "id" | "createdAt"> => ({
  rawTitle: "",
  rawText: "",
  rawUrl: "",
  rawKind: "text",
  moduloSlug,
  linkedSceneId: undefined,
  obiettivo: "",
  stimolo: "",
  azione: "",
  chiusura: "",
  mediaResourceIds: [],
  notesRegia: "",
  expectedSeconds: 120,
  priority: "STANDARD",
  format: "STANDARD",
  target: "aula",
  status: "draft",
});

export const useContentDrawer = (moduloSlug?: string) => {
  const [items, setItems] = useState<DraftContent[]>(() =>
    safeRead<DraftContent[]>(STORAGE_KEY, []),
  );

  // re-load se cambia tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setItems(safeRead<DraftContent[]>(STORAGE_KEY, []));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: DraftContent[]) => {
    setItems(next);
    safeWrite(STORAGE_KEY, next);
  }, []);

  const add = useCallback(
    (data: Partial<DraftContent> = {}) => {
      const base = emptyDraft(moduloSlug);
      const item: DraftContent = {
        ...base,
        ...data,
        id: genId(),
        createdAt: Date.now(),
      };
      persist([item, ...items]);
      return item;
    },
    [items, moduloSlug, persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<DraftContent>) => {
      persist(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    },
    [items, persist],
  );

  const remove = useCallback(
    (id: string) => persist(items.filter((x) => x.id !== id)),
    [items, persist],
  );

  const promote = useCallback(
    (id: string) => update(id, { status: "scene" }),
    [update],
  );

  /** Filtro: solo bozze del modulo corrente (o senza modulo assegnato). */
  const forModule = moduloSlug
    ? items.filter((x) => !x.moduloSlug || x.moduloSlug === moduloSlug)
    : items;

  return { items, forModule, add, update, remove, promote };
};
