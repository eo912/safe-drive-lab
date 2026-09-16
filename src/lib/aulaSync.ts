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
 * heartbeat/presence, polling, snapshot da localStorage, BroadcastChannel
 * locale.
 *
 * Riconnessione: se il canale cade (CHANNEL_ERROR, TIMED_OUT o CLOSED) viene
 * ricreato da solo con un ritardo crescente tra i tentativi. Quando l'Aula si
 * (ri)aggancia invia un `request_state`: la Regia risponde ripubblicando la
 * propria posizione corrente come un normale `navigation_command`.
 *
 * Navigazione vs azioni secondarie: solo i comandi marcati `isNavigation`
 * (avanti/indietro/vai a, dalla Regia) spostano la scena in Aula. Le azioni
 * secondarie (video, pausa, blackout, ...) viaggiano sullo stesso evento
 * `navigation_command` ma senza quel flag: l'Aula applica i campi non
 * posizionali e ignora blocco/step, restando dove si trova realmente anche
 * se la Regia ne conosce una posizione vecchia.
 *
 * `reveal_video_request` (Aula → Regia): richiamo di un video cliccando
 * direttamente sul segnaposto in Aula, in aggiunta al pulsante in Regia. La
 * Regia riusa la stessa toggleVideo del pulsante: nessuna logica duplicata.
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
  /** Id dei video YouTube richiamati manualmente dall'istruttore. */
  revealedVideos?: string[];
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

export type EventKind =
  | "navigation_command"
  | "aula_position"
  | "aula_status"
  | "request_state"
  | "reveal_video_request";

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
  /**
   * Solo per `navigation_command`: true se è un vero spostamento di scena
   * (avanti/indietro/vai a, dalla Regia). Assente/false per le azioni
   * secondarie (video, pausa, blackout, ...), che non devono muovere l'Aula
   * da dove si trova realmente.
   */
  isNavigation?: boolean;
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
    isNavigation: e.isNavigation,
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

/** Stato del canale realtime, per l'indicatore visivo in Aula. */
export type AulaConnStatus = "connected" | "connecting" | "disconnected";

let connStatus: AulaConnStatus = "disconnected";
const connStatusListeners = new Set<(s: AulaConnStatus) => void>();

const setConnStatus = (s: AulaConnStatus) => {
  if (connStatus === s) return;
  connStatus = s;
  connStatusListeners.forEach((fn) => fn(s));
};

export const onAulaConnStatusChange = (fn: (s: AulaConnStatus) => void) => {
  connStatusListeners.add(fn);
  return () => {
    connStatusListeners.delete(fn);
  };
};

/** Aula: mostra un indicatore solo quando il canale non è connesso. */
export const useAulaConnectionStatus = (): AulaConnStatus => {
  const [status, setStatus] = useState(connStatus);
  useEffect(() => onAulaConnStatusChange(setStatus), []);
  return status;
};

/** Notificati ad ogni aggancio (o riaggancio) riuscito del canale. */
const subscribedListeners = new Set<() => void>();
const onChannelSubscribed = (fn: () => void) => {
  subscribedListeners.add(fn);
  return () => {
    subscribedListeners.delete(fn);
  };
};

let channel: ReturnType<typeof supabase.channel> | null = null;
let listenerCount = 0;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 10000;

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  if (!isSyncEnabled() || listenerCount === 0) return;
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openChannel();
  }, delay);
};

const openChannel = () => {
  if (typeof window === "undefined") return null;
  if (!isSyncEnabled() || listenerCount === 0) return null;
  if (channel) return channel;
  clearReconnectTimer();
  setConnStatus("connecting");
  const ch = supabase
    .channel(REMOTE_ROOM, { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "sync" }, ({ payload }) => dispatch(payload));
  channel = ch;
  ch.subscribe((status) => {
    if (channel !== ch) return; // canale già sostituito: ignora callback tardivi
    if (status === "SUBSCRIBED") {
      reconnectAttempt = 0;
      clearReconnectTimer();
      setConnStatus("connected");
      subscribedListeners.forEach((fn) => fn());
      return;
    }
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      channel = null;
      try {
        void supabase.removeChannel(ch);
      } catch {
        /* ignore */
      }
      setConnStatus("disconnected");
      scheduleReconnect();
    }
  });
  return channel;
};

