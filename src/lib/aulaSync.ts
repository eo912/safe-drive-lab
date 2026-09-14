import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isOnline, onConnectivityChange } from "./connectivity";
import type { Resource } from "./instructorTypes";
import type { PauseAtmosphere } from "./pauseAtmosphere";
import type { EmbedPayload } from "./sceneMedia";
import { syncTrace, SYNC_SESSION_ID } from "./syncTrace";

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
  /** Stato overlay telefono (solo lato Aula Live). */
  phonePhase?: "idle" | "ringing" | "visible";
  /** Blocco a cui è associato l'overlay telefono. */
  phoneBlock?: string;
  /** Timestamp dell'ultimo comando telefono, per scartare comandi vecchi dopo un reset locale. */
  phoneTs?: number;
  /** Stato della scena di pericolo improvviso (renderizzata solo in Aula Live). */
  hazardPhase?: "idle" | "active" | "resolved";
  hazardVariant?: "car-braking";
  hazardOutcome?: "stopped" | "failed";
  hazardTs?: number;
  /** Versione del comando: ts assegnato dalla Regia al momento della pubblicazione.
   *  Non viene mai riscritto dai destinatari: serve all'Aula per dichiarare
   *  QUALE comando sta eseguendo (ack) e alla Regia per scartare battiti
   *  obsoleti o provenienti da un'altra sessione. */
  cmdTs?: number;
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
  /** Probabilità corrente della catena, riservata alla Regia. */
  riskProbability?: number;
  /** Comando (cmdTs) che l'Aula sta eseguendo nel momento del battito. */
  ackTs?: number;
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

/**
 * Il canale remoto è solo un "di più": serve a un eventuale secondo
 * dispositivo in rete. Regia e Aula sullo stesso computer restano allineate
 * da BroadcastChannel + localStorage, che funzionano anche senza internet.
 * Quindi: nessuna sottoscrizione remota quando siamo offline.
 */
const getRemoteChannel = () => {
  if (typeof window === "undefined") return null;
  if (!isOnline()) return null;
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
  try {
    void Promise.resolve(ch.send({ type: "broadcast", event, payload })).catch(
      () => {
        /* offline: resta la sincronizzazione locale */
      },
    );
  } catch {
    /* offline: resta la sincronizzazione locale */
  }
};

