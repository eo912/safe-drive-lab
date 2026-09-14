import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INSTANCE_ID, ROOM_ID } from "./aulaRoom";
import type { Resource } from "./instructorTypes";
import type { PauseAtmosphere } from "./pauseAtmosphere";
import type { EmbedPayload } from "./sceneMedia";
import { syncTrace } from "./syncTrace";
import { isSyncEnabled, onSyncEnabledChange } from "./syncEnabled";

/**
 * Sincronizzazione Regia ↔ Aula — versione semplificata.
 *
 * Due soli eventi, un solo trasporto (Supabase Realtime), una sola
 * sottoscrizione per pagina/stanza:
 *  - `navigation_command`  Regia → Aula: destinazione richiesta.
 *  - `aula_position`       Aula → Regia: posizione scelta dall'utente in Aula.
 *
 * Regole:
 *  - la ricezione applica in locale e basta: nessun evento di risposta;
 *  - la posizione risultante da un comando remoto è soppressa una sola volta,
 *    così lo scroll pilotato non viene scambiato per un gesto dell'utente;
 *  - con SINCRONIZZAZIONE OFF non si apre alcun canale, non si invia e non si
 *    applica nulla.
 *
 * Disattivati in questa versione (codice rimosso dal flusso attivo):
 * heartbeat/presence, monitor di connessione, polling, request_state, retry
 * alla riconnessione, snapshot da localStorage, BroadcastChannel locale.
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

/** Posizione dichiarata dall'Aula dopo un gesto dell'utente. */
export type AulaHeartbeat = {
  modulo: string;
  blocco: string;
  step: AulaStep;
  paused: boolean;
  pauseAtmosphere?: PauseAtmosphere;
  riskProbability?: number;
  ackTs?: number;
  /** Momento in cui l'Aula ha chiuso da sola l'overlay telefono (verde/rosso). */
  phoneDismissTs?: number;
  ts: number;
};

/* ------------------------------------------------------------------ *
 * Busta                                                               *
 * ------------------------------------------------------------------ */

export type EventKind = "navigation_command" | "aula_position";

type Envelope = {
  kind: EventKind;
  roomId: string;
  senderInstanceId: string;
  eventId: string;
  sentAt: number;
  moduleId: string;
  blockId?: string;
  step?: AulaStep;
  payload?: unknown;
};

const REMOTE_ROOM = `safedrivelab-aula-live:${ROOM_ID}`;

let seqCounter = 0;
const seenEventIds = new Set<string>();
const seenOrder: string[] = [];

const rememberEvent = (id: string) => {
  seenEventIds.add(id);
  seenOrder.push(id);
  if (seenOrder.length > 500) {
    const old = seenOrder.shift();
    if (old) seenEventIds.delete(old);
  }
};

const makeEnvelope = (
  kind: EventKind,
  moduleId: string,
  extra: Partial<Envelope> = {},
): Envelope => ({
  kind,
  roomId: ROOM_ID,
  senderInstanceId: INSTANCE_ID,
  eventId: `${INSTANCE_ID}-${++seqCounter}`,
  sentAt: Date.now(),
  moduleId,
  ...extra,
});

const traceEnv = (where: string, e: Envelope, extra: Record<string, unknown> = {}) =>
  syncTrace("REALTIME", where, {
    kind: e.kind,
    roomId: e.roomId,
    senderInstanceId: e.senderInstanceId,
    eventId: e.eventId,
    sentAt: e.sentAt,
    moduleId: e.moduleId,
    blockId: e.blockId,
    step: e.step,
    receivedAt: Date.now(),
    ...extra,
  });

