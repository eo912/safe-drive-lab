import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isOnline, onConnectivityChange } from "./connectivity";
import { INSTANCE_ID, ROOM_ID } from "./aulaRoom";
import type { Resource } from "./instructorTypes";
import type { PauseAtmosphere } from "./pauseAtmosphere";
import type { EmbedPayload } from "./sceneMedia";
import { syncTrace } from "./syncTrace";

/**
 * Sincronizzazione Regia ↔ Aula.
 *
 * Tre tipi di evento, semanticamente separati:
 *  - `navigation_command`  Regia → Aula. L'UNICO evento che può navigare/scrollare.
 *  - `observed_position`   Aula → Regia. Posizione realmente visibile in Aula.
 *  - `presence`            Aula → Regia. Solo liveness: non tocca mai blocco/step.
 *
 * Ogni evento viaggia in una busta con roomId, mittente, eventId e seq
 * monotono: fuori stanza, di se stessi, duplicati o non crescenti vengono
 * scartati (con motivo tracciato nei log SYNC_TRACE).
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
  media?: Resource | null;
  embeds?: EmbedPayload[];
  /** Stato overlay telefono (solo lato Aula Live). */
  phonePhase?: "idle" | "ringing" | "visible";
  phoneBlock?: string;
  phoneTs?: number;
  hazardPhase?: "idle" | "active" | "resolved";
  hazardVariant?: "car-braking";
  hazardOutcome?: "stopped" | "failed";
  hazardTs?: number;
  /** Versione del comando assegnata dalla Regia: mai riscritta dai destinatari. */
  cmdTs?: number;
  ts: number;
};

/** Posizione dichiarata dall'Aula (observed_position). */
export type AulaHeartbeat = {
  modulo: string;
  blocco: string;
  step: AulaStep;
  paused: boolean;
  pauseAtmosphere?: PauseAtmosphere;
  riskProbability?: number;
  /** Comando (cmdTs) che l'Aula sta eseguendo nel momento dell'osservazione. */
  ackTs?: number;
  /** Momento in cui l'Aula ha chiuso da sola l'overlay telefono (verde/rosso). */
  phoneDismissTs?: number;
  ts: number;
};

/* ------------------------------------------------------------------ *
 * Busta comune                                                        *
 * ------------------------------------------------------------------ */

export type EventKind =
  | "navigation_command"
  | "observed_position"
  | "presence"
  | "request_state";

type Envelope = {
  kind: EventKind;
  roomId: string;
  senderInstanceId: string;
  eventId: string;
  seq: number;
  sentAt: number;
  moduleId: string;
  /** Solo per observed_position e navigation_command. */
  blockId?: string;
  step?: AulaStep;
  payload?: unknown;
};

const LOCAL_CHANNEL = `safedrivelab-aula:${ROOM_ID}`;
const STORAGE_KEY = `safedrivelab-aula-state:${ROOM_ID}`;
const REMOTE_ROOM = `safedrivelab-aula-live:${ROOM_ID}`;

let seqCounter = 0;
const seenEventIds = new Set<string>();
const seenOrder: string[] = [];
const lastSeqBySender = new Map<string, number>();

const makeEnvelope = (
  kind: EventKind,
  moduleId: string,
  extra: Partial<Envelope> = {},
): Envelope => ({
  kind,
  roomId: ROOM_ID,
  senderInstanceId: INSTANCE_ID,
  eventId: `${INSTANCE_ID}-${++seqCounter}`,
  seq: seqCounter,
  sentAt: Date.now(),
  moduleId,
  ...extra,
});

const rememberEvent = (id: string) => {
  seenEventIds.add(id);
  seenOrder.push(id);
  if (seenOrder.length > 500) {
    const old = seenOrder.shift();
    if (old) seenEventIds.delete(old);
  }
};

const traceEnv = (where: string, e: Envelope, extra: Record<string, unknown> = {}) =>
  syncTrace("REALTIME", where, {
    kind: e.kind,
    roomId: e.roomId,
    senderInstanceId: e.senderInstanceId,
    eventId: e.eventId,
    seq: e.seq,
    sentAt: e.sentAt,
    moduleId: e.moduleId,
    blockId: e.blockId,
    step: e.step,
    receivedAt: Date.now(),
    ...extra,
  });

