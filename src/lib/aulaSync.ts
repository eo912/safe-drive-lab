import { useCallback, useEffect, useRef, useState } from "react";
import type { Resource } from "./instructorTypes";
import type { PauseAtmosphere } from "./pauseAtmosphere";

/**
 * Stato condiviso tra Istruttore e Aula.
 * Sincronizzato tra finestre/tab della stessa macchina via BroadcastChannel.
 * Riflesso anche in URL (?blocco=...&step=...) per copia/incolla del link.
 */
export type AulaStep = "intro" | "scenario" | "esiti" | "spiegazione" | "approfondimento";

export type AulaState = {
  modulo: string;
  blocco: string;
  step: AulaStep;
  paused?: boolean;
  pauseMinutes?: number;
  pauseAtmosphere?: PauseAtmosphere;
  // Media attualmente proiettato in Aula (immagine/video/pdf/link). null = nessuno.
  media?: Resource | null;
  ts: number;
};

const CHANNEL_NAME = "safedrivelab-aula";
const STORAGE_KEY = "safedrivelab-aula-state";

const channel: BroadcastChannel | null =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

const readFromUrl = (modulo: string, fallbackBlocco: string): AulaState => {
  if (typeof window === "undefined") {
    return { modulo, blocco: fallbackBlocco, step: "intro", ts: Date.now() };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    modulo,
    blocco: params.get("blocco") ?? fallbackBlocco,
    step: (params.get("step") as AulaStep) ?? "intro",
    ts: Date.now(),
  };
};

const writeToUrl = (state: AulaState) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("blocco", state.blocco);
  url.searchParams.set("step", state.step);
  window.history.replaceState({}, "", url.toString());
};

/**
 * Hook per la modalità Istruttore.
 * - `previewState`: stato selezionato in anteprima (NON inviato all'Aula).
 * - `liveState`: ultimo stato pubblicato all'Aula.
 * - `publish(patch)`: invia il patch all'Aula e aggiorna liveState.
 * - `setPreview(patch)`: aggiorna solo l'anteprima locale.
 */
export const useAulaPublisher = (modulo: string, defaultBlocco: string) => {
  const initial = readFromUrl(modulo, defaultBlocco);
  const [previewState, setPreviewState] = useState<AulaState>(initial);
  const [liveState, setLiveState] = useState<AulaState | null>(null);

  const setPreview = useCallback(
    (patch: Partial<Omit<AulaState, "ts" | "modulo">>) => {
      setPreviewState((prev) => ({
        ...prev,
        ...patch,
        modulo,
        ts: Date.now(),
      }));
    },
    [modulo],
  );

  const publish = useCallback(
    (patch?: Partial<Omit<AulaState, "ts" | "modulo">>) => {
      setPreviewState((prev) => {
        const next: AulaState = {
          ...prev,
          ...(patch ?? {}),
          modulo,
          ts: Date.now(),
        };
        writeToUrl(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        channel?.postMessage(next);
        setLiveState(next);
        return next;
      });
    },
    [modulo],
  );

  return { previewState, liveState, setPreview, publish };
};

/**
 * Hook per la modalità Aula.
 * Riceve aggiornamenti dall'istruttore (BroadcastChannel + storage fallback).
 */
export const useAulaSubscriber = (modulo: string, defaultBlocco: string) => {
  const [state, setState] = useState<AulaState>(() => readFromUrl(modulo, defaultBlocco));
  const lastTsRef = useRef(state.ts);

  useEffect(() => {
    const apply = (incoming: AulaState) => {
      if (incoming.modulo !== modulo) return;
      // Tolleriamo ts uguale (clock low-res): scartiamo solo i veri "vecchi".
      if (incoming.ts < lastTsRef.current) return;
      lastTsRef.current = incoming.ts;
      writeToUrl(incoming);
      setState(incoming);
    };

    const onMessage = (e: MessageEvent<AulaState>) => apply(e.data);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        apply(JSON.parse(e.newValue) as AulaState);
      } catch {
        /* ignore */
      }
    };

    channel?.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);

    // Stato iniziale dal localStorage (se l'istruttore ha gia' pubblicato)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) apply(JSON.parse(raw) as AulaState);
    } catch {
      /* ignore */
    }

    return () => {
      channel?.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, [modulo]);

  return state;
};