const acceptEnvelope = (e: Envelope | null | undefined): e is Envelope => {
  if (!e || typeof e !== "object" || !e.kind || !e.eventId) return false;
  if (!isSyncEnabled()) {
    traceEnv("bus.reject", e, { reason: "sync-off" });
    return false;
  }
  if (e.roomId !== ROOM_ID) {
    traceEnv("bus.reject", e, { reason: "wrong-room", expectedRoomId: ROOM_ID });
    return false;
  }
  if (e.senderInstanceId === INSTANCE_ID) return false;
  if (seenEventIds.has(e.eventId)) {
    traceEnv("bus.reject", e, { reason: "duplicate-event" });
    return false;
  }
  rememberEvent(e.eventId);
  return true;
};

/* ------------------------------------------------------------------ *
 * Una sola sottoscrizione remota per pagina/stanza                     *
 * ------------------------------------------------------------------ */

type Handler = (e: Envelope) => void;
const handlers = new Map<EventKind, Set<Handler>>();

const dispatch = (raw: unknown) => {
  const e = raw as Envelope;
  if (!acceptEnvelope(e)) return;
  handlers.get(e.kind)?.forEach((fn) => fn(e));
};

let channel: ReturnType<typeof supabase.channel> | null = null;
let listenerCount = 0;

const openChannel = () => {
  if (typeof window === "undefined") return null;
  if (!isSyncEnabled() || listenerCount === 0) return null;
  if (channel) return channel;
  channel = supabase
    .channel(REMOTE_ROOM, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "sync" }, ({ payload }) => dispatch(payload));
  channel.subscribe();
  return channel;
};

const closeChannel = () => {
  const ch = channel;
  channel = null;
  if (!ch) return;
  try {
    void supabase.removeChannel(ch);
  } catch {
    /* ignore */
  }
};

if (typeof window !== "undefined") {
  onSyncEnabledChange((on) => (on ? openChannel() : closeChannel()));
}

const sendEnvelope = (e: Envelope) => {
  if (!isSyncEnabled()) {
    traceEnv("bus.skip", e, { reason: "sync-off" });
    return;
  }
  rememberEvent(e.eventId);
  const ch = openChannel();
  if (!ch) return;
  try {
    void Promise.resolve(
      ch.send({ type: "broadcast", event: "sync", payload: e }),
    ).catch(() => {
      /* rete assente: il cambio locale resta comunque applicato */
    });
  } catch {
    /* rete assente: il cambio locale resta comunque applicato */
  }
};

const useBusListener = (kind: EventKind, fn: Handler) => {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const handler: Handler = (e) => ref.current(e);
    let set = handlers.get(kind);
    if (!set) {
      set = new Set();
      handlers.set(kind, set);
    }
    set.add(handler);
    listenerCount += 1;
    openChannel();
    return () => {
      set?.delete(handler);
      listenerCount = Math.max(0, listenerCount - 1);
      if (listenerCount === 0) closeChannel();
    };
  }, [kind]);
};

/* ------------------------------------------------------------------ *
 * Soppressione one-shot della posizione comandata                      *
 * ------------------------------------------------------------------ */

let suppressedPosition: string | null = null;
/** Finestra di assestamento dello scroll pilotato dal comando remoto. */
let suppressUntil = 0;
const SETTLE_MS = 1800;
const posKey = (blocco: string, step: AulaStep) => `${blocco}:${step}`;

/* ------------------------------------------------------------------ *
 * URL (solo locale: replaceState, nessun invio)                        *
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

  const setPreview = useCallback(
    (patch: Partial<Omit<AulaState, "ts" | "modulo">>) => {
      setPreviewState((prev) => ({ ...prev, ...patch, modulo, ts: Date.now() }));
    },
    [modulo],
  );

  /** Gesto dell'utente in Regia: applica subito in locale, invia un solo evento. */
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
          moduleId: next.modulo,
          previousBlockId: prev.blocco,
          requestedBlockId: next.blocco,
          step: next.step,
          sentAt: env.sentAt,
        });
        sendEnvelope(env);
        setLiveState(next);
        return next;
      });
    },
    [modulo],
  );

  /** Allinea "in onda" alla posizione dichiarata dall'Aula. Non invia nulla. */
  const syncLiveFromAula = useCallback((pos: { blocco: string; step: AulaStep }) => {
    setLiveState((prev) => {
      if (!prev) return prev;
      if (prev.blocco === pos.blocco && prev.step === pos.step) return prev;
      const next: AulaState = { ...prev, blocco: pos.blocco, step: pos.step };
      writeToUrl(next);
      return next;
    });
  }, []);

  return { previewState, liveState, setPreview, publish, syncLiveFromAula };
};

