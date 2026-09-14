/**
 * Log diagnostici per la sincronizzazione Regia ↔ Aula.
 * Silenziosi per impostazione predefinita: si attivano con
 *   ?synctrace=1  (persistito in localStorage)
 * oppure localStorage.setItem("sdl-sync-trace", "1").
 * Si spengono con ?synctrace=0.
 */

export type TraceSource =
  | "REGIA"
  | "AULA"
  | "REALTIME"
  | "HEARTBEAT"
  | "LOCAL_EFFECT"
  | "INIT"
  | "RESET";

const KEY = "sdl-sync-trace";

let enabled = false;
export let SYNC_SESSION_ID = "srv";

if (typeof window !== "undefined") {
  try {
    const p = new URLSearchParams(window.location.search).get("synctrace");
    if (p === "1") localStorage.setItem(KEY, "1");
    if (p === "0") localStorage.removeItem(KEY);
    enabled = localStorage.getItem(KEY) === "1";
  } catch {
    /* ignore */
  }
  SYNC_SESSION_ID = Math.random().toString(36).slice(2, 8);
}

export const syncTraceEnabled = () => enabled;

export const syncTrace = (
  source: TraceSource,
  where: string,
  data: Record<string, unknown> = {},
) => {
  if (!enabled) return;
  // eslint-disable-next-line no-console
  console.log(
    "[SYNC_TRACE]",
    JSON.stringify({
      iso: new Date().toISOString(),
      perf: Math.round(performance.now()),
      source,
      where,
      sessionId: SYNC_SESSION_ID,
      ...data,
    }),
  );
};