/** Filtro unico: stanza, self, duplicati, seq non crescente. */
const acceptEnvelope = (e: Envelope | null | undefined): e is Envelope => {
  if (!e || typeof e !== "object" || !e.kind || !e.eventId) return false;
  if (e.roomId !== ROOM_ID) {
    traceEnv("bus.reject", e, { reason: "wrong-room", expectedRoomId: ROOM_ID });
    return false;
  }
  if (e.senderInstanceId === INSTANCE_ID) return false; // self-originated
  if (seenEventIds.has(e.eventId)) {
    traceEnv("bus.reject", e, { reason: "duplicate-event" });
    return false;
  }
  const key = `${e.senderInstanceId}:${e.kind}`;
  const last = lastSeqBySender.get(key);
  if (last != null && e.seq <= last) {
    traceEnv("bus.reject", e, { reason: "stale-seq", lastSeq: last });
    return false;
  }
  lastSeqBySender.set(key, e.seq);
  rememberEvent(e.eventId);
  return true;
};

/* ------------------------------------------------------------------ *
 * Bus: una sola sottoscrizione locale + una sola remota, per stanza.   *
 * ------------------------------------------------------------------ */

type Handler = (e: Envelope) => void;
const handlers = new Map<EventKind, Set<Handler>>();

const dispatch = (raw: unknown) => {
  const e = raw as Envelope;
  if (!acceptEnvelope(e)) return;
  handlers.get(e.kind)?.forEach((fn) => fn(e));
};

const localBus: BroadcastChannel | null =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(LOCAL_CHANNEL)
    : null;

localBus?.addEventListener("message", (ev: MessageEvent) => dispatch(ev.data));

let remoteChannel: ReturnType<typeof supabase.channel> | null = null;

const getRemoteChannel = () => {
  if (typeof window === "undefined") return null;
  if (!isOnline()) return null;
  if (remoteChannel) return remoteChannel;
  remoteChannel = supabase
    .channel(REMOTE_ROOM, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "sync" }, ({ payload }) => dispatch(payload));
  remoteChannel.subscribe();
  return remoteChannel;
};

const sendEnvelope = (e: Envelope) => {
  rememberEvent(e.eventId);
  localBus?.postMessage(e);
  const ch = getRemoteChannel();
  if (!ch) return;
  try {
    void Promise.resolve(ch.send({ type: "broadcast", event: "sync", payload: e })).catch(
      () => {
        /* offline: resta la sincronizzazione locale */
      },
    );
  } catch {
    /* offline: resta la sincronizzazione locale */
  }
};

if (typeof window !== "undefined") {
  onConnectivityChange((online) => {
    if (online) {
      getRemoteChannel();
      return;
    }
    const ch = remoteChannel;
    remoteChannel = null;
    if (ch) {
      try {
        void supabase.removeChannel(ch);
      } catch {
        /* ignore */
      }
    }
  });
}

/** Una sola registrazione stabile per componente, con cleanup garantito. */
const useBusListener = (kind: EventKind, fn: Handler) => {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const handler: Handler = (e) => ref.current(e);
    getRemoteChannel();
    let set = handlers.get(kind);
    if (!set) {
      set = new Set();
      handlers.set(kind, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }, [kind]);
};

/* ------------------------------------------------------------------ *
 * URL                                                                  *
 * ------------------------------------------------------------------ */

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

const writeToUrl = (state: { blocco: string; step: AulaStep }) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (
    url.searchParams.get("blocco") === state.blocco &&
    url.searchParams.get("step") === state.step
  ) {
    return;
  }
  url.searchParams.set("blocco", state.blocco);
  url.searchParams.set("step", state.step);
  window.history.replaceState({}, "", url.toString());
};

/* ------------------------------------------------------------------ *
 * REGIA                                                               *
 * ------------------------------------------------------------------ */