/** Regia: ultima posizione dichiarata dall'Aula (nessuna risposta generata). */
export const useAulaPosition = (modulo: string) => {
  const [position, setPosition] = useState<AulaHeartbeat | null>(null);

  useBusListener("aula_position", (e) => {
    const p = e.payload as AulaHeartbeat | undefined;
    if (!p) return;
    if (p.modulo !== modulo) {
      traceEnv("regia.reject", e, { reason: "other-module" });
      return;
    }
    traceEnv("regia.applyAulaPosition", e, { reason: "accepted" });
    setPosition({ ...p, ts: Date.now() });
  });

  return position;
};

/* ------------------------------------------------------------------ *
 * AULA                                                                *
 * ------------------------------------------------------------------ */

export const useAulaSubscriber = (modulo: string, defaultBlocco: string) => {
  const [state, setState] = useState<AulaState>(() => readFromUrl(modulo, defaultBlocco));
  const lastCmdTsRef = useRef(0);

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
    traceEnv("useAulaSubscriber.apply", e, { reason: "accepted" });
    lastCmdTsRef.current = cmdTs;
    // Soppressione one-shot: la posizione prodotta da questo comando non è
    // un gesto dell'utente e non deve tornare indietro come aula_position.
    suppressedPosition = posKey(incoming.blocco, incoming.step);
    suppressUntil = Date.now() + SETTLE_MS;
    writeToUrl(incoming);
    setState({ ...incoming, ts: Date.now() });
  });

  return state;
};

/**
 * Aula → Regia. Nessun battito periodico: un solo evento quando la posizione
 * realmente visibile cambia per un gesto dell'utente.
 */
export const useAulaHeartbeat = (
  enabled: boolean,
  payload: Omit<AulaHeartbeat, "ts">,
  _intervalMs = 1500,
) => {
  const ref = useRef(payload);
  ref.current = payload;
  const firstRunRef = useRef(true);

  // L'indirizzo della finestra Aula riflette la scena realmente visibile.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const { blocco, step } = payload;
    if (!blocco) return;
    writeToUrl({ blocco, step });
  }, [enabled, payload.blocco, payload.step, payload]);

  const signature = `${payload.blocco}:${payload.step}:${payload.paused}:${payload.pauseAtmosphere ?? ""}:${payload.riskProbability ?? ""}:${payload.phoneDismissTs ?? ""}`;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    const p = ref.current;
    const key = posKey(p.blocco, p.step);
    if (suppressedPosition === key || Date.now() < suppressUntil) {
      if (suppressedPosition === key) suppressedPosition = null;
      syncTrace("AULA", "useAulaHeartbeat.suppressed", {
        roomId: ROOM_ID,
        moduleId: p.modulo,
        blockId: p.blocco,
        step: p.step,
        reason: "remote-applied",
      });
      return;
    }
    const env = makeEnvelope("aula_position", p.modulo, {
      blockId: p.blocco,
      step: p.step,
      payload: { ...p, ts: Date.now() } as AulaHeartbeat,
    });
    syncTrace("AULA", "useAulaHeartbeat.send", {
      kind: env.kind,
      roomId: env.roomId,
      senderInstanceId: env.senderInstanceId,
      eventId: env.eventId,
      moduleId: env.moduleId,
      blockId: env.blockId,
      step: env.step,
      sentAt: env.sentAt,
    });
    sendEnvelope(env);
  }, [enabled, signature]);
};
