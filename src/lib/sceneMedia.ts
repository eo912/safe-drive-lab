import { useCallback, useEffect, useState } from "react";
import type { Resource } from "./instructorTypes";

/**
 * ============================================================
 *  SCENE MEDIA — placement dei media all'interno di una scena.
 * ============================================================
 *
 *  Differenza con `instructorStorage.useLinkedContent`:
 *   - useLinkedContent: pool di risorse collegate alla slide.
 *   - useSceneMedia:    come ognuna di quelle risorse va RESA in Aula
 *                        (modalità, posizione, visibilità, autoplay).
 *
 *  Modalità:
 *   - embedded: finestra interna, posizione/dimensione libere (in %).
 *   - overlay:  apre in fullscreen sopra la slide (usa AulaMediaOverlay).
 *   - link:     apre l'URL in una nuova scheda. Mai mostrato in Aula.
 *
 *  Visibilità:
 *   - aula:  istruttore proietta in Aula (publish via aulaSync).
 *   - regia: solo istruttore, non viene mai inviato all'Aula.
 *
 *  Persistenza: localStorage. Pronto per migrazione cloud.
 *  Chiave: `sdl-instr:scene-media:<modulo>:<blocco>:<step>` → Placement[]
 */

export type SceneMediaMode = "embedded" | "overlay" | "link";
export type SceneMediaVisibility = "aula" | "regia";

export type ScenePlacement = {
  id: string;
  resourceId: string;
  mode: SceneMediaMode;
  visibility: SceneMediaVisibility;
  // Posizione/dimensione in % (0..100). Validi solo se mode === "embedded".
  x: number;
  y: number;
  w: number;
  h: number;
  autoplay: boolean; // solo video; la scelta resta manuale
  createdAt: number;
};

/** Payload pronto al broadcast: include il Resource + parametri rendering. */
export type EmbedPayload = {
  id: string;
  resource: Resource;
  x: number;
  y: number;
  w: number;
  h: number;
  autoplay: boolean;
};

const STORAGE_PREFIX = "sdl-instr:scene-media";

export const sceneMediaKey = (modulo: string, blocco: string, step: string) =>
  `${STORAGE_PREFIX}:${modulo}:${blocco}:${step}`;

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
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const defaultPlacement = (resourceId: string): ScenePlacement => ({
  id: genId(),
  resourceId,
  mode: "embedded",
  visibility: "aula",
  x: 8,
  y: 60,
  w: 30,
  h: 30,
  autoplay: false,
  createdAt: Date.now(),
});

export const useSceneMedia = (modulo: string, blocco: string, step: string) => {
  const key = sceneMediaKey(modulo, blocco, step);
  const [items, setItems] = useState<ScenePlacement[]>(() =>
    safeRead<ScenePlacement[]>(key, []),
  );

  useEffect(() => {
    setItems(safeRead<ScenePlacement[]>(key, []));
  }, [key]);

  const persist = useCallback(
    (next: ScenePlacement[]) => {
      setItems(next);
      safeWrite(key, next);
    },
    [key],
  );

  const upsertForResource = useCallback(
    (resourceId: string, patch: Partial<ScenePlacement> = {}) => {
      const existing = items.find((p) => p.resourceId === resourceId);
      if (existing) {
        const next = items.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                ...patch,
                x: patch.x !== undefined ? clamp(patch.x, 0, 95) : p.x,
                y: patch.y !== undefined ? clamp(patch.y, 0, 95) : p.y,
                w: patch.w !== undefined ? clamp(patch.w, 10, 100) : p.w,
                h: patch.h !== undefined ? clamp(patch.h, 10, 100) : p.h,
              }
            : p,
        );
        persist(next);
        return next.find((p) => p.id === existing.id)!;
      }
      const created = { ...defaultPlacement(resourceId), ...patch };
      persist([created, ...items]);
      return created;
    },
    [items, persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<ScenePlacement>) => {
      persist(
        items.map((p) =>
          p.id === id
            ? {
                ...p,
                ...patch,
                x: patch.x !== undefined ? clamp(patch.x, 0, 95) : p.x,
                y: patch.y !== undefined ? clamp(patch.y, 0, 95) : p.y,
                w: patch.w !== undefined ? clamp(patch.w, 10, 100) : p.w,
                h: patch.h !== undefined ? clamp(patch.h, 10, 100) : p.h,
              }
            : p,
        ),
      );
    },
    [items, persist],
  );

  const remove = useCallback(
    (id: string) => persist(items.filter((p) => p.id !== id)),
    [items, persist],
  );

  const removeForResource = useCallback(
    (resourceId: string) =>
      persist(items.filter((p) => p.resourceId !== resourceId)),
    [items, persist],
  );

  const findForResource = useCallback(
    (resourceId: string) =>
      items.find((p) => p.resourceId === resourceId) ?? null,
    [items],
  );

  return {
    items,
    upsertForResource,
    update,
    remove,
    removeForResource,
    findForResource,
  };
};

/** Costruisce i payload da inviare in Aula a partire da placements + pool. */
export const buildEmbedPayloads = (
  placements: ScenePlacement[],
  pool: Resource[],
): EmbedPayload[] => {
  const map = new Map(pool.map((r) => [r.id, r]));
  return placements
    .filter((p) => p.mode === "embedded" && p.visibility === "aula")
    .map((p) => {
      const r = map.get(p.resourceId);
      if (!r) return null;
      return {
        id: p.id,
        resource: r,
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h,
        autoplay: p.autoplay,
      } satisfies EmbedPayload;
    })
    .filter((x): x is EmbedPayload => Boolean(x));
};