export const useAulaPublisher = (modulo: string, defaultBlocco: string) => {
  const initial = readFromUrl(modulo, defaultBlocco);
  const [previewState, setPreviewState] = useState<AulaState>(initial);
  const [liveState, setLiveState] = useState<AulaState | null>(null);
  const lastPublishedRef = useRef<AulaState | null>(null);

  const setPreview = useCallback(
    (patch: Partial<Omit<AulaState, "ts" | "modulo">>) => {
      setPreviewState((prev) => ({ ...prev, ...patch, modulo, ts: Date.now() }));
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
          cmdTs: Date.now(),
          ts: Date.now(),
        };
        writeToUrl(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        const env = makeEnvelope("navigation_command", modulo, {
          blockId: next.blocco,
          step: next.step,
          payload: next,
        });
        syncTrace("REGIA", "useAulaPublisher.publish", {
          kind: env.kind,
          roomId: env.roomId,
          senderInstanceId: env.senderInstanceId,
          eventId: env.eventId,
          seq: env.seq,
          moduleId: next.modulo,
          previousBlockId: prev.blocco,
          requestedBlockId: next.blocco,
          step: next.step,
          sentAt: env.sentAt,
        });
        sendEnvelope(env);
        lastPublishedRef.current = next;
        setLiveState(next);
        return next;
      });
    },
    [modulo],
  );

  /**
   * Allinea lo stato "in onda" alla posizione osservata in Aula.
   * Non pubblica nulla: nessun comando torna verso l'Aula (nessun eco).
   */
  const syncLiveFromAula = useCallback((pos: { blocco: string; step: AulaStep }) => {
    setLiveState((prev) => {
      if (!prev) return prev;
      if (prev.blocco === pos.blocco && prev.step === pos.step) return prev;
      const next: AulaState = { ...prev, blocco: pos.blocco, step: pos.step };
      writeToUrl(next);
      lastPublishedRef.current = next;
      syncTrace("HEARTBEAT", "useAulaPublisher.syncLiveFromAula", {
        kind: "observed_position",
        roomId: ROOM_ID,
        moduleId: next.modulo,
        previousBlockId: prev.blocco,
        resultBlockId: next.blocco,
        step: next.step,
        receivedAt: Date.now(),
      });
      return next;
    });
  }, []);

  // Un'Aula che si collega dopo chiede lo stato corrente.
  useBusListener("request_state", () => {
    const last = lastPublishedRef.current;
    if (!last) return;
    sendEnvelope(
      makeEnvelope("navigation_command", last.modulo, {
        blockId: last.blocco,
        step: last.step,
        payload: last,
      }),
    );
  });

  useEffect(() => {
    const off = onConnectivityChange((online) => {
      const last = lastPublishedRef.current;
      if (!online || !last) return;
      window.setTimeout(
        () =>
          sendEnvelope(
            makeEnvelope("navigation_command", last.modulo, {
              blockId: last.blocco,
              step: last.step,
              payload: last,
            }),
          ),
        600,
      );
    });
    return () => {
      off();
    };
  }, []);

  return { previewState, liveState, setPreview, publish, syncLiveFromAula };
};

/* ------------------------------------------------------------------ *
 * AULA                                                                *
 * ------------------------------------------------------------------ */

export const useAulaSubscriber = (modulo: string, defaultBlocco: string) => {
  const [state, setState] = useState<AulaState>(() => readFromUrl(modulo, defaultBlocco));
  const lastCmdTsRef = useRef(0);
  const mountedAtRef = useRef(Date.now());

  useBusListener("navigation_command", (e) => {
    const incoming = e.payload as AulaState | undefined;
    if (!incoming || incoming.modulo !== modulo) {
      traceEnv("useAulaSubscriber.reject", e, { reason: "other-module" });
      return;
    }
    const cmdTs = incoming.cmdTs ?? incoming.ts;
    if (cmdTs <= lastCmdTsRef.current) {
      traceEnv("useAulaSubscriber.reject", e, {
        reason: "stale-command",
        lastAppliedCmdTs: lastCmdTsRef.current,
      });
      return;
    }
    const joinWindow = Date.now() - mountedAtRef.current < 5000;
    if (cmdTs < mountedAtRef.current && !joinWindow) {
      traceEnv("useAulaSubscriber.reject", e, {
        reason: "older-than-mount",
        mountedAt: mountedAtRef.current,
      });
      return;
    }
    traceEnv("useAulaSubscriber.apply", e, { reason: "accepted" });
    lastCmdTsRef.current = cmdTs;
    writeToUrl(incoming);
    setState({ ...incoming, ts: Date.now() });
  });

  // All'apertura chiediamo lo stato corrente alla Regia della stanza.
  useEffect(() => {
    getRemoteChannel();
    const id = window.setTimeout(
      () => sendEnvelope(makeEnvelope("request_state", modulo)),
      800,
    );
    return () => window.clearTimeout(id);
  }, [modulo]);

  // Snapshot locale: SOLO al montaggio (niente listener "storage": era la
  // seconda strada che faceva applicare due volte lo stesso comando).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw) as AulaState;
      if (snap.modulo !== modulo) return;
      const cmdTs = snap.cmdTs ?? snap.ts;
      if (cmdTs <= lastCmdTsRef.current) return;
      lastCmdTsRef.current = cmdTs;
      syncTrace("INIT", "useAulaSubscriber.snapshot", {
        kind: "navigation_command",
        roomId: ROOM_ID,
        moduleId: snap.modulo,
        resultBlockId: snap.blocco,
        step: snap.step,
        sentAt: cmdTs,
      });
      writeToUrl(snap);
      setState({ ...snap, ts: Date.now() });
    } catch {
      /* ignore */
    }
  }, [modulo]);

  return state;
};

