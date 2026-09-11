import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Resource } from "./instructorTypes";
import type { PauseAtmosphere } from "./pauseAtmosphere";
import type { EmbedPayload } from "./sceneMedia";

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
  /** Schermata nera istantanea (tasto B). Sovrasta tutto in Aula. */
  blackout?: boolean;
  // Media attualmente proiettato in Aula (immagine/video/pdf/link). null = nessuno.
  media?: Resource | null;
  // Media embedded inline nella scena (più di uno consentito).
  embeds?: EmbedPayload[];
  ts: number;
};

const CHANNEL_NAME = "safedrivelab-aula";
const STORAGE_KEY = "safedrivelab-aula-state";
const HEARTBEAT_CHANNEL = "safedrivelab-aula-heartbeat";
const HEARTBEAT_STORAGE = "safedrivelab-aula-heartbeat";

/** Heartbeat inviato dall'Aula reale alla Regia. */
export type AulaHeartbeat = {
  modulo: string;
  blocco: string;
  step: AulaStep;
  paused: boolean;
  pauseAtmosphere?: PauseAtmosphere;
  ts: number;
};

const heartbeatChannel: BroadcastChannel | null =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(HEARTBEAT_CHANNEL)
    : null;

const channel: BroadcastChannel | null =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

/* ------------------------------------------------------------------ *
 * Livello REMOTO (dispositivi diversi: PC regia ↔ TV/proiettore).
 * BroadcastChannel e localStorage funzionano solo sullo stesso browser:
 * per far seguire la TV al PC serve un canale realtime condiviso.
 * ------------------------------------------------------------------ */

const REMOTE_ROOM = "safedrivelab-aula-live";

const remoteHandlers = {
  state: new Set<(s: AulaState) => void>(),
  heartbeat: new Set<(h: AulaHeartbeat) => void>(),
  request: new Set<() => void>(),
};

let remoteChannel: ReturnType<typeof supabase.channel> | null = null;

const getRemoteChannel = () => {
  if (typeof window === "undefined") return null;
  if (remoteChannel) return remoteChannel;
  remoteChannel = supabase
    .channel(REMOTE_ROOM, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "state" }, ({ payload }) => {
      remoteHandlers.state.forEach((fn) => fn(payload as AulaState));
    })
    .on("broadcast", { event: "heartbeat" }, ({ payload }) => {
      remoteHandlers.heartbeat.forEach((fn) => fn(payload as AulaHeartbeat));
    })
    .on("broadcast", { event: "request-state" }, () => {
      remoteHandlers.request.forEach((fn) => fn());
    });
  remoteChannel.subscribe();
  return remoteChannel;
};

const remoteSend = (event: string, payload: unknown) => {
  const ch = getRemoteChannel();
  if (!ch) return;
  void Promise.resolve(ch.send({ type: "broadcast", event, payload })).catch(
    () => {
      /* offline: resta la sincronizzazione locale */
    },
  );
};

const useRemoteListener = <T,>(
  set: Set<(v: T) => void>,
  fn: (v: T) => void,
) => {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const handler = (v: T) => ref.current(v);
    getRemoteChannel();
    set.add(handler as never);
    return () => {
      set.delete(handler as never);
    };
  }, [set]);
};

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
  const lastPublishedRef = useRef<AulaState | null>(null);

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
        remoteSend("state", next);
        lastPublishedRef.current = next;
        setLiveState(next);
        return next;
      });
    },
    [modulo],
  );

  // Una TV che si collega dopo chiede lo stato corrente: lo ri-trasmettiamo.
  useRemoteListener(remoteHandlers.request, () => {
    const last = lastPublishedRef.current;
    if (last) remoteSend("state", last);
  });

  return { previewState, liveState, setPreview, publish };
};

/**
 * Hook per la modalità Aula.
 * Riceve aggiornamenti dall'istruttore (BroadcastChannel + storage fallback).
 */
export const useAulaSubscriber = (modulo: string, defaultBlocco: string) => {
  const [state, setState] = useState<AulaState>(() => readFromUrl(modulo, defaultBlocco));
  const lastTsRef = useRef(state.ts);
  const lastRemoteTsRef = useRef(0);

  // Comandi provenienti da un ALTRO dispositivo (PC regia → TV).
  // Il timestamp arriva da un altro orologio: confrontiamo solo con l'ultimo
  // messaggio remoto ricevuto, mai con quello locale.
  useRemoteListener(remoteHandlers.state, (incoming: AulaState) => {
    if (!incoming || incoming.modulo !== modulo) return;
    if (incoming.ts < lastRemoteTsRef.current) return;
    lastRemoteTsRef.current = incoming.ts;
    lastTsRef.current = Date.now();
    writeToUrl(incoming);
    setState({ ...incoming, ts: lastTsRef.current });
  });

  // All'apertura la TV chiede alla Regia lo stato corrente.
  useEffect(() => {
    getRemoteChannel();
    const id = window.setTimeout(() => remoteSend("request-state", { modulo }), 800);
    return () => window.clearTimeout(id);
  }, [modulo]);


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

/**
 * Hook lato Aula: invia un heartbeat ogni `intervalMs` (default 1500ms)
 * con la posizione corrente. Sistema leggero: nessun fetch, nessun polling
 * di rete, solo BroadcastChannel + localStorage (stesso pattern dello stato).
 *
 * NON deve essere chiamato in modalità embed (mini-stage della regia).
 */
export const useAulaHeartbeat = (
  enabled: boolean,
  payload: Omit<AulaHeartbeat, "ts">,
  intervalMs = 1500,
) => {
  const ref = useRef(payload);
  ref.current = payload;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const send = () => {
      const beat: AulaHeartbeat = { ...ref.current, ts: Date.now() };
      try {
        localStorage.setItem(HEARTBEAT_STORAGE, JSON.stringify(beat));
      } catch {
        /* ignore */
      }
      heartbeatChannel?.postMessage(beat);
      remoteSend("heartbeat", beat);
    };
    send();
    const id = window.setInterval(send, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
};

/**
 * Hook lato Regia: riceve gli heartbeat dall'Aula e calcola lo stato
 * online/offline. Aula è considerata offline se non riceviamo heartbeat
 * per più di `offlineAfterMs` (default 4000ms).
 */
export const useAulaHeartbeatMonitor = (
  modulo: string,
  offlineAfterMs = 4000,
) => {
  const [last, setLast] = useState<AulaHeartbeat | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const apply = (b: AulaHeartbeat) => {
      if (b.modulo !== modulo) return;
      setLast((prev) => (prev && prev.ts > b.ts ? prev : b));
    };
    const onMsg = (e: MessageEvent<AulaHeartbeat>) => apply(e.data);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== HEARTBEAT_STORAGE || !e.newValue) return;
      try {
        apply(JSON.parse(e.newValue) as AulaHeartbeat);
      } catch {
        /* ignore */
      }
    };
    heartbeatChannel?.addEventListener("message", onMsg);
    window.addEventListener("storage", onStorage);

    // Lettura iniziale (se Aula sta già trasmettendo)
    try {
      const raw = localStorage.getItem(HEARTBEAT_STORAGE);
      if (raw) apply(JSON.parse(raw) as AulaHeartbeat);
    } catch {
      /* ignore */
    }

    const tick = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      heartbeatChannel?.removeEventListener("message", onMsg);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(tick);
    };
  }, [modulo]);

  const sinceMs = last ? now - last.ts : Infinity;
  const online = last !== null && sinceMs < offlineAfterMs;
  return { heartbeat: last, online, sinceMs };
};