const closeChannel = () => {
  clearReconnectTimer();
  reconnectAttempt = 0;
  const ch = channel;
  channel = null;
  setConnStatus("disconnected");
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

/** Sottoscrizione generica al bus di sincronizzazione, per eventi dedicati
 *  che non hanno un hook specifico (es. `reveal_video_request`). */
export const useBusListener = (kind: EventKind, fn: Handler) => {
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
const SETTLE_MS = 3000;
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
  const liveStateRef = useRef<AulaState | null>(null);
  liveStateRef.current = liveState;

  const setPreview = useCallback(
    (patch: Partial<Omit<AulaState, "ts" | "modulo">>) => {
      setPreviewState((prev) => ({ ...prev, ...patch, modulo, ts: Date.now() }));
    },
    [modulo],
  );

  /**
   * Gesto dell'utente in Regia: applica subito in locale, invia un solo
   * evento. `opts.isNavigation` va messo a true SOLO per i comandi che
   * devono davvero spostare la scena in Aula (avanti/indietro/vai a);
   * le azioni secondarie (video, pausa, blackout, ...) lo lasciano assente,
   * così l'Aula ignora blocco/step e resta dove si trova realmente.
   */
  const publish = useCallback(
    (
      patch?: Partial<Omit<AulaState, "ts" | "modulo">>,
      opts?: { isNavigation?: boolean },
    ) => {
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
          isNavigation: opts?.isNavigation === true,
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
          isNavigation: env.isNavigation,
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

  /** L'Aula si è (ri)agganciata al canale: ripubblica la posizione in onda. */
  useBusListener("request_state", (e) => {
    const req = e.payload as { modulo?: string } | undefined;
    if ((req?.modulo ?? e.moduleId) !== modulo) {
      traceEnv("regia.rejectRequestState", e, { reason: "other-module" });
      return;
    }
    const current = liveStateRef.current;
    if (!current) return;
    const resync: AulaState = { ...current, cmdTs: Date.now(), ts: Date.now() };
    const env = makeEnvelope("navigation_command", modulo, {
      blockId: resync.blocco,
      step: resync.step,
      payload: resync,
      isNavigation: true,
    });
    traceEnv("regia.resync", env, { reason: "request_state" });
    sendEnvelope(env);
  });

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

    if (e.isNavigation) {
      // Vero comando di navigazione (avanti/indietro/vai a): sposta la scena.
      // Soppressione one-shot: la posizione prodotta da questo comando non è
      // un gesto dell'utente e non deve tornare indietro come aula_position.
      suppressedPosition = posKey(incoming.blocco, incoming.step);
      suppressUntil = Date.now() + SETTLE_MS;
      writeToUrl(incoming);
      setState({ ...incoming, ts: Date.now() });
      return;
    }

    // Azione secondaria (video, pausa, blackout, ...): NON sposta la scena.
    // blocco/step/ts restano quelli che l'Aula ha già, così un comando che
    // porta con sé una posizione vecchia (nota solo alla Regia) non fa
    // saltare l'Aula via da dove l'istruttore l'ha portata manualmente.
    setState((prev) => ({
      ...incoming,
      blocco: prev.blocco,
      step: prev.step,
      ts: prev.ts,
    }));
  });

  // Ad ogni aggancio (o riaggancio dopo una caduta) chiede una volta sola
  // alla Regia la posizione corrente, per riallinearsi senza ricaricare.
  useEffect(() => {
    return onChannelSubscribed(() => {
      const env = makeEnvelope("request_state", modulo, { payload: { modulo } });
      traceEnv("aula.requestState", env, {});
      sendEnvelope(env);
    });
  }, [modulo]);

  return state;
};

/**
 * Aula: richiede alla Regia di richiamare un video cliccando direttamente
 * sul segnaposto, in aggiunta al pulsante in Regia (stesso risultato: la
 * Regia riceve `reveal_video_request` e chiama la sua toggleVideo esistente,
 * quindi pubblica revealedVideos come farebbe con un click sul pulsante).
 */
export const useRequestVideoReveal = (modulo: string) =>
  useCallback(
    (videoId: string) => {
      const env = makeEnvelope("reveal_video_request", modulo, {
        payload: { videoId },
      });
      traceEnv("aula.requestVideoReveal", env, { videoId });
      sendEnvelope(env);
    },
    [modulo],
  );

/**
 * Aula: solo effetti locali. La sincronizzazione è UNIDIREZIONALE
 * (Regia → Aula): l'Aula determina la propria posizione visibile per il
 * proprio funzionamento interno (URL, timer, scroll) ma NON la trasmette
 * più alla Regia — nessun evento "aula_position" viene inviato, così una
 * posizione vecchia non può tornare indietro come falsa conferma (ack)
 * del comando appena pubblicato.
 *
 * Eccezione dedicata: "aula_status" porta SOLO dati di stato che non
 * muovono la scena (chiusura overlay telefono, probabilità di rischio),
 * senza blocco/step: non può creare rimbalzi di posizione.
 */
export const useAulaHeartbeat = (
  enabled: boolean,
  payload: Omit<AulaHeartbeat, "ts">,
  _intervalMs = 1500,
) => {
  // L'indirizzo della finestra Aula riflette la scena realmente visibile.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const { blocco, step } = payload;
    if (!blocco) return;
    writeToUrl({ blocco, step });
  }, [enabled, payload.blocco, payload.step, payload]);

  // Evento dedicato e separato dalla posizione: solo stato non-posizionale.
  const statusSignature = `${payload.riskProbability ?? ""}:${payload.phoneDismissTs ?? ""}`;
  const firstStatusRef = useRef(true);
  const statusRef = useRef(payload);
  statusRef.current = payload;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (firstStatusRef.current) {
      firstStatusRef.current = false;
      return;
    }
    const p = statusRef.current;
    const env = makeEnvelope("aula_status", p.modulo, {
      payload: {
        modulo: p.modulo,
        riskProbability: p.riskProbability,
        phoneDismissTs: p.phoneDismissTs,
        ts: Date.now(),
      },
    });
    syncTrace("AULA", "useAulaHeartbeat.sendStatus", {
      kind: env.kind,
      roomId: env.roomId,
      senderInstanceId: env.senderInstanceId,
      eventId: env.eventId,
      moduleId: env.moduleId,
      sentAt: env.sentAt,
    });
    sendEnvelope(env);
  }, [enabled, statusSignature]);
};

/** Stato non-posizionale dichiarato dall'Aula (telefono, rischio). */
export type AulaStatus = {
  modulo: string;
  riskProbability?: number;
  phoneDismissTs?: number;
  ts: number;
};

/** Regia: ultimo stato non-posizionale dell'Aula (nessuna posizione). */
export const useAulaStatus = (modulo: string): AulaStatus | null => {
  const [status, setStatus] = useState<AulaStatus | null>(null);

  useBusListener("aula_status", (e) => {
    const p = e.payload as AulaStatus | undefined;
    if (!p) return;
    if (p.modulo !== modulo) {
      traceEnv("regia.rejectStatus", e, { reason: "other-module" });
      return;
    }
    traceEnv("regia.applyAulaStatus", e, { reason: "accepted" });
    setStatus({ ...p, ts: Date.now() });
  });

  return status;
};