/**
 * Aula → Regia. `presence` ogni `intervalMs` (solo liveness),
 * `observed_position` quando la posizione osservata cambia davvero.
 */
export const useAulaHeartbeat = (
  enabled: boolean,
  payload: Omit<AulaHeartbeat, "ts">,
  intervalMs = 1500,
) => {
  const ref = useRef(payload);
  ref.current = payload;

  // L'indirizzo della finestra Aula riflette la scena realmente visibile.
  // Solo replaceState: non pubblica e non invia nulla.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const { blocco, step } = payload;
    if (!blocco) return;
    writeToUrl({ blocco, step });
    syncTrace("LOCAL_EFFECT", "useAulaHeartbeat.syncUrl", {
      roomId: ROOM_ID,
      moduleId: payload.modulo,
      resultBlockId: blocco,
      step,
    });
  }, [enabled, payload.modulo, payload.blocco, payload.step, payload]);

  // presence: liveness e basta.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const beat = () => {
      const env = makeEnvelope("presence", ref.current.modulo);
      syncTrace("HEARTBEAT", "useAulaHeartbeat.presence", {
        kind: env.kind,
        roomId: env.roomId,
        senderInstanceId: env.senderInstanceId,
        eventId: env.eventId,
        seq: env.seq,
        moduleId: env.moduleId,
        sentAt: env.sentAt,
      });
      sendEnvelope(env);
    };
    beat();
    const id = window.setInterval(beat, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);

  // observed_position: solo quando cambia qualcosa di osservato.
  const signature = JSON.stringify(payload);
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const p = ref.current;
    const env = makeEnvelope("observed_position", p.modulo, {
      blockId: p.blocco,
      step: p.step,
      payload: { ...p, ts: Date.now() } as AulaHeartbeat,
    });
    syncTrace("HEARTBEAT", "useAulaHeartbeat.observedPosition", {
      kind: env.kind,
      roomId: env.roomId,
      senderInstanceId: env.senderInstanceId,
      eventId: env.eventId,
      seq: env.seq,
      moduleId: env.moduleId,
      blockId: env.blockId,
      step: env.step,
      ackTs: p.ackTs ?? null,
      sentAt: env.sentAt,
    });
    sendEnvelope(env);
  }, [enabled, signature]);
};

/**
 * Regia: presenza + posizione osservata dell'Aula della stanza.
 * La presenza NON tocca mai blocco/step.
 */
export const useAulaHeartbeatMonitor = (
  modulo: string,
  expectedAckTs: number | null = null,
  offlineAfterMs = 6000,
) => {
  const [observed, setObserved] = useState<AulaHeartbeat | null>(null);
  const [presence, setPresence] = useState<{ moduleId: string; at: number } | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const ackRef = useRef<number | null>(expectedAckTs);
  ackRef.current = expectedAckTs;

  useBusListener("presence", (e) => {
    setPresence({ moduleId: e.moduleId, at: Date.now() });
  });

  useBusListener("observed_position", (e) => {
    const b = e.payload as AulaHeartbeat | undefined;
    if (!b) return;
    const expected = ackRef.current;
    // Regola esplicita: durante una transizione comandata accettiamo la nuova
    // posizione osservata solo quando l'Aula conferma il comando in corso.
    if (expected != null && b.ackTs !== expected && b.modulo === modulo) {
      traceEnv("monitor.reject", e, {
        reason: "not-acking-current-command",
        beatAckTs: b.ackTs ?? null,
        expectedAckTs: expected,
      });
      return;
    }
    traceEnv("monitor.observedPosition", e, { reason: "accepted" });
    setObserved({ ...b, ts: Date.now() });
  });

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(tick);
  }, []);

  const presenceAt = presence?.at ?? 0;
  const sinceMs = presenceAt ? now - presenceAt : Infinity;
  const connected = presenceAt > 0 && sinceMs < offlineAfterMs;
  const aulaModule = presence?.moduleId ?? observed?.modulo;
  const sameModule = aulaModule === modulo;
  const last = observed && observed.modulo === modulo ? observed : null;

  return useMemo(
    () => ({
      /** Ultima posizione osservata del modulo corrente. */
      heartbeat: last,
      /** Posizione osservata con Aula presente: unica fonte di posizione. */
      liveHeartbeat: connected && sameModule ? last : null,
      /** Modulo su cui si trova davvero l'Aula, se diverso da quello in Regia. */
      foreignModulo: connected && !sameModule ? (aulaModule ?? null) : null,
      connected,
      online: connected && sameModule,
      sinceMs,
    }),
    [last, connected, sameModule, aulaModule, sinceMs],
  );
};