// Al ritorno della rete ricreiamo la sottoscrizione remota da zero.
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
          cmdTs: Date.now(),
          ts: Date.now(),
        };
        writeToUrl(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        syncTrace("REGIA", "useAulaPublisher.publish", {
          moduleId: next.modulo,
          previousBlockId: prev.blocco,
          requestedBlockId: next.blocco,
          step: next.step,
          sentAt: next.ts,
        });
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

  // Rete tornata: ripubblichiamo lo stato corrente per eventuali altri device.
  useEffect(() => {
    const off = onConnectivityChange((online) => {
      const last = lastPublishedRef.current;
      if (online && last) window.setTimeout(() => remoteSend("state", last), 600);
    });
    return () => {
      off();
    };
  }, []);

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
  // Istante di apertura: nei primi secondi accettiamo anche uno stato
  // "vecchio", perché è la risposta alla nostra richiesta di allineamento.
  const mountedAtRef = useRef(Date.now());

  // Comandi provenienti da un ALTRO dispositivo (PC regia → TV).
  // Il timestamp arriva da un altro orologio: confrontiamo solo con l'ultimo
  // messaggio remoto ricevuto, mai con quello locale.
  useRemoteListener(remoteHandlers.state, (incoming: AulaState) => {
    if (!incoming || incoming.modulo !== modulo) return;
    // Ripetizioni dello stesso comando (ogni Regia collegata risponde alle
    // richieste di allineamento delle altre): riapplicarle faceva saltare
    // l'Aula indietro sulla scena di un'altra sessione.
    if (incoming.ts <= lastRemoteTsRef.current) {
      syncTrace("REALTIME", "useAulaSubscriber.rejectDuplicate", {
        moduleId: incoming.modulo,
        requestedBlockId: incoming.blocco,
        sentAt: incoming.ts,
        lastAppliedAt: lastRemoteTsRef.current,
      });
      return;
    }
    // Comando più vecchio dell'apertura di questa schermata: è valido solo
    // come risposta alla richiesta iniziale di allineamento.
    const joinWindow = Date.now() - mountedAtRef.current < 5000;
    if (incoming.ts < mountedAtRef.current && !joinWindow) {
      syncTrace("REALTIME", "useAulaSubscriber.rejectStaleCommand", {
        moduleId: incoming.modulo,
        requestedBlockId: incoming.blocco,
        sentAt: incoming.ts,
        mountedAt: mountedAtRef.current,
      });
      return;
    }
    syncTrace("REALTIME", "useAulaSubscriber.remote", {
      moduleId: incoming.modulo,
      requestedBlockId: incoming.blocco,
      step: incoming.step,
      sentAt: incoming.ts,
      receivedAt: Date.now(),
    });
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
      syncTrace("AULA", "useAulaSubscriber.applyLocal", {
        moduleId: incoming.modulo,
        requestedBlockId: incoming.blocco,
        step: incoming.step,
        sentAt: incoming.ts,
        receivedAt: Date.now(),
      });
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
      syncTrace("HEARTBEAT", "useAulaHeartbeat.send", {
        moduleId: beat.modulo,
        resultBlockId: beat.blocco,
        step: beat.step,
        sentAt: beat.ts,
      });
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
 * per più di `offlineAfterMs` (default 6000ms: tolleriamo qualche battito
 * perso su rete lenta o quando la scheda Aula viene rallentata dal browser).
 *
 * I battiti vengono raccolti da QUALSIASI modulo: se l'Aula passa da sola a
 * un altro modulo la Regia deve poterlo sapere, invece di mostrare un
 * fuorviante "Aula offline".
 */
export const useAulaHeartbeatMonitor = (
  modulo: string,
  expectedAckTs: number | null = null,
  offlineAfterMs = 6000,
) => {
  const [last, setLast] = useState<AulaHeartbeat | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Un battito è valido solo se dichiara di eseguire l'ULTIMO comando
  // pubblicato da questa Regia. Scarta sia i battiti in ritardo (l'Aula non
  // si è ancora allineata) sia quelli di un'altra sessione sullo stesso
  // canale: entrambi facevano tornare indietro la Regia.
  const ackRef = useRef<number | null>(expectedAckTs);
  ackRef.current = expectedAckTs;
  const accepts = useCallback((b: AulaHeartbeat) => {
    const expected = ackRef.current;
    if (expected == null) return true;
    if (b.ackTs === expected) return true;
    syncTrace("HEARTBEAT", "monitor.rejectStaleBeat", {
      moduleId: b.modulo,
      resultBlockId: b.blocco,
      beatAckTs: b.ackTs ?? null,
      expectedAckTs: expected,
    });
    return false;
  }, []);

  // Battito da un altro dispositivo: l'orologio è diverso, quindi lo
  // normalizziamo sull'ora locale per il calcolo online/offline.
  useRemoteListener(remoteHandlers.heartbeat, (b: AulaHeartbeat) => {
    if (!b) return;
    if (!accepts(b)) return;
    syncTrace("HEARTBEAT", "monitor.remoteBeat", {
      moduleId: b.modulo,
      resultBlockId: b.blocco,
      step: b.step,
      sentAt: b.ts,
      receivedAt: Date.now(),
    });
    setLast({ ...b, ts: Date.now() });
  });


  useEffect(() => {
    const apply = (b: AulaHeartbeat) => {
      if (!accepts(b)) return;
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
  }, [accepts]);

  const sinceMs = last ? now - last.ts : Infinity;
  const connected = last !== null && sinceMs < offlineAfterMs;
  const sameModule = last?.modulo === modulo;
  return {
    /** Ultimo battito del modulo corrente (anche se non più recente). */
    heartbeat: sameModule ? last : null,
    /** Battito recente E del modulo corrente: unica fonte affidabile di posizione. */
    liveHeartbeat: connected && sameModule ? last : null,
    /** Modulo su cui si trova davvero l'Aula, se diverso da quello in Regia. */
    foreignModulo: connected && !sameModule ? (last as AulaHeartbeat).modulo : null,
    /** Aula raggiungibile (qualsiasi modulo). */
    connected,
    /** Aula raggiungibile e allineata sul modulo corrente. */
    online: connected && sameModule,
    sinceMs,
  };
};

