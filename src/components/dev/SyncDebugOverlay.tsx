import { useState } from "react";
import type { AulaState } from "@/lib/aulaSync";

type Props = {
  side: "istruttore" | "aula";
  live?: AulaState | null;
  preview?: AulaState | null;
  mode?: "lineare" | "regia";
};

/**
 * Indicatore tecnico DEV per verificare la sincronizzazione Regia ↔ Aula.
 * Visibile solo in import.meta.env.DEV. Click per minimizzare.
 * Mai mostrato in produzione, mai visibile durante una sessione reale.
 */
export const SyncDebugOverlay = ({ side, live, preview, mode }: Props) => {
  const [open, setOpen] = useState(true);
  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-label="Debug sync (dev)"
      className="fixed bottom-2 left-2 z-[100] text-left rounded-md border border-amber-500/30 bg-black/80 backdrop-blur px-2 py-1.5 text-[10px] font-mono leading-tight text-amber-200/90 shadow-lg hover:border-amber-500/60 transition-colors max-w-[260px]"
    >
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="uppercase tracking-wider">
          dev · sync · {side}
        </span>
      </div>
      {open && (
        <div className="mt-1 space-y-0.5 text-amber-100/80">
          {mode && (
            <div>
              mode: <span className="text-amber-300">{mode}</span>
            </div>
          )}
          <div>
            live:{" "}
            <span className="text-emerald-300">
              {live ? `${live.blocco}/${live.step}` : "—"}
            </span>
            {live?.paused && <span className="text-amber-400"> · PAUSA</span>}
          </div>
          {preview && (
            <div>
              prev:{" "}
              <span className="text-sky-300">
                {preview.blocco}/{preview.step}
              </span>
            </div>
          )}
          {live?.ts && (
            <div className="opacity-60">
              ts: {new Date(live.ts).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </button>
  );
};
